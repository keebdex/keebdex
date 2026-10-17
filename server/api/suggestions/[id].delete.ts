import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getActorProfile } from '../../utils/admin'
import {
  getSuggestion,
  suggestionError,
  suggestionsTable,
} from '../../utils/edit-suggestions'

/**
 * Withdraws a suggestion (its submitter, while Pending) or deletes it (staff
 * of its scope). RLS decides; nothing deleted means not allowed.
 */
export default defineEventHandler(async (event) => {
  const { client } = await getActorProfile(event)
  const suggestion = await getSuggestion(client, getRouterParam(event, 'id'))

  const { data, error } = await suggestionsTable(client)
    .delete()
    .eq('id', suggestion.id)
    .select('id')

  if (error) throw suggestionError(error)

  if (!data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only pending suggestions can be withdrawn.',
    })
  }

  return { success: true }
})
