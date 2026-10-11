import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdminClient } from '../../../utils/admin'
import { announcementPatchSchema } from '~/utils/schemas/announcement'

// Updates an announcement; the key never changes. Unpublishing sends
// `{ ends_at: <now> }`.
export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const body = parseAnnouncementBody(
    announcementPatchSchema,
    await readBody(event),
  )

  const { data, error } = await client
    .from('announcements')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('key', getRouterParam(event, 'key')!)
    .select(ANNOUNCEMENT_FIELDS)

  if (error) throw announcementWriteError(error)

  if (!data?.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Announcement not found.',
    })
  }

  return data[0]
})
