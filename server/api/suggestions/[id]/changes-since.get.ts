import { createError, defineEventHandler, getRouterParam } from 'h3'
import { isEqual } from 'es-toolkit'
import {
  getSuggestion,
  suggestionError,
  suggestionsTable,
} from '../../../utils/edit-suggestions'
import {
  REVISION_COLUMNS,
  requireRevisionStaff,
  revisionsTable,
  withRevisionActors,
} from '../../../utils/revisions'

// A record rarely changes this often between a suggestion and its review.
const LIMIT = 100

/**
 * Why a suggested field shows _Changed Since_ in the review modal: per field,
 * the revisions that took it from the value the suggestion was written
 * against (`original`) to the current one, newest first, by editors, syncs,
 * reverts, or other approved suggestions. Each revision's `changes` holds only
 * that field. Staff only; RLS keeps revisions to their scope.
 */
export default defineEventHandler(async (event) => {
  const { client } = await requireRevisionStaff(event)
  const { id } = await getSuggestion(client, getRouterParam(event, 'id'))

  const { data: suggestion, error: suggestionReadError } =
    await suggestionsTable(client)
      .select('id, entity_type, entity_id, changes, original, created_at')
      .eq('id', id)
      .single()

  if (suggestionReadError) throw suggestionError(suggestionReadError)

  const { data, error } = await revisionsTable(client)
    .select(REVISION_COLUMNS)
    .eq('entity_type', suggestion.entity_type)
    .eq('entity_id', suggestion.entity_id)
    .eq('action', 'update')
    .gt('created_at', suggestion.created_at)
    .order('id', { ascending: false })
    .limit(LIMIT)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Applying this suggestion is not a change since it.
  const revisions = await withRevisionActors(
    client,
    (data || []).filter((revision: any) => revision.suggestion_id !== id),
  )

  const original = suggestion.original || {}

  // Walks back from the newest change of each field and stops at the one
  // made from the original value: a submitter who edits their suggestion
  // has it captured again, so older changes came before it.
  const fields = Object.fromEntries(
    Object.keys(suggestion.changes || {}).map((key) => {
      const chain = []

      for (const revision of revisions) {
        const change = revision.changes?.[key]

        if (!change) continue

        chain.push({ ...revision, changes: { [key]: change } })

        if (isEqual(change[0], original[key] ?? null)) break
      }

      return [key, chain]
    }),
  )

  return { data: fields }
})
