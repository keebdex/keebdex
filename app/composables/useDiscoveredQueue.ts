import { refDebounced } from '@vueuse/core'
import type { CandidatePayload, IngestCandidate } from '~/utils/ingest'

const CANDIDATE_COLUMNS =
  'id, thread_id, module, extractor_version, payload, confidence, match_key, state, promoted_kind, promoted_id, review_note, reviewed_at, created_at, thread:threads(id, url, board, title, author, images, posted_at, changed_at, ignored_at)'

// The `ingest` schema of the signed-in client, which is not in the generated
// Database type yet. Call it in setup: the client is read from the Nuxt app.
const useIngest = () => {
  const client = useSupabaseClient()

  return () => (client as any).schema('ingest')
}

// The matched keyset as Keebdex has it now, to compare with the thread; null
// when it cannot be read, which the approve modal shows as an error.
const currentKeyset = async (
  matchKey: string,
): Promise<CandidatePayload | null> => {
  try {
    const { kits, ...keyset }: Record<string, any> = await $fetch(
      `/api/keysets/${matchKey}`,
    )

    return { keyset, kits: kits || [] }
  } catch (error) {
    console.error('fetch matched keyset error', matchKey, error)
    return null
  }
}

/**
 * State and actions of the Discovered tab of the keyset submissions page
 * (`/keyset/submissions?view=discovered`, `IngestDiscoveredQueue`): state
 * filter, search, pagination, expandable rows, Approve (a new keyset, or the
 * missing fields and kits of a matched one), Dismiss with a note, and Restore.
 *
 * Reads the crawled keysets straight from `ingest.candidates` and their
 * threads (`ingest.threads`, images included) with the signed-in client, so
 * RLS limits them to the staff member's scope. The actions go through
 * `POST /api/ingest/candidates/:id` (dismiss, restore) and
 * `POST /api/ingest/candidates/:id/approve`, then reload the rows and the
 * pending badges.
 */
