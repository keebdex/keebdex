import slugify from 'slugify'
import { colorwaySchema, sculptSchema } from '~/utils/schemas/artisan'
import { entitySelectionSchema } from '~/utils/schemas/common'

export const useArtisanSubmissionWizard = ({
  mode = 'create',
  submission,
}: {
  mode?: 'create' | 'review'
  submission?: Record<string, any> | null
} = {}) => {
  const route = useRoute()
  const toast = useToast()
  const userStore = useUserStore()
  const isReview = mode === 'review'

  const maker = ref({ id: String(route.query.maker || '') })
  const sculptMode = ref('existing')
  const existingSculpt = ref({ id: String(route.query.sculpt || '') })

  const sculpt = ref({
    name: '',
    release: '',
    profile: null,
    cast: null,
    design: null,
    collection: null,
    is_revision_of: null,
    story: '',
  })

  const uploading = ref(false)

  const { data: makers, status: makersStatus } = useAsyncData<any[]>(
    'artisan-submission-makers',
    () => $fetch('/api/makers'),
    { default: () => [] },
  )

  const makerOptions = computed(() =>
    (makers.value || []).map((maker: any) => ({
      label: maker.name,
      value: maker.id,
    })),
  )

  const { data: makerDetail, status: sculptsStatus } = useAsyncData<any>(
    () => `artisan-submission-sculpts-${maker.value.id}`,
    () =>
      (maker.value.id
        ? $fetch(`/api/makers/${maker.value.id}`)
        : null) as Promise<any>,
    { watch: [() => maker.value.id], default: () => null },
  )

  // /api/makers/[maker] returns `sculpts` keyed by sculpt_id, not an array.
  const sculpts = computed(() =>
    Object.values(makerDetail.value?.sculpts || {}),
  )

  const sculptOptions = computed(() =>
    sculpts.value.map((sculpt: any) => ({
      label: sculpt.name,
      value: sculpt.sculpt_id,
    })),
  )

  watch([sculptOptions, sculptsStatus], ([options, status]) => {
    if (status !== 'pending' && maker.value.id && !options.length) {
      sculptMode.value = 'new'
    }
  })

  watch(
    () => maker.value.id,
    () => {
      existingSculpt.value = { id: '' }
    },
  )

  const rawOrderOverride = route.params.order ?? route.query.order
  const orderOverride =
    rawOrderOverride !== undefined && rawOrderOverride !== ''
      ? Number(rawOrderOverride)
      : NaN

  const selectedSculptDetail = computed(() =>
    sculpts.value.find(
      (item: any) => item.sculpt_id === existingSculpt.value.id,
    ),
  )

  // Where new colorways start counting from: an explicit override, or the
  // selected sculpt's current colorway count (0 for a brand-new sculpt).
  const baseOrder = computed(() => {
    if (!Number.isNaN(orderOverride)) return orderOverride

    if (sculptMode.value === 'existing' && selectedSculptDetail.value) {
      return Number((selectedSculptDetail.value as any).total_colorways) || 0
    }

    return 0
  })

  let colorwayKeySeed = 0
  const colorways = ref<any[]>([])

  const newColorway = () => ({
    _key: colorwayKeySeed++,
    name: '',
    img: '',
    order: baseOrder.value + colorways.value.length + 1,
    currency: 'USD',
    sale_type: 'Raffle',
  })

  colorways.value.push(newColorway())

  const addColorway = () => {
    colorways.value.push(newColorway())
  }

  const removeColorway = (index: number) => {
    if (colorways.value.length > 1) colorways.value.splice(index, 1)
  }

  const reviewStatus = ref<string | null>(null)
  const sculptReviewStatus = ref<string | null>(null)
  const originalColorwayIds = ref<number[]>([])

  const load = async () => {
    if (!isReview || !submission) return

    maker.value = { id: submission.maker_id }
    await nextTick()
    sculptMode.value = 'existing'
    existingSculpt.value = { id: submission.sculpt_id }
    reviewStatus.value = submission.review_status
    colorways.value = [{ ...submission, _key: colorwayKeySeed++ }]
    originalColorwayIds.value = [submission.id]

    // The sculpt may itself be a proposal submitted alongside this colorway
    // (see server/api/makers/[maker]/sculpts/[sculpt].post.ts) — while it's
    // still under review, render it as an editable form instead of a locked
    // "existing" select so it can be reviewed/edited together with the colorway.
    if (['Pending', 'Rejected'].includes(submission.sculpt?.review_status)) {
      try {
        const sculptDetail: any = await $fetch(
          `/api/makers/${submission.maker_id}/sculpts/${submission.sculpt_id}`,
        )

        sculptMode.value = 'new'
        sculptReviewStatus.value = submission.sculpt.review_status
        Object.assign(sculpt.value, {
          id: sculptDetail.id,
          name: sculptDetail.name,
          release: sculptDetail.release,
          profile: sculptDetail.profile,
          cast: sculptDetail.cast,
          design: sculptDetail.design,
          collection: sculptDetail.collection,
          is_revision_of: sculptDetail.is_revision_of,
          story: sculptDetail.story,
        })
      } catch {
        // Fall back to the locked existing-sculpt select below.
      }
    }
  }

  // Staff can edit anything; submitters only while it's Pending or Rejected
  // (editing a rejected colorway sends it back to review).
  const canSave = computed(
    () =>
      isReview &&
      (userStore.isModerator ||
        ['Pending', 'Rejected'].includes(reviewStatus.value || '')),
  )

  const canDelete = computed(() => canSave.value)

  const save = async (action: 'update' | 'approve' | 'reject' = 'update') => {
    if (sculptReviewStatus.value) {
      await $fetch(
        `/api/makers/${maker.value.id}/sculpts/${existingSculpt.value.id}`,
        {
          method: 'post',
          body: {
            ...sculpt.value,
            maker_id: maker.value.id,
            sculpt_id: existingSculpt.value.id,
          },
        },
      )
    }

    const currentIds = colorways.value.map((item) => item.id).filter(Boolean)
    const removedIds = originalColorwayIds.value.filter(
      (id) => !currentIds.includes(id),
    )

    for (const id of removedIds) {
      await $fetch(
        `/api/makers/${maker.value.id}/sculpts/${existingSculpt.value.id}/colorways/${id}`,
        { method: 'delete' },
      )
    }

    for (const colorway of colorways.value) {
      const { _key, ...colorwayData } = colorway
      const [saved] = await $fetch<any[]>(
        `/api/makers/${maker.value.id}/sculpts/${existingSculpt.value.id}/colorways`,
        {
          method: 'post',
          body: {
            ...colorwayData,
            ...(action === 'update' ? {} : { action }),
          },
        },
      )
      if (!colorway.id) colorway.id = saved.id
    }

    originalColorwayIds.value = colorways.value
      .map((item) => item.id)
      .filter(Boolean)
  }

  const remove = async () => {
    const colorwayId = submission?.id
    if (!colorwayId) return

    await $fetch(
      `/api/makers/${maker.value.id}/sculpts/${existingSculpt.value.id}/colorways/${colorwayId}`,
      { method: 'delete' },
    )
  }

  // Re-sync colorways still on their auto-computed order when baseOrder
  // changes; anything the user has edited manually is left alone.
  watch(baseOrder, (next, prev) => {
    colorways.value.forEach((colorway, index) => {
      if (colorway.order === prev + index + 1) {
        colorway.order = next + index + 1
      }
    })
  })

  // Drives the Next button's disabled state so the wizard can't advance
  // past a step whose entity hasn't been picked yet.
  const canAdvance = computed(() => [
    !!maker.value.id,
    sculptMode.value === 'existing'
      ? !!existingSculpt.value.id
      : !!sculpt.value.name?.trim(),
    true,
  ])

  const stepSchemas = [
    () => entitySelectionSchema.safeParse(maker.value),
    () =>
      sculptMode.value === 'existing'
        ? entitySelectionSchema.safeParse(existingSculpt.value)
        : sculptSchema.safeParse(sculpt.value),
    () => {
      const schema = colorwaySchema.omit({
        maker_id: true,
        sculpt_id: true,
        maker_sculpt_id: true,
      })

      for (const colorway of colorways.value) {
        const result = schema.safeParse(colorway)
        if (!result.success) return result
      }

      return { success: true as const }
    },
  ]

  const validateStep = (index: number) => {
    const result = stepSchemas[index]?.()

    if (!result || result.success) return true

    toast.add(handleError({ statusMessage: result.error.issues[0]?.message }))
    return false
  }

  const submit = async () => {
    uploading.value = true

    try {
      let sculptId = existingSculpt.value.id

      if (sculptMode.value === 'new') {
        const slug = slugify(sculpt.value.name, { lower: true })

        await $fetch(`/api/makers/${maker.value.id}/sculpts/${slug}`, {
          method: 'post',
          body: {
            ...sculpt.value,
            maker_id: maker.value.id,
            sculpt_id: slug,
            source: 'keebdex',
            overridden_fields: [],
          },
        })

        sculptId = slug
      }

      const createdColorways = []

      for (const colorway of colorways.value) {
        const { _key, ...colorwayData } = colorway
        const payload = {
          ...colorwayData,
          maker_id: maker.value.id,
          sculpt_id: sculptId,
          maker_sculpt_id: `${maker.value.id}/${sculptId}`,
          source: 'keebdex',
          overridden_fields: [],
        }

        const [created] = await $fetch<any[]>(
          `/api/makers/${maker.value.id}/sculpts/${sculptId}/colorways`,
          { method: 'post', body: payload },
        )
        createdColorways.push(created)
      }

      if (
        createdColorways.some(
          (colorway) => colorway?.review_status === 'Pending',
        )
      ) {
        toast.add({
          title: 'Thanks for your contribution!',
          description:
            'Your colorways are now pending review and will display a Pending Review badge.',
          color: 'success',
        })
      } else {
        toast.add(
          handleSuccess(
            'add',
            `${createdColorways.length} colorway(s)`,
            'Colorway',
          ),
        )
      }

      return createdColorways
    } catch (error: any) {
      toast.add(handleError(error, { showOriginalMessage: true }))
      throw error
    } finally {
      uploading.value = false
    }
  }

  return {
    maker,
    makerOptions,
    makersStatus,
    sculptMode,
    existingSculpt,
    sculptOptions,
    sculptsStatus,
    sculpts,
    sculpt,
    colorways,
    addColorway,
    removeColorway,
    reviewStatus,
    sculptReviewStatus,
    canSave,
    canDelete,
    load,
    save,
    remove,
    uploading,
    canAdvance,
    validateStep,
    submit,
  }
}
