import { createError, defineEventHandler } from 'h3'
import { requireAdminClient } from '../../utils/admin'

// Every announcement (scheduled, live, and ended), newest start first.
export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const { data, error } = await client
    .from('announcements')
    .select(`${ANNOUNCEMENT_FIELDS}, created_at, updated_at`)
    .order('starts_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { data: data || [] }
})
