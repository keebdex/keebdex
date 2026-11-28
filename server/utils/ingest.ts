import { createError } from 'h3'
import type { getActorProfile } from './admin'

type SupabaseClient = Awaited<ReturnType<typeof getActorProfile>>['client']

// The `ingest` schema (crawled forum data, `20261119000000_ingest_schema`) is
// not in the generated types, so it goes through an untyped handle. Its RLS
// limits candidates to staff: all of them for can_manage_all(), the ones
// matched to their pages for assigned staff.
export const candidatesTable = (client: SupabaseClient) =>
  (client as any).schema('ingest').from('candidates')

export type IngestCandidateRow = {
  id: number
  thread_id: number
  module: 'Keyset' | 'Keyboard'
  match_key: string | null
  state: 'new' | 'promoted' | 'dismissed' | 'superseded'
}

/** The candidate as the caller may read it; 404 when RLS hides it. */
export const getCandidate = async (client: SupabaseClient, id: number) => {
  const { data, error } = await candidatesTable(client)
    .select('id, thread_id, module, match_key, state')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  return data as IngestCandidateRow
}

/** The `[id]` route param as a candidate id. */
export const candidateId = (value: string | undefined) => {
  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid candidate' })
  }

  return id
}
