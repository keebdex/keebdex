import { z } from 'zod'

const bodySchema = z.object({ read: z.boolean() }).strict()

// Marks one notification as read (`{ read: true }`) or unread again.
export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)
  const { id } = getRouterParams(event)

  if (!z.uuid().safeParse(id).success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Notification not found',
    })
  }

  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message,
    })
  }

  const { data, error } = await client
    .from('notifications')
    .update({ read_at: result.data.read ? new Date().toISOString() : null })
    .eq('id', id)
    .select(NOTIFICATION_FIELDS)
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

  return { data, unread: await getUnreadCount(client) }
})
