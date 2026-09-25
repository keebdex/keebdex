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
export const useKeyboardSubmissionWizard = () => {
  const route = useRoute()
  const toast = useToast()

  const brand = ref({ id: String(route.query.brand || '') })
  const keyboardMode = ref('existing')
  const existingKeyboard = ref({ id: String(route.query.keyboard || '') })
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

  const canAdvance = computed(() => [
    !!brand.value.id,
    keyboardMode.value === 'existing'
      ? !!existingKeyboard.value.id
      : !!keyboard.value.name?.trim(),
    releaseMode.value === 'existing'
      ? !!existingRelease.value.id
      : !!release.value.name?.trim(),
    true,
  ])

  const stepSchemas = [
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
    uploading,
    canAdvance,
    validateStep,
    submit,
  }
}
