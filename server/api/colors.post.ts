import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('colors', await readBody(event))

  const query = body.id
    ? client.from('colors').update(body).eq('id', body.id)
    : client.from('colors').upsert(body, {
        onConflict: 'system,code',
        ignoreDuplicates: true,
      })

  const { data, error } = await query.select()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
