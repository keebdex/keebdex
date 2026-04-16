import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const body = pickTableFields('artisan_sculpts', await readBody(event))

  const { data, error } = await client
    .from('artisan_sculpts')
    .upsert(body)
    .eq('maker_id', body.maker_id)
    .eq('sculpt_id', body.sculpt_id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
