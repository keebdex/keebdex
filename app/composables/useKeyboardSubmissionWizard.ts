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
// to pass RLS. Releases/variants added to an already-published keyboard skip that step:
// the release/variant endpoints store them as Pending proposals owned by the submitter.
//
// Also drives the staff "review a keyboard submission" flow via the same wizard
// (`mode: 'review'`): the keyboard step is always the pre-filled edit form (the
// submission row *is* the keyboard being reviewed), and the release/variant steps
// collapse into a single repeatable "releases" step so every release + its variants
// accumulated on a Pending submission can be reviewed, edited, added, or removed at once.
//
// Releases/variants proposed for an already-published keyboard are reviewed with
// `childrenOnly: true` and the keyboard's `parentKey`: the keyboard stays locked (never
// edited or deleted), the releases step lists only community-proposed releases/variants
// (each with its own review status), and a published release only hosts its proposed
// variants. Loading, saving, approving, rejecting and deleting go through the keyboard
// detail and per-release/variant endpoints, so only those proposals are touched.
export const useKeyboardSubmissionWizard = ({
  mode = 'create',
  submissionId = null,
  childrenOnly = false,
  parentKey = '',
}: {
  mode?: 'create' | 'review'
  submissionId?: string | number | null
  childrenOnly?: boolean
  parentKey?: string
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
      releaseMode.value === 'existing'
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
    _locked: false,
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

  const submissionUrl = `/api/submissions/keyboard/${submissionId}`

  type ProposalSnapshot = {
    id: number
    review_status: string | null
    variants: { id: number; review_status: string | null }[]
  }

  // Proposed releases/variants as loaded, to detect which ones the reviewer removed.
  let originalReleases: ProposalSnapshot[] = []

  // Staff can edit any proposal; submitters only their own Pending ones.
  const canEditProposal = (row: { review_status?: string | null }) =>
    userStore.isModerator || row.review_status === 'Pending'

  // A release is locked when it's already published (or, for non-moderators, no
  // longer Pending): only its proposed variants can be reviewed/edited.
  const isReleaseLocked = (release: any) =>
    !release.review_status ||
    (release.review_status !== 'Pending' && !userStore.isModerator)

  const canDelete = computed(
    () =>
      isReview &&
      (userStore.isModerator ||
        (childrenOnly
          ? releases.value.some(
              (release: any) =>
                release.review_status === 'Pending' ||
                release.variants.some(
                  (variant: any) => variant.review_status === 'Pending',
                ),
            )
          : reviewStatus.value !== 'Approved')),
  )

  const load = async () => {
    if (!isReview || !submissionId) return

    loadingDetail.value = true

    try {
      const data: any = await $fetch(
        childrenOnly ? `/api/keyboards/${parentKey}` : submissionUrl,
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

      releases.value = (data.releases || [])
        .map((r: any) => ({
          ...r,
          variants: (r.variants || []).filter(
            (v: any) => !childrenOnly || v.review_status,
          ),
        }))
        .filter(
          (r: any) => !childrenOnly || r.review_status || r.variants.length,
        )
        .map((r: any) => ({
          ...newReviewRelease(),
          ...r,
          _locked: childrenOnly && isReleaseLocked(r),
          variants: r.variants.map((v: any) => ({
            ...newReviewVariant(),
            ...v,
          })),
        }))

      originalReleases = releases.value.map((r: any) => ({
        id: r.id,
        review_status: r.review_status,
        variants: r.variants.map((v: any) => ({
          id: v.id,
          review_status: v.review_status,
        })),
      }))

      if (!releases.value.length && !childrenOnly) {
        releases.value.push(newReviewRelease())
      }
    } finally {
      loadingDetail.value = false
    }
  }

  const buildReviewReleasesPayload = () =>
    releases.value
      .filter((r) => r.name)
      .map(({ _key, _locked, variants, ...r }) => ({
        ...r,
        variants: variants
          .filter((v: any) => v.variant_name)
          .map(({ _key: variantKey, ...v }: any) => v),
      }))

  const saveProposals = async (action: 'update' | 'approve' | 'reject') => {
    const payload: any[] = buildReviewReleasesPayload()
    const target = { approve: 'Approved', reject: 'Rejected' }[action as string]
    const withAction = (row: any) =>
      target && row.review_status !== target ? { action } : {}

    if (action !== 'update' && !payload.length) {
      throw createError({ statusCode: 400, statusMessage: 'Nothing to review' })
    }

    const [brandSlug] = parentKey.split('/')
    const base = `/api/keyboards/${parentKey}`

    for (const { variants, ...releaseData } of payload) {
      const locked =
        !releaseData.review_status ||
        (releaseData.id && !canEditProposal(releaseData))

      // Published releases only host their proposed variants and stay untouched.
      if (!locked) {
        await $fetch(`${base}/releases`, {
          method: 'post',
          body: {
            ...releaseData,
            brand_slug: brandSlug,
            brand_keyboard_slug: parentKey,
            ...withAction(releaseData),
          },
        })
      }

      for (const variant of variants) {
        if (variant.id && !canEditProposal(variant)) continue

        await $fetch(`${base}/variants`, {
          method: 'post',
          body: {
            ...variant,
            release_id: releaseData.id,
            brand_slug: brandSlug,
            brand_keyboard_slug: parentKey,
            ...withAction(variant),
          },
        })
      }
    }

    // Anything the reviewer removed from the list.
    const keptReleaseIds = new Set(payload.map((r) => r.id))
    const keptVariantIds = new Set(
      payload.flatMap((r) => r.variants.map((v: any) => v.id)),
    )

    await removeProposals(
      originalReleases
        .map((r) => ({
          ...r,
          variants: r.variants.filter((v) => !keptVariantIds.has(v.id)),
        }))
        .filter((r) => !keptReleaseIds.has(r.id) || r.variants.length)
        .map((r) => ({ ...r, removeRelease: !keptReleaseIds.has(r.id) })),
    )
  }

  // Variants go before their release, which can't be deleted while it has any.
  const removeProposals = async (
    list: (ProposalSnapshot & { removeRelease: boolean })[],
  ) => {
    const base = `/api/keyboards/${parentKey}`

    for (const release of list) {
      for (const variant of release.variants.filter(canEditProposal)) {
        await $fetch(`${base}/variants/${variant.id}`, { method: 'delete' })
      }

      // Published releases (no status of their own) are never deleted here.
      if (
        release.removeRelease &&
        release.review_status &&
        canEditProposal(release)
      ) {
        await $fetch(`${base}/releases/${release.id}`, { method: 'delete' })
      }
    }
  }

  const save = async (action: 'update' | 'approve' | 'reject' = 'update') =>
    childrenOnly
      ? saveProposals(action)
      : $fetch(submissionUrl, {
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
    childrenOnly
      ? removeProposals(
          originalReleases.map((r) => ({ ...r, removeRelease: true })),
        )
      : $fetch(submissionUrl, { method: 'delete' })

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
        () =>
          childrenOnly
            ? { success: true as const }
            : keyboardSchema.safeParse(keyboard.value),
        () => {
          for (const r of releases.value) {
            const releaseResult = r._locked
              ? { success: true as const }
              : keyboardReleaseSchema.safeParse(r)
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
