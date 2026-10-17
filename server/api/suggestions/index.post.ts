import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createSuggestionSchema } from '~/utils/schemas/suggestion'
import {
  SUGGESTION_COLUMNS,
  parseSuggestionChanges,
  suggestionError,
  suggestionsTable,
} from '../../utils/edit-suggestions'

/**
 * Suggests changes to a published record. The guard trigger checks that the
 * record is published, captures its current values (`original`), drops
 * unchanged fields, and files the suggestion as Pending under the caller.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const result = createSuggestionSchema.safeParse(await readBody(event))

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message || 'Invalid suggestion',
    })
  }

  const { entity_type, entity_id, reason } = result.data
  const changes = parseSuggestionChanges(entity_type, result.data.changes)

  const client = await serverSupabaseClient(event)
  const { data, error } = await suggestionsTable(client)
    .insert({
      entity_type,
      entity_id,
      changes,
      reason: reason ?? null,
      submitted_by: user.sub,
    })
    .select(SUGGESTION_COLUMNS)
    .single()

  if (error) throw suggestionError(error)

  return data
})
