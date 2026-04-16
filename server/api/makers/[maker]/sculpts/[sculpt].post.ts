import { serverSupabaseClient } from '#supabase/server'
import omit from 'lodash.omit'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  let body = await readBody(event)
  body = omit(body, [
    'created_at',
    'maker_name',
    'invertible_logo',
    'total_colorways',
    'maker_sculpts',
  ])

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
