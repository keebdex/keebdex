import {
  keyboardReleaseSchema,
  keyboardSchema,
  keyboardVariantSchema,
} from '~/utils/schemas/keyboard'
import { entitySelectionSchema } from '~/utils/schemas/common'

// Drives the public "submit a keyboard" wizard: pick a brand, pick/create a keyboard,
// then create the release + variant. Reuses existing single-entity APIs; creating a new
// keyboard reuses the submission endpoint so the keyboard is owned and Pending, which
// is required for the follow-up release/variant create calls to pass RLS. Releases/variants added to an already-published keyboard skip that step:
// the release/variant endpoints store them as Pending proposals owned by the submitter.
//
// Also drives the "review a variant" flow via the same wizard (`mode: 'review'`),
// mirroring how keysets review one kit and artisan one colorway per row, with one more
// level: `submission` is a row of `GET /api/submissions/keyboard` (a variant plus its
// release and keyboard). The variant is always editable; the release and the keyboard
// are only editable while they are under review (Pending/Rejected, or a release that
// follows its Pending keyboard) and are locked summaries once published. Approving the
// variant also approves its release and keyboard (server side).
export const useKeyboardSubmissionWizard = ({
  mode = 'create',
  submission = null,
}: {
  mode?: 'create' | 'review'
  submission?: Record<string, any> | null
} = {}) => {
  const route = useRoute()
  const toast = useToast()
  const userStore = useUserStore()

  const isReview = mode === 'review'

  const queryKeyboard = String(route.query.keyboard || '')
  // Fall back to the brand embedded in `brand_keyboard_slug` (e.g.
  // "some-brand/some-keyboard") when only the `keyboard` query param made it
  // through, so a direct "Submit a Release/Variant" link still recognizes
  // the right brand.
  const brand = ref({
    id: String(route.query.brand || queryKeyboard.split('/')[0] || ''),
  })
  const keyboardMode = ref('existing')
  const existingKeyboard = ref({ id: queryKeyboard })
  // A direct "Submit a Release" link (keyboard pre-selected, no release id yet)
  // already expresses the intent to create a new release, so the release step
  // should skip the existing/new toggle entirely and only render the create form.
  const isDirectReleaseEntry = !!queryKeyboard && !route.query.release
  const releaseMode = ref(isDirectReleaseEntry ? 'new' : 'existing')
  const existingRelease = ref({ id: String(route.query.release || '') })

  const keyboard = ref({
    name: '',
    top_case_styles: [],
    mount_styles: [],
    typing_angle: null,
    derived_from: null,
    description: '',
  })

  const release = ref({
    name: '',
    release_year: null,
    currency: 'USD',
    msrp_price: null,
    description: '',
  })

  let variantKeySeed = 0
  const newVariant = () => ({
    _key: variantKeySeed++,
    release_id: 'draft',
    variant_name: '',
    units_produced: null,
    release_year: null,
    img_front: '',
    img_back: '',
    photo_credit: '',
    currency: 'USD',
    msrp_price: null,
  })
  const variants = ref([newVariant()])

  const addVariant = () => {
    variants.value.push(newVariant())
  }

  const removeVariant = (index: number) => {
    if (variants.value.length > 1) variants.value.splice(index, 1)
  }

  // Fed into VariantForm's required `keyboard` prop so its Release dropdown shows
  // the chosen/typed release name. Variants always default to `release_id: 'draft'`
  // (see newVariant below), so the option must always be keyed 'draft' too — the
  // real release id (existing or newly created) is only resolved at submit time.
  const keyboardForVariantForm = computed(() => {
    const releaseLabel =
      !isReview && releaseMode.value === 'existing'
        ? releaseOptions.value.find(
            (r: any) => r.value === existingRelease.value.id,
          )?.label
        : release.value.name

    return {
      releases: [{ id: 'draft', name: releaseLabel || 'New Release' }],
      brand_slug: brand.value.id,
      brand_keyboard_slug: existingKeyboard.value.id || brand.value.id,
    }
  })

  const uploading = ref(false)

  const { data: brands, status: brandsStatus } = useAsyncData<any[]>(
    'keyboard-submission-brands',
    () => $fetch('/api/keyboards/brands'),
    { default: () => [] },
  )

  const brandOptions = computed(() =>
    (brands.value || []).map((b: any) => ({ label: b.name, value: b.slug })),
  )

  const { data: brandDetail, status: keyboardsStatus } = useAsyncData<any>(
    () => `keyboard-submission-keyboards-${brand.value.id}`,
    () =>
      (brand.value.id
        ? $fetch(`/api/keyboards/brands/${brand.value.id}`)
        : null) as Promise<any>,
    { watch: [() => brand.value.id], default: () => null },
  )

  const keyboardOptions = computed(() =>
    (brandDetail.value?.keyboards || []).map((k: any) => ({
      label: k.name,
      value: `${brand.value.id}/${k.slug}`,
    })),
  )

  // Only a successful empty response means there's nothing to pick from.
  watch([keyboardOptions, keyboardsStatus], ([options, status]) => {
    if (
      !isReview &&
      status === 'success' &&
      brand.value.id &&
      !existingKeyboard.value.id &&
      !options.length
    ) {
      keyboardMode.value = 'new'
    }
  })

  // Reset the dependent keyboard selection so a stale id from a previous brand isn't submitted.
  watch(
    () => brand.value.id,
    () => {
      existingKeyboard.value = { id: '' }
    },
  )

  const { data: keyboardDetail, status: releasesStatus } = useAsyncData<any>(
    () => `keyboard-submission-releases-${existingKeyboard.value.id}`,
    () =>
      (keyboardMode.value === 'existing' && existingKeyboard.value.id
        ? $fetch(`/api/keyboards/${existingKeyboard.value.id}`)
        : null) as Promise<any>,
    {
      watch: [() => existingKeyboard.value.id, () => keyboardMode.value],
      default: () => null,
    },
  )

  const releaseOptions = computed(() =>
    (keyboardDetail.value?.releases || []).map((r: any) => ({
      label: r.name,
      value: r.id,
    })),
  )

  watch([releaseOptions, releasesStatus], ([options, status]) => {
    if (
      !isReview &&
      status === 'success' &&
      existingKeyboard.value.id &&
      !existingRelease.value.id &&
      !options.length
    ) {
      releaseMode.value = 'new'
    }
  })

  // A newly proposed keyboard has no releases yet, so always create one.
  watch(keyboardMode, (mode) => {
    if (mode === 'new') releaseMode.value = 'new'
  })

  // Reset the dependent release selection so a stale id from a previous keyboard isn't submitted.
  watch(
    () => existingKeyboard.value.id,
    () => {
      existingRelease.value = { id: '' }
    },
  )

  // Status of the variant being reviewed, of its release and of its keyboard.
  const reviewStatus = ref<string | null>(null)
  const releaseReviewStatus = ref<string | null>(null)
  const keyboardReviewStatus = ref<string | null>(null)

  const submissionKey: string = submission?.brand_keyboard_slug || ''

  const keyboardUnderReview = computed(
    () =>
      !!keyboardReviewStatus.value && keyboardReviewStatus.value !== 'Approved',
  )

  // A release without a status of its own follows its keyboard.
  const releaseUnderReview = computed(() =>
    releaseReviewStatus.value
      ? releaseReviewStatus.value !== 'Approved'
      : keyboardUnderReview.value,
  )

  // Staff can edit anything; submitters only while it's Pending or Rejected
  // (editing a rejected variant sends it back to review).
  const canSave = computed(
    () =>
      isReview &&
      (userStore.isModerator ||
        ['Pending', 'Rejected'].includes(reviewStatus.value || '')),
  )

  const canDelete = computed(() => canSave.value)

  const load = async () => {
    if (!isReview || !submission) return

    const rel = submission.release || {}
    const kb = rel.keyboard || {}

    brand.value = { id: submissionKey.split('/')[0] || '' }
    await nextTick()
    keyboardMode.value = 'existing'
    existingKeyboard.value = { id: submissionKey }
    reviewStatus.value = submission.status ?? submission.review_status
    releaseReviewStatus.value = rel.review_status ?? null
    keyboardReviewStatus.value = kb.review_status ?? null
    keyboard.value.name = kb.name || ''
    release.value.name = rel.name || ''

    const {
      release: _release,
      submitter: _submitter,
      status: _status,
      ...variantFields
    } = submission

    // Variants keep the synthetic 'draft' release option (see
    // keyboardForVariantForm); the real release id is resolved on save.
    variants.value = [
      { ...newVariant(), ...variantFields, release_id: 'draft' },
    ]

    if (keyboardUnderReview.value || releaseUnderReview.value) {
      const data: any = await $fetch(`/api/keyboards/${submissionKey}`)

      if (keyboardUnderReview.value) {
        Object.assign(keyboard.value, {
          id: data.id,
          name: data.name,
          brand_slug: data.brand_slug,
          form_factor: data.form_factor,
          top_case_styles: Array.isArray(data.top_case_styles)
            ? data.top_case_styles
            : data.top_case_styles
              ? [data.top_case_styles]
              : [],
          mount_styles: Array.isArray(data.mount_styles)
            ? data.mount_styles
            : data.mount_styles
              ? [data.mount_styles]
              : [],
          typing_angle: data.typing_angle,
          derived_from: data.derived_from,
          description: data.description,
        })
      }

      if (releaseUnderReview.value) {
        const { variants: _variants, ...releaseData } =
          (data.releases || []).find((r: any) => r.id === rel.id) || rel

        Object.assign(release.value, releaseData)
      }
    }
  }

  // Saves the keyboard and release (only while under review) and then the
  // variant; approving or rejecting rides on the variant save so the server can
  // cascade to the release and keyboard.
  const save = async (action: 'update' | 'approve' | 'reject' = 'update') => {
    const [brandSlug = '', keyboardSlug = ''] = submissionKey.split('/')

    if (keyboardUnderReview.value) {
      // The server sends a submitter's rejected keyboard back to review.
      await $fetch(`/api/keyboards/${brandSlug}/${keyboardSlug}`, {
        method: 'post',
        body: {
          ...keyboard.value,
          slug: keyboardSlug,
          brand_slug: brandSlug,
          brand_keyboard_slug: submissionKey,
        },
      })
    }

    if (releaseUnderReview.value) {
      await $fetch(`/api/keyboards/${submissionKey}/releases`, {
        method: 'post',
        body: {
          ...release.value,
          id: submission?.release_id,
          brand_slug: brandSlug,
          brand_keyboard_slug: submissionKey,
        },
      })
    }

    const { _key, ...variant } = variants.value[0]!

    await $fetch(`/api/keyboards/${submissionKey}/variants`, {
      method: 'post',
      body: {
        ...variant,
        release_id: submission?.release_id,
        brand_slug: brandSlug,
        brand_keyboard_slug: submissionKey,
        ...(action === 'update' ? {} : { action }),
      },
    })
  }

  const remove = () =>
    $fetch(`/api/keyboards/${submissionKey}/variants/${submission?.id}`, {
      method: 'delete',
    })

  const canAdvance = computed(() =>
    isReview
      ? [!!brand.value.id, true, true, true]
      : [
          !!brand.value.id,
          keyboardMode.value === 'existing'
            ? !!existingKeyboard.value.id
            : !!keyboard.value.name?.trim(),
          releaseMode.value === 'existing'
            ? !!existingRelease.value.id
            : !!release.value.name?.trim(),
          true,
        ],
  )

  const ok = { success: true as const }

  const stepSchemas = [
    () => entitySelectionSchema.safeParse(brand.value),
    () =>
      isReview
        ? keyboardUnderReview.value
          ? keyboardSchema.safeParse(keyboard.value)
          : ok
        : keyboardMode.value === 'existing'
          ? entitySelectionSchema.safeParse(existingKeyboard.value)
          : keyboardSchema.safeParse(keyboard.value),
    () =>
      isReview
        ? releaseUnderReview.value
          ? keyboardReleaseSchema.safeParse(release.value)
          : ok
        : releaseMode.value === 'existing'
          ? entitySelectionSchema.safeParse({
              id: existingRelease.value.id
                ? String(existingRelease.value.id)
                : '',
            })
          : keyboardReleaseSchema.safeParse(release.value),
    () => {
      const schema = keyboardVariantSchema.omit({ release_id: true })

      for (const variant of variants.value) {
        const result = schema.safeParse(variant)
        if (!result.success) return result
      }

      return ok
    },
  ]

  const validateStep = (index: number) => {
    const result = stepSchemas[index]?.()

    if (!result || result.success) return true

    const statusMessage =
      'error' in result ? result.error.issues[0]?.message : undefined
    toast.add(handleError({ statusMessage }))
    return false
  }

  const submit = async () => {
    uploading.value = true

    try {
      let brandKeyboardSlug = existingKeyboard.value.id

      if (keyboardMode.value === 'new') {
        const created: any = await $fetch('/api/submissions/keyboard', {
          method: 'post',
          body: {
            keyboard: { ...keyboard.value, brand_slug: brand.value.id },
          },
        })

        brandKeyboardSlug = created.brand_keyboard_slug
      }

      let releaseId: number = Number(existingRelease.value.id)

      if (releaseMode.value === 'new') {
        const createdRelease: any = await $fetch(
          `/api/keyboards/${brandKeyboardSlug}/releases`,
          {
            method: 'post',
            body: { ...release.value, brand_keyboard_slug: brandKeyboardSlug },
          },
        )

        releaseId = createdRelease.id
      }

      for (const variant of variants.value) {
        const { _key, ...variantData } = variant

        await $fetch(`/api/keyboards/${brandKeyboardSlug}/variants`, {
          method: 'post',
          body: {
            ...variantData,
            release_id: releaseId,
            brand_slug: brandKeyboardSlug.split('/')[0],
            brand_keyboard_slug: brandKeyboardSlug,
          },
        })
      }

      toast.add(
        handleSuccess('add', `${variants.value.length} variant(s)`, 'Variant'),
      )
    } catch (error: any) {
      toast.add(handleError(error, { showOriginalMessage: true }))

      throw error
    } finally {
      uploading.value = false
    }
  }

  return {
    brand,
    brandOptions,
    brandsStatus,
    keyboardMode,
    existingKeyboard,
    keyboardOptions,
    keyboardsStatus,
    keyboard,
    releaseMode,
    isDirectReleaseEntry,
    existingRelease,
    releaseOptions,
    releasesStatus,
    release,
    variants,
    addVariant,
    removeVariant,
    keyboardForVariantForm,
    reviewStatus,
    keyboardUnderReview,
    releaseUnderReview,
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
