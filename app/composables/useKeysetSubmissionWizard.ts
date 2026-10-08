import { parseDate, type CalendarDate } from '@internationalized/date'
import type { Tables } from '~/types/database.types'
import { createKeysetSchema, keysetKitSchema } from '~/utils/schemas/keyset'
import { entitySelectionSchema, validateEach } from '~/utils/schemas/common'

type KeysetsResponse = {
  keysets: Pick<Tables<'keysets'>, 'name' | 'profile_keyset_id'>[]
}

const toCalendarDate = (value?: string | null) =>
  value ? parseDate(value) : undefined

// Drives the public "submit a keyset" wizard: pick a profile, pick/create a keyset,
// then create the kit. Reuses existing single-entity APIs; creating a new keyset
// reuses the submission endpoint so the keyset is owned and Pending, which is
// required for the follow-up kit create call to pass RLS.
// Kits added to an already-published keyset skip that step: the kit endpoint
// stores them as Pending proposals owned by the submitter.
//
// Also drives the "review a kit" flow via the same wizard (`mode: 'review'`),
// mirroring how artisan reviews one colorway per row: `submission` is a row of
// `GET /api/submissions/keyset` (a kit plus its keyset). The kit is always
// editable; the keyset is only editable while it's still under review (Pending or
// Rejected, like a Pending sculpt) and is a locked summary once published.
// Approving the kit also approves its keyset (server side).
export const useKeysetSubmissionWizard = ({
  mode = 'create',
  submission = null,
}: SubmissionWizardOptions = {}) => {
  const route = useRoute()
  const toast = useToast()
  const { manufacturers } = useKeysetProfiles()
  const { isReview, reviewStatus, canSave, canDelete } =
    useSubmissionReview(mode)

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

  // The keyset body for the API, with CalendarDate values as ISO dates.
  const toKeysetPayload = () => {
    const payload: Record<string, any> = { ...keyset.value }

    if (payload.ic_date) payload.ic_date = toISODate(payload.ic_date)
    if (dateRange.value.start) {
      payload.start_date = toISODate(dateRange.value.start as CalendarDate)
    }
    if (dateRange.value.end) {
      payload.end_date = toISODate(dateRange.value.end as CalendarDate)
    }

    return payload
  }

  const {
    items: kits,
    create: createKit,
    add: addKit,
    remove: removeKit,
    toPayload,
  } = useRepeatableItems<Record<string, any>>(() => ({
    kit_id: 'base',
    name: '',
    img: '',
    price: null,
    qty: null,
    description: '',
    cancelled: false,
  }))

  // Status of the kit's keyset (the kit's own is `reviewStatus`).
  const keysetReviewStatus = ref<string | null>(null)

  const submissionKey: string = submission?.profile_keyset_id || ''

  const keysetUnderReview = computed(
    () => !!keysetReviewStatus.value && keysetReviewStatus.value !== 'Approved',
  )

  const load = async () => {
    if (!isReview || !submission) return

    profile.value = { id: submissionKey.split('/')[0] || '' }
    await nextTick()
    keysetMode.value = 'existing'
    existingKeyset.value = { id: submissionKey }
    reviewStatus.value = submission.status ?? submission.review_status
    keysetReviewStatus.value = submission.keyset?.review_status ?? null
    keyset.value.name = submission.keyset?.name || ''

    const {
      keyset: _keyset,
      submitter: _submitter,
      category: _category,
      status: _status,
      ...kitFields
    } = submission

    kits.value = [createKit(kitFields)]

    if (keysetUnderReview.value) {
      const data: any = await $fetch(`/api/keysets/${submissionKey}`)

      keysetMode.value = 'new'

      Object.assign(keyset.value, {
        ...pickKeys(data, [
          'id',
          'name',
          'designer',
          'sculpt',
          'url',
          'img',
          'description',
          'profile_id',
          'status',
          'review_status',
        ]),
        ic_date: toCalendarDate(data.ic_date),
      })

      dateRange.value = {
        start: toCalendarDate(data.start_date),
        end: toCalendarDate(data.end_date),
      }
    }
  }

  // Saves the keyset (only while under review) and then the kit; approving or
  // rejecting rides on the kit save so the server can cascade to the keyset.
  // The server sends a submitter's rejected keyset back to review.
  const save = async (action: 'update' | 'approve' | 'reject' = 'update') => {
    if (keysetUnderReview.value) {
      await $fetch(`/api/keysets/${submissionKey}`, {
        method: 'post',
        body: toKeysetPayload(),
      })
    }

    await $fetch(`/api/keysets/${submissionKey}/kits`, {
      method: 'post',
      body: {
        ...toPayload(kits.value[0]!),
        profile_keyset_id: submissionKey,
        ...(action === 'update' ? {} : { action }),
      },
    })
  }

  const remove = () =>
    $fetch(`/api/keysets/${submissionKey}/kits/${submission?.id}`, {
      method: 'delete',
    })

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

  // Only a successful empty response means there's nothing to pick from.
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

  const validateStep = useStepValidation([
    () => entitySelectionSchema.safeParse(profile.value),
    () =>
      keysetMode.value === 'existing'
        ? entitySelectionSchema.safeParse(existingKeyset.value)
        : createKeysetSchema(manufacturers).safeParse({
            ...keyset.value,
            profile_id: profile.value.id,
          }),
    () => validateEach(keysetKitSchema, kits.value),
  ])

  const submit = async () => {
    uploading.value = true

    try {
      let profileKeysetId = existingKeyset.value.id

      if (keysetMode.value === 'new') {
        const created: any = await $fetch('/api/submissions/keyset', {
          method: 'post',
          body: {
            keyset: { ...toKeysetPayload(), profile_id: profile.value.id },
          },
        })

        profileKeysetId = created.profile_keyset_id
      }

      for (const kit of kits.value) {
        await $fetch(`/api/keysets/${profileKeysetId}/kits`, {
          method: 'post',
          body: { ...toPayload(kit), profile_keyset_id: profileKeysetId },
        })
      }

      toast.add(handleSuccess('add', `${kits.value.length} kit(s)`, 'Kit'))
    } catch (error: any) {
      toast.add(handleError(error, { showOriginalMessage: true }))

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
    reviewStatus,
    keysetUnderReview,
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
