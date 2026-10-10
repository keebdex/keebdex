import { z } from 'zod'

// Deletes one of the user's notifications.
export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)
  const { id } = getRouterParams(event)

  if (!z.uuid().safeParse(id).success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Notification not found',
    })
  }

  const { data, error } = await client
    .from('notifications')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // RLS hides other users' notifications, so nothing back means not found.
  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Notification not found',
    })
  }

  return { success: true, unread: await getUnreadCount(client) }
})
