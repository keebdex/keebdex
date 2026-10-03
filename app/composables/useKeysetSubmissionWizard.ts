import { parseDate, type CalendarDate } from '@internationalized/date'
import type { Tables } from '~/types/database.types'
import { createKeysetSchema, keysetKitSchema } from '~/utils/schemas/keyset'
import { entitySelectionSchema } from '~/utils/schemas/common'

type KeysetsResponse = {
  keysets: Pick<Tables<'keysets'>, 'name' | 'profile_keyset_id'>[]
}

// Drives the public "submit a keyset" wizard: pick a profile, pick/create a keyset,
// then create the kit. Reuses existing single-entity APIs; creating a new keyset
// reuses the submission endpoint (with an empty kits array) so the keyset is owned
// and Pending, which is required for the follow-up kit create call to pass RLS.
//
// Also drives the staff "review a keyset submission" flow via the same wizard
// (`mode: 'review'`): the keyset step is always the pre-filled edit form (the
// submission row *is* the keyset being reviewed) and the kit step already supports
// a repeatable list, so it's reused as-is to review/edit/add/remove every kit
// accumulated on a Pending submission.
export const useKeysetSubmissionWizard = ({
  mode = 'create',
  submissionId = null,
}: {
  mode?: 'create' | 'review'
  submissionId?: string | number | null
} = {}) => {
  const route = useRoute()
  const toast = useToast()
  const userStore = useUserStore()
  const { manufacturers } = useKeysetProfiles()

  const isReview = mode === 'review'

  const queryKeyset = String(route.query.keyset || '')
  // Fall back to the profile embedded in `profile_keyset_id` (e.g.
  // "gmk/some-keyset") when only the `keyset` query param made it through,
  // so a direct "Submit a Kit" link still recognizes the right profile.
  const profile = ref({
    id: String(route.query.profile || queryKeyset.split('/')[0] || ''),
  })
  const keysetMode = ref('existing')
  const existingKeyset = ref({ id: queryKeyset })

  const keyset = ref({
    id: undefined as number | undefined,
    name: '',
    designer: '',
    sculpt: '',
    url: '',
    img: '',
    description: '',
    profile_id: '',
    status: undefined as string | undefined,
    review_status: undefined as string | undefined,
    ic_date: undefined as ReturnType<typeof parseDate> | string | undefined,
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
  })

  // Bound to KeysetForm's GB date-range picker; not part of `keyset` since the
  // picker works with CalendarDate objects that need converting on submit.
  const dateRange = ref({
    start: undefined as ReturnType<typeof parseDate> | undefined,
    end: undefined as ReturnType<typeof parseDate> | undefined,
  })

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
      const data: any = await $fetch(`/api/submissions/keyset/${submissionId}`)

      profile.value = { id: data.profile_id }
      await nextTick()
      keysetMode.value = 'new'
      existingKeyset.value = { id: data.profile_keyset_id }
      reviewStatus.value = data.review_status

      Object.assign(keyset.value, {
        id: data.id,
        name: data.name,
        designer: data.designer,
        sculpt: data.sculpt,
        url: data.url,
        img: data.img,
        description: data.description,
        profile_id: data.profile_id,
        status: data.status,
        review_status: data.review_status,
        ic_date: data.ic_date ? parseDate(data.ic_date) : undefined,
      })

      dateRange.value = {
        start: data.start_date ? parseDate(data.start_date) : undefined,
        end: data.end_date ? parseDate(data.end_date) : undefined,
      }

      kits.value = (data.kits || []).map((kit: any) => ({
        ...newKit(),
        ...kit,
      }))

      if (!kits.value.length) kits.value.push(newKit())
    } finally {
      loadingDetail.value = false
    }
  }

  const buildKitsPayload = () =>
    kits.value
      .filter((kit) => kit.name || kit.img || kit.description)
      .map(({ _key, ...kit }) => kit)

  const save = async (action: 'update' | 'approve' | 'reject' = 'update') => {
    const payload: any = { ...keyset.value }

    if (action === 'update') payload.review_status = 'Pending'

    if (payload.ic_date) {
      payload.ic_date = toISODate(payload.ic_date)
    }
    if (dateRange.value.start) {
      payload.start_date = toISODate(dateRange.value.start as CalendarDate)
    }
    if (dateRange.value.end) {
      payload.end_date = toISODate(dateRange.value.end as CalendarDate)
    }

    return $fetch(`/api/submissions/keyset/${submissionId}`, {
      method: 'post',
      body: { action, keyset: payload, kits: buildKitsPayload() },
    })
  }

  const approve = () => save('approve')
  const reject = () => save('reject')
  const remove = () =>
    $fetch(`/api/submissions/keyset/${submissionId}`, { method: 'delete' })

  const uploading = ref(false)

  const { data: keysetsData, status: keysetsStatus } =
    useAsyncData<KeysetsResponse | null>(
      () => `keyset-submission-keysets-${profile.value.id}`,
      async () =>
        profile.value.id
          ? await $fetch<KeysetsResponse>('/api/keysets', {
              query: { profile_id: profile.value.id, page: 1, size: 100 },
            })
          : null,
      { watch: [() => profile.value.id], default: () => null },
    )

  const keysetOptions = computed(() =>
    (keysetsData.value?.keysets || []).map((k) => ({
      label: k.name,
      value: k.profile_keyset_id,
    })),
  )

  watch([keysetOptions, keysetsStatus], ([options, status]) => {
    if (
      !isReview &&
      status === 'success' &&
      profile.value.id &&
      !existingKeyset.value.id &&
      !options.length
    ) {
      keysetMode.value = 'new'
    }
  })

  // KeysetForm always renders its own Profile field; keep it in sync with step 1.
  // Runs immediately so a new-keyset form pre-fills profile_id on first mount too.
  watch(
    () => profile.value.id,
    (id) => {
      keyset.value.profile_id = id
    },
    { immediate: true },
  )

  // Reset the dependent keyset selection so a stale id from a previous profile isn't
  // submitted — but NOT on the initial run, which would wipe a pre-selected existing
  // keyset id coming from a direct "Submit a Kit" link's `keyset` query param.
  watch(
    () => profile.value.id,
    () => {
      existingKeyset.value = { id: '' }
    },
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
          payload.start_date = toISODate(dateRange.value.start as CalendarDate)
        }
        if (dateRange.value.end) {
          payload.end_date = toISODate(dateRange.value.end as CalendarDate)
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
