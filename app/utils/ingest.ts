import { isBlank } from '~/utils'
import { suggestionFieldLabel } from '~/utils/suggestions'

/**
 * Forum review: what the crawler (`magpie` in keebdex/aviary) read from forum
 * threads waits in `ingest.candidates` until staff approve or dismiss it at
 * `/keyset/forum-review`. A candidate's `payload` is shaped like the keyset
 * submission body (`{ keyset, kits }`), with the extractor's confidence per
 * field. A candidate with a `match_key` describes a keyset Keebdex already
 * has: approving it only fills that keyset's empty fields and adds its
 * missing kits, never overwriting what is there.
 */

export type CandidateState = 'new' | 'promoted' | 'dismissed' | 'superseded'

export interface IngestThread {
  id: number
  url: string
  board: 'ic' | 'gb' | null
  title: string
  author: string | null
  images: string[]
  posted_at: string | null
  changed_at: string | null
  ignored_at: string | null
}

export interface CandidatePayload {
  keyset: Record<string, any>
  kits: Record<string, any>[]
}

export interface IngestCandidate {
  id: number
  thread_id: number
  module: 'Keyset' | 'Keyboard'
  extractor_version: string
  payload: CandidatePayload
  confidence: Record<string, number>
  match_key: string | null
  state: CandidateState
  promoted_kind: 'keyset' | 'keyboard' | 'edit_suggestion' | null
  promoted_id: number | null
  review_note: string | null
  reviewed_at: string | null
  reviewer: { full_name: string | null } | null
  created_at: string
  thread: IngestThread
  // The matched keyset as Keebdex has it now (`match_key` set), to compare.
  current: CandidatePayload | null
}

export const CANDIDATE_STATE_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Approved', value: 'promoted' },
  { label: 'Dismissed', value: 'dismissed' },
  { label: 'Superseded', value: 'superseded' },
  { label: 'All', value: 'all' },
]

export const CANDIDATE_STATE_LABELS: Record<CandidateState, string> = {
  new: 'New',
  promoted: 'Approved',
  dismissed: 'Dismissed',
  superseded: 'Superseded',
}

export const candidateStateColorMap: Record<CandidateState, string> = {
  new: 'warning',
  promoted: 'success',
  dismissed: 'error',
  superseded: 'neutral',
}

export const THREAD_BOARD_LABELS: Record<string, string> = {
  ic: 'IC',
  gb: 'GB',
}

// Below this the extractor often reads a field wrong (a vendor as the
// designer, a render of a board as the cover), so staff check it.
export const LOW_CONFIDENCE = 0.7

// The keyset fields a candidate can carry, in the order they are reviewed.
export const CANDIDATE_KEYSET_FIELDS = [
  'profile_id',
  'name',
  'designer',
  'sculpt',
  'status',
  'ic_date',
  'start_date',
  'end_date',
  'url',
  'img',
  'description',
]

const REQUIRED_KEYSET_FIELDS = ['profile_id', 'name', 'img']

/** Required fields the extractor could not read, `kits` included. */
export const missingCandidateFields = ({ payload }: IngestCandidate) => [
  ...REQUIRED_KEYSET_FIELDS.filter((field) => isBlank(payload.keyset[field])),
  ...(payload.kits.length ? [] : ['kits']),
]

/** Fields the extractor read but is not sure of. */
export const lowConfidenceFields = ({ confidence }: IngestCandidate) =>
  Object.entries(confidence)
    .filter(([, value]) => value < LOW_CONFIDENCE)
    .map(([field]) => field)

/** e.g. "GMK Olivia"; the thread title when the name was not read. */
export const candidateLabel = (
  candidate: IngestCandidate,
  profileName?: string,
) =>
  candidate.payload.keyset.name
    ? [
        profileName || candidate.payload.keyset.profile_id,
        candidate.payload.keyset.name,
      ]
        .filter(Boolean)
        .join(' ')
    : candidate.thread.title

/**
 * What approving a matched candidate writes: the keyset fields Keebdex has
 * empty and the candidate has, and the kits Keebdex does not list yet.
 */
export const candidateFill = ({ payload, current }: IngestCandidate) => {
  if (!current) return { fields: {}, kits: [] }

  const fields = Object.fromEntries(
    CANDIDATE_KEYSET_FIELDS.filter(
      (field) =>
        isBlank(current.keyset[field]) && !isBlank(payload.keyset[field]),
    ).map((field) => [field, payload.keyset[field]]),
  )
  const listed = new Set(current.kits.map((kit) => kit.kit_id))
  const kits = payload.kits.filter((kit) => !listed.has(kit.kit_id))

  return { fields, kits }
}

// Labels of the columns approving writes that no form shows; the rest come
// from `suggestionFieldLabel`.
const SYSTEM_COLUMN_LABELS: Record<string, string> = {
  profile_keyset_id: 'Page Key',
  slug: 'Slug',
  kit_id: 'Kit',
  review_status: 'Review Status',
  verified_by: 'Verified By',
  verified_at: 'Verified At',
  submitted_by: 'Submitted By',
  state: 'State',
  promoted_kind: 'Approved As',
  promoted_id: 'Approved Record',
  reviewed_by: 'Reviewed By',
  reviewed_at: 'Reviewed At',
}

export const insertColumnLabel = (column: string) =>
  SYSTEM_COLUMN_LABELS[column] || suggestionFieldLabel(column)

// The keysets columns a new keyset from a thread is written with, in order.
export const KEYSET_INSERT_COLUMNS = [
  'profile_keyset_id',
  'profile_id',
  'slug',
  ...CANDIDATE_KEYSET_FIELDS.filter((field) => field !== 'profile_id'),
]

// The keyset_kits columns of each kit, before the moderation columns.
export const KIT_INSERT_COLUMNS = [
  'profile_keyset_id',
  'kit_id',
  'name',
  'img',
  'price',
  'qty',
  'description',
  'cancelled',
]
