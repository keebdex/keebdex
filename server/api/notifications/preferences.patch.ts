import { z } from 'zod'
import {
  NOTIFICATION_PREFERENCE_KEYS,
  resolveNotificationPreferences,
} from '~/utils/notification-preferences'

const bodySchema = z
  .record(z.string(), z.boolean())
  .refine((patch) => Object.keys(patch).length > 0, {
    error: 'At least one preference is required',
  })
  .refine(
    (patch) =>
      Object.keys(patch).every((key) =>
        NOTIFICATION_PREFERENCE_KEYS.includes(key),
      ),
    { error: 'Unknown notification preference' },
  )

// Turns notification preferences on or off: `{ submission_approved: false }`.
export default defineEventHandler(async (event) => {
  const { client, user } = await getNotificationsContext(event)

  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message,
    })
  }

  const updatedAt = new Date().toISOString()
  const rows = Object.entries(result.data).map(([preference, enabled]) => ({
    user_id: user.sub,
    preference,
    enabled,
    updated_at: updatedAt,
  }))

  const { error } = await client
    .from('notification_preferences')
    .upsert(rows, { onConflict: 'user_id,preference' })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const { data, error: readError } = await client
    .from('notification_preferences')
    .select('preference, enabled')

  if (readError) {
    throw createError({ statusCode: 500, statusMessage: readError.message })
  }

  return { preferences: resolveNotificationPreferences(data || []) }
})
