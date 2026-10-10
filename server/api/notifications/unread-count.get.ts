export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)

  return { unread: await getUnreadCount(client) }
})
