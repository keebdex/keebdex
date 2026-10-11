import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAdminClient } from '../../../utils/admin'

// Deletes an announcement and its dismissals (on delete cascade).
export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const { data, error } = await client
    .from('announcements')
    .delete()
    .eq('key', getRouterParam(event, 'key')!)
    .select('key')

  if (error) throw announcementWriteError(error)

  if (!data?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Announcement not found.',
    })
  }

  return { deleted: data[0]!.key }
})
