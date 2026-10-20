import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { getActorProfile } from '../../utils/admin'
import {
  SUGGESTION_COLUMNS,
  getSuggestion,
  parseSuggestionChanges,
  suggestionError,
  suggestionsTable,
} from '../../utils/edit-suggestions'
import { reviewNoteSchema } from '~/utils/schemas/common'
import { suggestionReasonSchema } from '~/utils/schemas/suggestion'
import { canManageAssignment } from '~/utils/permissions'

const bodySchema = z.object({
  action: z.enum(['approve', 'reject']).optional(),
  changes: z.record(z.string(), z.unknown()).optional(),
  reason: suggestionReasonSchema,
  note: z.unknown().optional(),
})

/**
 * - Staff `{ action: 'approve', changes? }`: applies `changes` (the fields
 *   they kept, possibly adjusted; the suggested ones by default) to the record
 *   and approves the suggestion, in one transaction.
 * - Staff `{ action: 'reject', note }`: rejects it; the note is required.
 * - Submitter `{ changes, reason }`: edits their own pending suggestion.
 */
export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const suggestion = await getSuggestion(client, getRouterParam(event, 'id'))

  const body = bodySchema.safeParse(await readBody(event))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'Invalid request',
    })
  }

  const { action, reason } = body.data
  const changes =
    body.data.changes === undefined
      ? undefined
      : parseSuggestionChanges(suggestion.entity_type, body.data.changes)

  if (action) {
    if (!canManageAssignment(profile, suggestion.scope)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only moderators can approve or reject suggestions.',
      })
    }

    if (action === 'approve') {
      const { error } = await (client as any).rpc('apply_edit_suggestion', {
        p_id: suggestion.id,
        p_changes: changes ?? null,
      })

      if (error) throw suggestionError(error)
    } else {
      const note = reviewNoteSchema.safeParse(body.data.note)

      if (!note.success) {
        throw createError({
          statusCode: 400,
          statusMessage: note.error.issues[0]?.message,
        })
      }

      const { data, error } = await suggestionsTable(client)
        .update({ review_status: 'Rejected', review_note: note.data })
        .eq('id', suggestion.id)
        .select('id')

      if (error) throw suggestionError(error)

      if (!data?.length) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You do not have permission to reject this suggestion.',
        })
      }
    }
  } else {
    if (suggestion.submitted_by !== user.sub) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only the submitter can edit a suggestion.',
      })
    }

    if (changes === undefined && reason === undefined) {
      throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
    }

    const { data, error } = await suggestionsTable(client)
      .update({
        ...(changes !== undefined && { changes }),
        ...(reason !== undefined && { reason }),
      })
      .eq('id', suggestion.id)
      .select('id')

    if (error) throw suggestionError(error)

    if (!data?.length) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only pending suggestions can be edited.',
      })
    }
  }

  const { data, error } = await suggestionsTable(client)
    .select(SUGGESTION_COLUMNS)
    .eq('id', suggestion.id)
    .single()

  if (error) throw suggestionError(error)

  return data
})
