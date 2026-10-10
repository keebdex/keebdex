export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)

  const { data, error } = await client.rpc('mark_all_notifications_read')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { updated: data ?? 0, unread: 0 }
})
