import { defineEventHandler, readBody } from 'h3'
import { requireAdminClient } from '../../utils/admin'
import { announcementSchema } from '~/utils/schemas/announcement'

// Creates an announcement. It goes live at `starts_at` (now or scheduled).
export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const body = parseAnnouncementBody(announcementSchema, await readBody(event))

  const { data, error } = await client
    .from('announcements')
    .insert(body)
    .select(ANNOUNCEMENT_FIELDS)
    .single()

  if (error) throw announcementWriteError(error)

  return data
})
