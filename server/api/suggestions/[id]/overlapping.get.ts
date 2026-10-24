import { createError, defineEventHandler, getRouterParam } from 'h3'
import {
  SUGGESTION_COLUMNS,
  getSuggestion,
  suggestionsTable,
  withSuggestionRecords,
} from '../../../utils/edit-suggestions'
import { getActorNames, requireRevisionStaff } from '../../../utils/revisions'

/**
 * Other Pending suggestions for the same record that change at least one of
 * this suggestion's fields, oldest first, shaped like the Edits queue's rows
 * (so the review modal can open one) plus `overlap` (the shared fields) and
 * the submitter's name and avatar. Each user has at most one Pending
 * suggestion per record, so these always come from someone else. Staff only;
 * RLS keeps them to their scope.
 */
export default defineEventHandler(async (event) => {
  const { client } = await requireRevisionStaff(event)
  const { id } = await getSuggestion(client, getRouterParam(event, 'id'))

  const { data: suggestion, error: readError } = await suggestionsTable(client)
    .select('entity_type, entity_id, changes')
    .eq('id', id)
    .single()

  if (readError) {
    throw createError({ statusCode: 500, statusMessage: readError.message })
  }

  const { data, error } = await suggestionsTable(client)
    .select(SUGGESTION_COLUMNS)
    .eq('entity_type', suggestion.entity_type)
    .eq('entity_id', suggestion.entity_id)
    .eq('review_status', 'Pending')
    .neq('id', id)
    .order('created_at')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const fields = Object.keys(suggestion.changes || {})
  const overlapping = (data || [])
    .map((row: any) => ({
      ...row,
      overlap: fields.filter((key) => key in (row.changes || {})),
    }))
    .filter((row: any) => row.overlap.length)

  if (!overlapping.length) return { data: [] }

  const [rows, names] = await Promise.all([
    withSuggestionRecords(client, overlapping),
    getActorNames(
      client,
      overlapping.map((row: any) => row.submitted_by),
    ),
  ])

  return {
    data: rows.map((row) => ({
      ...row,
      submitter_name: names.get(row.submitted_by)?.name ?? null,
      submitter_avatar: names.get(row.submitted_by)?.avatar ?? null,
    })),
  }
})
