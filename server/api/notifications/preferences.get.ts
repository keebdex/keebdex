import { resolveNotificationPreferences } from '~/utils/notification-preferences'

// The user's notification preferences for every known key (missing rows are
// on).
export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)

  const { data, error } = await client
    .from('notification_preferences')
    .select('preference, enabled')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { preferences: resolveNotificationPreferences(data || []) }
})
