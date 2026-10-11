import { z } from 'zod'

const bodySchema = z.object({
  keys: z.array(z.string().max(64)).min(1).max(100),
})

// Adds announcements dismissed on this device as a guest (localStorage, and
// the acknowledged values of the old hard-coded toasts) to the signed-in
// user's dismissals. Unknown keys are skipped.
export default defineEventHandler(async (event) => {
  const { client } = await getNotificationsContext(event)

  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message,
    })
  }

  const { data, error } = await client.rpc('merge_dismissals', {
    p_keys: [...new Set(result.data.keys)],
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { merged: data ?? 0 }
})
