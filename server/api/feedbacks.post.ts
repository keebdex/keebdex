import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const messageSchema = z
  .string({ error: 'Message is required.' })
  .trim()
  .min(1, 'Message is required.')

const guestSchema = z.object({
  message: messageSchema,
  name: z
    .string({ error: 'Name is required.' })
    .trim()
    .min(1, 'Name is required.'),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => value || null)
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: 'Please enter a valid email address.',
    }),
})

// Signed-in users only send a message: the database links the feedback to
// them (feedbacks.submitted_by), and their name and email come from their
// profile. Guests send a name and an optional email.
export default defineEventHandler(async (event) => {
  const [client, user] = await Promise.all([
    serverSupabaseClient(event),
    serverSupabaseUser(event),
  ])
  const body = await readBody(event)

  const result = user
    ? z.object({ message: messageSchema }).safeParse(body)
    : guestSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message,
    })
  }

  const { error } = await client.from('feedbacks').insert(result.data)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return { success: true }
})
