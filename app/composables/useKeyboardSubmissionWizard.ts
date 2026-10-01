import { Constants } from '~/types/database.types'
import {
  keyboardReleaseSchema,
  keyboardSchema,
  keyboardVariantSchema,
} from '~/utils/schemas/keyboard'
import { entitySelectionSchema } from '~/utils/schemas/common'

// Drives the public "submit a keyboard" wizard: pick a brand, pick/create a keyboard,
// then create the release + variant. Reuses existing single-entity APIs; creating a new
// keyboard reuses the submission endpoint (with an empty releases array) so the keyboard
// is owned and Pending, which is required for the follow-up release/variant create calls
// to pass RLS.
//
// Also drives the staff "review a keyboard submission" flow via the same wizard
// (`mode: 'review'`): the keyboard step is always the pre-filled edit form (the
// submission row *is* the keyboard being reviewed), and the release/variant steps
// collapse into a single repeatable "releases" step so every release + its variants
// accumulated on a Pending submission can be reviewed, edited, added, or removed at once.
export const useKeyboardSubmissionWizard = ({
  mode = 'create',
  submissionId = null,
}: {
  mode?: 'create' | 'review'
  submissionId?: string | number | null
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
  const releaseMode = ref('existing')
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

  // Fed into VariantForm's required `keyboard` prop so its Release dropdown and
  // brand stamping work before the real keyboard/release are created.
  const keyboardForVariantForm = computed(() => ({
    releases:
      releaseMode.value === 'existing' && existingRelease.value.id
        ? [
            {
              id: existingRelease.value.id,
              name:
                releaseOptions.value.find(
                  (r: any) => r.value === existingRelease.value.id,
                )?.label || '',
            },
          ]
        : [{ id: 'draft', name: release.value.name || 'New Release' }],
    brand_slug: brand.value.id,
    brand_keyboard_slug: existingKeyboard.value.id || brand.value.id,
  }))

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

  watch([keyboardOptions, keyboardsStatus], ([options, status]) => {
    if (status !== 'pending' && brand.value.id && !options.length) {
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
    if (status !== 'pending' && existingKeyboard.value.id && !options.length) {
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

  // Review-only repeatable "releases" step: each release owns its own nested
  // variants list, mirroring what a Pending submission can accumulate over time.
  let reviewReleaseKeySeed = 0
  let reviewVariantKeySeed = 0

  const newReviewVariant = () => ({
    _key: reviewVariantKeySeed++,
    release_id: 'draft',
    variant_name: '',
    finish_type: Constants.public.Enums.keyboard_finish_type[0],
    units_produced: null,
    release_year: null,
    img_front: '',
    img_back: '',
    photo_credit: '',
    currency: 'USD',
    msrp_price: null,
  })

  const newReviewRelease = () => ({
    _key: reviewReleaseKeySeed++,
    name: '',
    release_year: null,
    currency: 'USD',
    msrp_price: null,
    description: '',
    variant_specs: false,
    variants: [] as any[],
  })

  const releases = ref<any[]>([])

  const addRelease = () => {
    releases.value.push(newReviewRelease())
  }

  const removeRelease = (index: number) => {
    releases.value.splice(index, 1)
  }

  const addReleaseVariant = (release: any) => {
    release.variants.push(newReviewVariant())
  }

  const removeReleaseVariant = (release: any, index: number) => {
    release.variants.splice(index, 1)
  }

  // Fed into VariantForm's required `keyboard` prop, locked to the single release
  // it belongs to so its Release dropdown only offers that one option.
  const releaseKeyboardFor = (release: any) => ({
    releases: [
      { id: release.id || 'draft', name: release.name || 'New Release' },
    ],
    brand_slug: brand.value.id,
    brand_keyboard_slug: existingKeyboard.value.id || brand.value.id,
  })

  const loadingDetail = ref(false)
  const reviewStatus = ref<string | null>(null)

  const canDelete = computed(
    () =>
      isReview && (userStore.isModerator || reviewStatus.value !== 'Approved'),
  )

  const load = async () => {
    if (!isReview || !submissionId) return

    loadingDetail.value = true

    try {
      const data: any = await $fetch(
        `/api/submissions/keyboard/${submissionId}`,
      )

      brand.value = { id: data.brand_slug }
      keyboardMode.value = 'new'
      existingKeyboard.value = { id: data.brand_keyboard_slug }
      reviewStatus.value = data.review_status

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

      releases.value = (data.releases || []).map((r: any) => ({
        ...newReviewRelease(),
        ...r,
        variants: (r.variants || []).map((v: any) => ({
          ...newReviewVariant(),
          ...v,
        })),
      }))

      if (!releases.value.length) releases.value.push(newReviewRelease())
    } finally {
      loadingDetail.value = false
    }
  }

  const buildReviewReleasesPayload = () =>
    releases.value
      .filter((r) => r.name)
      .map(({ _key, variants, ...r }) => ({
        ...r,
        variants: variants
          .filter((v: any) => v.variant_name)
          .map(({ _key: variantKey, ...v }: any) => v),
      }))

  const save = async (action: 'update' | 'approve' | 'reject' = 'update') =>
    $fetch(`/api/submissions/keyboard/${submissionId}`, {
      method: 'post',
      body: {
        action,
        keyboard: keyboard.value,
        releases: buildReviewReleasesPayload(),
      },
    })

  const approve = () => save('approve')
  const reject = () => save('reject')
  const remove = () =>
    $fetch(`/api/submissions/keyboard/${submissionId}`, { method: 'delete' })

  const canAdvance = computed(() =>
    isReview
      ? [!!brand.value.id, !!keyboard.value.name?.trim(), true]
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

  const stepSchemas = isReview
    ? [
        () => entitySelectionSchema.safeParse(brand.value),
        () => keyboardSchema.safeParse(keyboard.value),
        () => {
          for (const r of releases.value) {
            const releaseResult = keyboardReleaseSchema.safeParse(r)
            if (!releaseResult.success) return releaseResult

            for (const v of r.variants) {
              const variantResult = keyboardVariantSchema
                .omit({ release_id: true })
                .safeParse(v)
              if (!variantResult.success) return variantResult
            }
          }

          return { success: true as const }
        },
      ]
    : [
        () => entitySelectionSchema.safeParse(brand.value),
        () =>
          keyboardMode.value === 'existing'
            ? entitySelectionSchema.safeParse(existingKeyboard.value)
            : keyboardSchema.safeParse(keyboard.value),
        () =>
          releaseMode.value === 'existing'
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

          return { success: true as const }
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
            releases: [],
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
      const status = error?.statusCode || error?.status

      if (
        keyboardMode.value === 'existing' &&
        (status === 403 || status === 404 || status === 500)
      ) {
        toast.add({
          title: 'Unable to add release',
          description:
            "This keyboard isn't part of your pending submissions, so only a moderator can add releases to it. Try creating a new keyboard instead.",
          color: 'error',
        })
      } else {
        toast.add(handleError(error, { showOriginalMessage: true }))
      }

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
    existingRelease,
    releaseOptions,
    releasesStatus,
    release,
    variants,
    addVariant,
    removeVariant,
    keyboardForVariantForm,
    releases,
    addRelease,
    removeRelease,
    addReleaseVariant,
    removeReleaseVariant,
    releaseKeyboardFor,
    loadingDetail,
    reviewStatus,
    canDelete,
    load,
    save,
    approve,
    reject,
    remove,
    uploading,
    canAdvance,
    validateStep,
    submit,
  }
}
