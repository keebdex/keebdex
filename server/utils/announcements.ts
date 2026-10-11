import { createError } from 'h3'
import type { ZodType } from 'zod'

export const ANNOUNCEMENT_FIELDS =
  'key, title, description, icon, color, cta_label, cta_url, show_toast, audience, priority, starts_at, ends_at'

/** The `notification_preferences` key that turns homepage toasts off. */
export const ANNOUNCEMENT_TOASTS_PREFERENCE = 'announcement_toasts'

/**
 * Validates a request body with an announcement schema. The schema lists every
 * writable column, so it also works as the field whitelist, and it applies the
 * same rules as the table constraints.
 */
export const parseAnnouncementBody = <T>(schema: ZodType<T>, body: unknown) => {
  const result = schema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message,
    })
  }

  return result.data
}

/** Maps a failed announcement write to an API error. */
export const announcementWriteError = (error: {
  code?: string
  message: string
}) => {
  // unique_violation: the key is taken.
  if (error.code === '23505') {
    return createError({
      statusCode: 409,
      statusMessage: 'An announcement with this key already exists.',
    })
  }

  // check_violation: a table constraint (e.g. cta_url) refused the row.
  if (error.code === '23514') {
    return createError({
      statusCode: 400,
      statusMessage: 'The announcement has an invalid value.',
    })
  }

  // RLS refused the write: only admins write announcements.
  if (error.code === '42501') {
    return createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return createError({ statusCode: 500, statusMessage: error.message })
}
