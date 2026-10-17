import { createError, defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { isSuggestionEntityType } from '~/utils/suggestions'
import {
  SUGGESTION_COLUMNS,
  suggestionsTable,
} from '../../utils/edit-suggestions'

/**
 * The caller's pending suggestion for a record, if any, so the Suggest Edit
 * modal reopens it instead of filing a second one.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const entityId = Number(query.entity_id)

  if (!isSuggestionEntityType(query.entity_type) || !(entityId > 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid record' })
  }

  const client = await serverSupabaseClient(event)
  const { data, error } = await suggestionsTable(client)
    .select(SUGGESTION_COLUMNS)
    .eq('entity_type', query.entity_type)
    .eq('entity_id', entityId)
    .eq('submitted_by', user.sub)
    .eq('review_status', 'Pending')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
