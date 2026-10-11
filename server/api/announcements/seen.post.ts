// The signed-in user opened the Announcements tab: everything published so far
// stops counting as new.
export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)

  const { data, error } = await client.rpc('mark_announcements_seen')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { seenAt: data }
})
