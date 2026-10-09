import { parseDate, type CalendarDate } from '@internationalized/date'
import { createKeysetSchema, keysetKitSchema } from '~/utils/schemas/keyset'
import { entitySelectionSchema, validateEach } from '~/utils/schemas/common'

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
  // `profile_keyset_id` is "<profile>/<keyset>"; split it so each segment fills
  // its own route param and $fetch resolves the right typed route.
  const [submissionProfile = '', submissionKeyset = ''] =
    submissionKey.split('/')

  const keysetUnderReview = computed(
    () => !!keysetReviewStatus.value && keysetReviewStatus.value !== 'Approved',
  )

  const load = async () => {
    if (!isReview || !submission) return

    profile.value = { id: submissionProfile }
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
      const data: any = await $fetch(
        `/api/keysets/${submissionProfile}/${submissionKeyset}`,
      )

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
      await $fetch(`/api/keysets/${submissionProfile}/${submissionKeyset}`, {
        method: 'post',
        body: toKeysetPayload(),
      })
    }

    await $fetch(`/api/keysets/${submissionProfile}/${submissionKeyset}/kits`, {
      method: 'post',
      body: {
        ...toPayload(kits.value[0]!),
        profile_keyset_id: submissionKey,
        ...(action === 'update' ? {} : { action }),
      },
    })
  }

  const remove = () =>
    $fetch(
      `/api/keysets/${submissionProfile}/${submissionKeyset}/kits/${submission?.id}`,
      {
        method: 'delete',
      },
    )

  const uploading = ref(false)

  // Keysets are searched as the user types (reusing the global search, like
  // KeyboardForm's original-keyboard picker) instead of preloading a capped
  // page, so every keyset of the profile stays reachable.
  const keysetTerm = ref('')

  const { data: keysetsData, status: keysetsStatus } = useGuardedSearch(
    '/api/search',
    {
      key: 'keyset-submission-keyset-search',
      term: keysetTerm,
      module: 'keyset',
    },
  )

  // Label of the picked keyset, kept apart from the search results so it still
  // shows after the term changes or when it came from a direct link.
  const selectedKeyset = ref<{ label: string; value: string } | null>(null)

  const keysetOptions = computed(() => {
    const groups = Array.isArray(keysetsData.value) ? keysetsData.value : []
    const prefix = `/keyset/${profile.value.id}/`
    const results = groups
      .filter((group: any) => group.id === 'keyset')
      .flatMap((group: any) => group.items || [])
      .filter((item: any) => item.to?.startsWith(prefix))
      .map((item: any) => ({
        label: item.label as string,
        value: item.to.replace('/keyset/', '') as string,
      }))
    const selected = selectedKeyset.value

    return selected && !results.some((o) => o.value === selected.value)
      ? [selected, ...results]
      : results
  })

  watch(
    () => existingKeyset.value.id,
    (id) => {
      const option = keysetOptions.value.find((o) => o.value === id)
      if (option) selectedKeyset.value = option
      else if (!id) selectedKeyset.value = null
    },
  )

  // A direct "Submit a Kit" link only carries the id; resolve its name once.
  if (!isReview && queryKeyset) {
    $fetch<any>(`/api/keysets/${queryKeyset}`)
      .then((data) => {
        if (existingKeyset.value.id === queryKeyset) {
          selectedKeyset.value = {
            label: [data.profile?.name, data.name].filter(Boolean).join(' '),
            value: queryKeyset,
          }
        }
      })
      .catch(() => {})
  }

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
      keysetTerm.value = ''
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

      toast.add(
        successToast('add', { entity: countLabel(kits.value.length, 'kit') }),
      )
    } catch (error: any) {
      toast.add(errorToast(error, { showOriginalMessage: true }))

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
    keysetTerm,
    selectedKeyset,
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
