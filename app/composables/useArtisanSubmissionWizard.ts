import slugify from 'slugify'
import { colorwaySchema, sculptSchema } from '~/utils/schemas/artisan'
import { entitySelectionSchema, validateEach } from '~/utils/schemas/common'

export const useArtisanSubmissionWizard = ({
  mode = 'create',
  submission,
}: SubmissionWizardOptions = {}) => {
  const route = useRoute()
  const toast = useToast()
  const { isReview, reviewStatus, canSave, canDelete } =
    useSubmissionReview(mode)

  const maker = ref({ id: String(route.query.maker || '') })
  const sculptMode = ref('existing')
  const existingSculpt = ref({ id: String(route.query.sculpt || '') })

  const sculpt = ref<Record<string, any>>({
    name: '',
    release: '',
    profile: null,
    cast: null,
    design: null,
    collection: null,
    is_revision_of: null,
    story: '',
  })
  const sculptFields = ['id', ...Object.keys(sculpt.value)]

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

  // Only a successful empty response means there's nothing to pick from.
  watch([sculptOptions, sculptsStatus], ([options, status]) => {
    if (
      !isReview &&
      status === 'success' &&
      maker.value.id &&
      !existingSculpt.value.id &&
      !options.length
    ) {
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

  const {
    items: colorways,
    create: createColorway,
    add: addColorway,
    remove: removeColorway,
    toPayload,
  } = useRepeatableItems<Record<string, any>>((index) => ({
    name: '',
    img: '',
    order: baseOrder.value + index + 1,
    currency: 'USD',
    sale_type: 'Raffle',
  }))

  // Re-sync colorways still on their auto-computed order when baseOrder
  // changes; anything the user has edited manually is left alone.
  watch(baseOrder, (next, prev) => {
    colorways.value.forEach((colorway, index) => {
      if (colorway.order === prev + index + 1) {
        colorway.order = next + index + 1
      }
    })
  })

  const sculptReviewStatus = ref<string | null>(null)

  const colorwaysUrl = (sculptId = existingSculpt.value.id) =>
    `/api/makers/${maker.value.id}/sculpts/${sculptId}/colorways`

  const load = async () => {
    if (!isReview || !submission) return

    maker.value = { id: submission.maker_id }
    await nextTick()
    sculptMode.value = 'existing'
    existingSculpt.value = { id: submission.sculpt_id }
    reviewStatus.value = submission.review_status
    colorways.value = [createColorway(submission)]

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
        Object.assign(sculpt.value, pickKeys(sculptDetail, sculptFields))
      } catch {
        // Fall back to the locked existing-sculpt select below.
      }
    }
  }

  // Saves the sculpt (only while under review) and then the colorway;
  // approving rides on the colorway save so the server can cascade.
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

    await $fetch(colorwaysUrl(), {
      method: 'post',
      body: {
        ...toPayload(colorways.value[0]!),
        ...(action === 'update' ? {} : { action }),
      },
    })
  }

  const remove = async () => {
    if (!submission?.id) return

    await $fetch(`${colorwaysUrl()}/${submission.id}`, { method: 'delete' })
  }

  // Drives the Next button's disabled state so the wizard can't advance
  // past a step whose entity hasn't been picked yet.
  const canAdvance = computed(() => [
    !!maker.value.id,
    sculptMode.value === 'existing'
      ? !!existingSculpt.value.id
      : !!sculpt.value.name?.trim(),
    true,
  ])

  const colorwayStepSchema = colorwaySchema.omit({
    maker_id: true,
    sculpt_id: true,
    maker_sculpt_id: true,
  })

  const validateStep = useStepValidation([
    () => entitySelectionSchema.safeParse(maker.value),
    () =>
      sculptMode.value === 'existing'
        ? entitySelectionSchema.safeParse(existingSculpt.value)
        : sculptSchema.safeParse(sculpt.value),
    () => validateEach(colorwayStepSchema, colorways.value),
  ])

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
        const [created] = await $fetch<any[]>(colorwaysUrl(sculptId), {
          method: 'post',
          body: {
            ...toPayload(colorway),
            maker_id: maker.value.id,
            sculpt_id: sculptId,
            maker_sculpt_id: `${maker.value.id}/${sculptId}`,
            source: 'keebdex',
            overridden_fields: [],
          },
        })
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
