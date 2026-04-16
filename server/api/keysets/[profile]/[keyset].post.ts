import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('keysets', await readBody(event))

  const { data, error } = body.id
    ? await client.from('keysets').update(body).eq('id', body.id)
    : await client.from('keysets').insert(body)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
