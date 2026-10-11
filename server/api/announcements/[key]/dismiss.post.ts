// Hides an announcement for the signed-in user on every device.
export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)

  const { error } = await client.rpc('dismiss_announcement', {
    p_key: getRouterParam(event, 'key'),
  })

  if (error) {
    // RLS refuses keys the user can't see (unknown, ended, or staff-only).
    throw createError(
      error.code === '42501'
        ? { statusCode: 404, statusMessage: 'Announcement not found.' }
        : { statusCode: 500, statusMessage: error.message },
    )
  }

  return { dismissed: true }
})
