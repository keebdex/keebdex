import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('keysets', await readBody(event))

  const { data, error } = body.id
    ? await client
        .from('keysets')
        .update(body)
        .eq('id', body.id as number)
        .select('id')
    : await client.from('keysets').insert(body)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // RLS filters rows silently, so an empty update result means it was refused.
  if (body.id && !data?.length) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can't edit this keyset in its current state",
    })
  }

  return data
})
