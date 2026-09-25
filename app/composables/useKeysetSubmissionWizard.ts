import { createKeysetSchema, keysetKitSchema } from '~/utils/schemas/keyset'
import { entitySelectionSchema } from '~/utils/schemas/common'

// Drives the public "submit a keyset" wizard: pick a profile, pick/create a keyset,
// then create the kit. Reuses existing single-entity APIs; creating a new keyset
// reuses the submission endpoint (with an empty kits array) so the keyset is owned
// and Pending, which is required for the follow-up kit create call to pass RLS.
export const useKeysetSubmissionWizard = () => {
  const route = useRoute()
  const toast = useToast()
  const { manufacturers } = useKeysetProfiles()

  const profile = ref({ id: String(route.query.profile || '') })
  const keysetMode = ref('existing')
  const existingKeyset = ref({ id: String(route.query.keyset || '') })

  const keyset = ref({
    name: '',
    designer: '',
    sculpt: '',
    url: '',
    img: '',
    description: '',
    profile_id: '',
  })

  // Bound to KeysetForm's GB date-range picker; not part of `keyset` since the
  // picker works with CalendarDate objects that need converting on submit.
  const dateRange = ref({ start: undefined, end: undefined })

  let kitKeySeed = 0
  const newKit = () => ({
    _key: kitKeySeed++,
    kit_id: 'base',
    name: '',
    img: '',
    price: null,
    qty: null,
    description: '',
    cancelled: false,
  })
  const kits = ref([newKit()])

  const addKit = () => {
    kits.value.push(newKit())
  }

  const removeKit = (index: number) => {
    if (kits.value.length > 1) kits.value.splice(index, 1)
  }

  const uploading = ref(false)

  const { data: keysetsData, status: keysetsStatus } = useAsyncData<any>(
    () => `keyset-submission-keysets-${profile.value.id}`,
    () =>
      (profile.value.id
        ? $fetch('/api/keysets', {
            query: { profile_id: profile.value.id, page: 1, size: 100 },
          })
        : null) as Promise<any>,
    { watch: [() => profile.value.id], default: () => null },
  )

  const keysetOptions = computed(() =>
    (keysetsData.value?.data || []).map((k: any) => ({
      label: k.name,
      value: k.profile_keyset_id,
    })),
  )

  watch([keysetOptions, keysetsStatus], ([options, status]) => {
    if (status !== 'pending' && profile.value.id && !options.length) {
      keysetMode.value = 'new'
    }
  })

  // Reset the dependent keyset selection so a stale id from a previous profile isn't submitted.
  watch(
    () => profile.value.id,
    (id) => {
      existingKeyset.value = { id: '' }
      // KeysetForm always renders its own Profile field; keep it in sync with step 1.
      keyset.value.profile_id = id
    },
    { immediate: true },
  )

  const canAdvance = computed(() => [
    !!profile.value.id,
    keysetMode.value === 'existing'
      ? !!existingKeyset.value.id
      : !!keyset.value.name?.trim(),
    true,
  ])

  const stepSchemas = [
    () => entitySelectionSchema.safeParse(profile.value),
    () =>
      keysetMode.value === 'existing'
        ? entitySelectionSchema.safeParse(existingKeyset.value)
        : createKeysetSchema(manufacturers).safeParse({
            ...keyset.value,
            profile_id: profile.value.id,
          }),
    () => {
      for (const kit of kits.value) {
        const result = keysetKitSchema.safeParse(kit)
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
      let profileKeysetId = existingKeyset.value.id

      if (keysetMode.value === 'new') {
        const payload: any = { ...keyset.value, profile_id: profile.value.id }

        if (payload.ic_date) {
          payload.ic_date = toISODate(payload.ic_date)
        }
        if (dateRange.value.start) {
          payload.start_date = toISODate(dateRange.value.start)
        }
        if (dateRange.value.end) {
          payload.end_date = toISODate(dateRange.value.end)
        }

        const created: any = await $fetch('/api/submissions/keyset', {
          method: 'post',
          body: {
            keyset: payload,
            kits: [],
          },
        })

        profileKeysetId = created.profile_keyset_id
      }

      for (const kit of kits.value) {
        const { _key, ...kitData } = kit

        await $fetch(`/api/keysets/${profileKeysetId}/kits`, {
          method: 'post',
          body: { ...kitData, profile_keyset_id: profileKeysetId },
        })
      }

      toast.add(handleSuccess('add', `${kits.value.length} kit(s)`, 'Kit'))
    } catch (error: any) {
      const status = error?.statusCode || error?.status

      if (
        keysetMode.value === 'existing' &&
        (status === 403 || status === 500)
      ) {
        toast.add({
          title: 'Unable to add kit',
          description:
            "This keyset isn't part of your pending submissions, so only a moderator can add kits to it. Try creating a new keyset instead.",
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
    profile,
    keysetMode,
    existingKeyset,
    keysetOptions,
    keysetsStatus,
    keyset,
    dateRange,
    kits,
    addKit,
    removeKit,
    uploading,
    canAdvance,
    validateStep,
    submit,
  }
}
