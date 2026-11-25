import { refDebounced } from '@vueuse/core'
import type { CandidatePayload, IngestCandidate } from '~/utils/ingest'

const CANDIDATE_COLUMNS =
  'id, thread_id, module, extractor_version, payload, confidence, match_key, state, promoted_kind, promoted_id, review_note, reviewed_at, created_at, thread:threads(id, url, board, title, author, images, posted_at, changed_at, ignored_at)'

// The matched keyset as Keebdex has it now, to compare with the thread.
const currentKeyset = async (
  matchKey: string,
): Promise<CandidatePayload | null> => {
  try {
    const { kits, ...keyset }: Record<string, any> = await $fetch(
      `/api/keysets/${matchKey}`,
    )

    return { keyset, kits: kits || [] }
  } catch {
    return null
  }
}

/**
 * State and actions of the Forum Review page (`/keyset/forum-review`): state
 * filter, search, pagination, expandable rows, Approve (a new keyset, or the
 * missing fields and kits of a matched one), Dismiss with a note, and Restore.
 *
 * Reads the crawled keysets straight from `ingest.candidates` and their
 * threads (`ingest.threads`, images included) with the signed-in client, so
 * RLS limits them to the staff member's scope. Until the `/api/ingest`
 * endpoints exist, the actions change only the loaded rows in memory.
 */
export const useForumReviewQueue = () => {
  const toast = useToast()
  const client = useSupabaseClient()
  const { user } = storeToRefs(useUserStore())
  const { manufacturers } = useKeysetProfiles()

  // `ingest` is not in the generated Database type yet.
  const ingest = () => (client as any).schema('ingest')

  const stateFilter = ref('new')
  const search = ref('')
  const term = refDebounced(search, 300)
  const { page, size, setPage, resetPage } = usePagination(10)

  watch([stateFilter, term], resetPage)

  const label = (candidate: IngestCandidate) =>
    candidateLabel(
      candidate,
      manufacturers.value[candidate.payload.keyset.profile_id],
    )

  const { data, status, error } = useAsyncData(
    'forum-review',
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

      const { data: rows, count, error: queryError } = await query

      if (queryError) throw queryError

      const candidates: IngestCandidate[] = await Promise.all(
        (rows || []).map(async (row: any) => ({
          ...row,
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

  // Candidates waiting for review, for the navbar badge.
  const waiting = ref(0)
  const loadWaiting = async () => {
    const { count } = await ingest()
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('module', 'Keyset')
      .eq('state', 'new')

    waiting.value = count || 0
  }
  onMounted(loadWaiting)

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

  const review = (
    candidate: IngestCandidate,
    changes: Partial<IngestCandidate>,
  ) => {
    Object.assign(candidate, {
      ...changes,
      reviewed_at: new Date().toISOString(),
      reviewer: { full_name: user.value?.name || null },
    })
  }

  // The candidate being approved, in the approve modal.
  const approveTarget = ref<IngestCandidate | null>(null)
  const approveOpen = computed({
    get: () => !!approveTarget.value,
    set: (open) => {
      if (!open) approveTarget.value = null
    },
  })

  // `payload` is what approving writes: the corrected keyset and kits, or the
  // fields and kits a matched keyset lacks. The preview only logs it and
  // marks the candidate.
  const approve = (candidate: IngestCandidate, payload: CandidatePayload) => {
    console.info('forum review approve', candidate.id, payload)

    const matched = !!candidate.match_key

    waiting.value -= 1
    review(candidate, {
      state: 'promoted',
      promoted_kind: 'keyset',
      // The id of the keyset the endpoint writes; none in the preview.
      promoted_id: 0,
    })
    approveTarget.value = null
    toast.add(
      successToast(matched ? 'update' : 'approve', {
        entity: 'Keyset',
        name: label(candidate),
      }),
    )
  }

  // Dismissing asks for an optional note first.
  const dismissTarget = ref<IngestCandidate | null>(null)
  const dismissNote = ref('')
  const dismissOpen = computed({
    get: () => !!dismissTarget.value,
    set: (open) => {
      if (!open) dismissTarget.value = null
    },
  })

  const dismiss = (candidate: IngestCandidate) => {
    dismissNote.value = ''
    dismissTarget.value = candidate
  }

  const confirmDismiss = () => {
    const candidate = dismissTarget.value

    if (!candidate) return

    waiting.value -= 1
    review(candidate, {
      state: 'dismissed',
      review_note: dismissNote.value.trim() || null,
    })
    dismissTarget.value = null
    toast.add(
      successToast('dismiss', { entity: 'Keyset', name: label(candidate) }),
    )
  }

  // Dismissed -> new; refused while a newer extraction of the thread waits.
  const restore = (candidate: IngestCandidate) => {
    const newer = rows.value.some(
      (other) =>
        other.thread_id === candidate.thread_id &&
        other.module === candidate.module &&
        other.state === 'new',
    )

    if (newer) {
      toast.add(
        validationToast(
          'A newer reading of this thread is waiting for review; review that one instead.',
          'Already Waiting',
        ),
      )
      return
    }

    waiting.value += 1
    review(candidate, { state: 'new', review_note: null })
    toast.add(
      successToast('restore', { entity: 'Keyset', name: label(candidate) }),
    )
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
    waiting,
    label,
    expanded,
    allExpanded,
    toggleAll,
    approveTarget,
    approveOpen,
    approve,
    dismissTarget,
    dismissNote,
    dismissOpen,
    dismiss,
    confirmDismiss,
    restore,
  }
}