export const useDiscoveredQueue = () => {
  const toast = useToast()
  const ingest = useIngest()
  const { manufacturers } = useKeysetProfiles()
  const { load: loadPending } = usePendingReviews()

  const stateFilter = ref('new')
  const search = ref('')
  const term = refDebounced(search, 300)
  const { page, size, setPage, resetPage } = usePagination(10)

  watch([stateFilter, term], resetPage)

  // Kit categories, to drop the kit names that only repeat them.
  let kitCategories: Promise<{ slug: string; name: string }[]> | null = null
  const loadKitCategories = () =>
    (kitCategories ||= $fetch<{ slug: string; name: string }[]>(
      '/api/keysets/kits',
    ).catch((error) => {
      kitCategories = null
      throw error
    }))

  const label = (candidate: IngestCandidate) =>
    candidateLabel(
      candidate,
      manufacturers.value[candidate.payload.keyset.profile_id],
    )

  const { data, status, error, refresh } = useAsyncData(
    'discovered-keysets',
    async () => {
      const from = (page.value - 1) * size
      let query = ingest()
        .from('candidates')
        .select(CANDIDATE_COLUMNS, { count: 'exact' })
        .eq('module', 'Keyset')
        .order('created_at', { ascending: false })
        .range(from, from + size - 1)

      if (stateFilter.value !== 'all')
        query = query.eq('state', stateFilter.value)

      // LIKE wildcards in the term are matched literally.
      const text = term.value.trim().replace(/[\\%_]/g, (c) => `\\${c}`)
      if (text) query = query.ilike('payload->keyset->>name', `%${text}%`)

      const [{ data: rows, count, error: queryError }, categories] =
        await Promise.all([query, loadKitCategories()])

      if (queryError) throw queryError

      const candidates: IngestCandidate[] = await Promise.all(
        (rows || []).map(async (row: any) => ({
          ...row,
          payload: {
            ...row.payload,
            kits: withoutCategoryNames(row.payload.kits || [], categories),
          },
          reviewer: null,
          current: row.match_key ? await currentKeyset(row.match_key) : null,
        })),
      )

      return { candidates, count: count || 0 }
    },
    {
      server: false,
      deep: true,
      watch: [stateFilter, term, page],
      default: () => ({ candidates: [] as IngestCandidate[], count: 0 }),
    },
  )

  watch(error, (value) => {
    if (value) toast.add(errorToast(value))
  })

  const rows = computed(() => data.value.candidates)

  const paginationMeta = computed(() => {
    const total = data.value.count

    if (!total || !rows.value.length) return { total, from: 0, to: 0 }

    const from = (page.value - 1) * size + 1

    return { total, from, to: from + rows.value.length - 1 }
  })

  const expanded = ref<Record<string, boolean>>({})
  const allExpanded = computed(
    () =>
      rows.value.length > 0 &&
      rows.value.every((candidate) => expanded.value[candidate.id]),
  )
  const toggleAll = () => {
    expanded.value = allExpanded.value
      ? {}
      : Object.fromEntries(rows.value.map((candidate) => [candidate.id, true]))
  }

  // Reloads what a review action changed: the rows and the tab badges.
  const reviewed = () => Promise.all([refresh(), loadPending()])

  // The candidate being approved, in the approve modal.
  const approveTarget = ref<IngestCandidate | null>(null)
  const approving = ref(false)
  const approveOpen = computed({
    get: () => !!approveTarget.value,
    set: (open) => {
      if (!open && !approving.value) approveTarget.value = null
    },
  })

  // `payload` is what approving writes: the corrected keyset and kits, or the
  // changed fields and the kits of a matched keyset.
  const approve = async (
    candidate: IngestCandidate,
    payload: CandidatePayload,
  ) => {
    approving.value = true

    try {
      await $fetch(`/api/ingest/candidates/${candidate.id}/approve`, {
        method: 'POST',
        body: payload,
      })

      approveTarget.value = null
      toast.add(
        successToast(candidate.match_key ? 'update' : 'approve', {
          entity: 'Keyset',
          name: label(candidate),
        }),
      )
      await reviewed()
    } catch (e) {
      toast.add(errorToast(e, { showOriginalMessage: true }))
    } finally {
      approving.value = false
    }
  }

  // Dismissing asks for an optional note first.
  const dismissTarget = ref<IngestCandidate | null>(null)
  const dismissNote = ref('')
  const dismissing = ref(false)
  const dismissOpen = computed({
    get: () => !!dismissTarget.value,
    set: (open) => {
      if (!open && !dismissing.value) dismissTarget.value = null
    },
  })

  const dismiss = (candidate: IngestCandidate) => {
    dismissNote.value = ''
    dismissTarget.value = candidate
  }

  const confirmDismiss = async () => {
    const candidate = dismissTarget.value

    if (!candidate) return

    dismissing.value = true

    try {
      await $fetch(`/api/ingest/candidates/${candidate.id}`, {
        method: 'POST',
        body: { action: 'dismiss', note: dismissNote.value },
      })

      dismissTarget.value = null
      toast.add(
        successToast('dismiss', { entity: 'Keyset', name: label(candidate) }),
      )
      await reviewed()
    } catch (e) {
      toast.add(errorToast(e, { showOriginalMessage: true }))
    } finally {
      dismissing.value = false
    }
  }

  // Dismissed -> new; the endpoint refuses it while a newer reading of the
  // thread waits.
  const restoringId = ref<number | null>(null)

  const restore = async (candidate: IngestCandidate) => {
    restoringId.value = candidate.id

    try {
      await $fetch(`/api/ingest/candidates/${candidate.id}`, {
        method: 'POST',
        body: { action: 'restore' },
      })

      toast.add(
        successToast('restore', { entity: 'Keyset', name: label(candidate) }),
      )
      await reviewed()
    } catch (e) {
      toast.add(errorToast(e, { showOriginalMessage: true }))
    } finally {
      restoringId.value = null
    }
  }

  return {
    status,
    stateFilter,
    search,
    page,
    size,
    setPage,
    rows,
    paginationMeta,
    label,
    expanded,
    allExpanded,
    toggleAll,
    approveTarget,
    approveOpen,
    approving,
    approve,
    dismissTarget,
    dismissNote,
    dismissOpen,
    dismissing,
    dismiss,
    confirmDismiss,
    restoringId,
    restore,
  }
}
