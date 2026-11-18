import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

// The only columns a user changes on their own row: id, email, and full_name
// come from the sign-in account, role, assignments, and supporter from the
// admin endpoint, and appearance from its own (guard_user_role() enforces the
// same in the database).
const social = z.string().max(100).nullable().optional()
const profileSchema = z
  .object({
    discord: social,
    reddit: social,
    qq: social,
    leaderboard_hidden: z.boolean().optional(),
    pins: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const id = event.context.params?.id
  if (!user)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing user id' })
  if (user.sub !== id)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const payload = await readValidatedBody(event, profileSchema.parse)

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('users')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
