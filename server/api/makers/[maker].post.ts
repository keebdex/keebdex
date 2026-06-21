import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('artisan_makers', await readBody(event))

  const query = body.id
    ? client
        .from('artisan_makers')
        .update(body)
        .eq('id', body.id)
        .select()
        .single()
    : client.from('artisan_makers').insert(body).select().single()

  const { data, error } = await query

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
