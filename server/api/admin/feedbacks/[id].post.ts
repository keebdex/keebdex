import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { requireAdminClient } from '../../../utils/admin'
import { resolutionNoteSchema } from '~/utils/schemas/common'

const bodySchema = z.object({
  resolved: z.boolean(),
  // Optional comment sent to the author with the resolved notification.
  note: resolutionNoteSchema.optional(),
})

// Resolves (or reopens) a feedback. Resolving a signed-in user's feedback
// notifies them through the notify_feedback_resolved trigger.
export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message,
    })
  }

  const { resolved, note } = result.data

  const { data, error } = await client
    .from('feedbacks')
    .update({ resolved, resolution_note: resolved ? note || null : null })
    .eq('id', event.context.params?.id)
    .select('id, resolved')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
