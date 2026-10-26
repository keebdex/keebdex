import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const makerId = event.context.params?.maker
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('artisan_makers', await readBody(event), [
    'id',
    'maker_id',
  ])

  const { data: existing } = await client
    .from('artisan_makers')
    .select('maker_id')
    .eq('maker_id', makerId)
    .maybeSingle()

  const query = existing
    ? client
        .from('artisan_makers')
        .update(body)
        .eq('maker_id', makerId)
        .select()
        .single()
    : client
        .from('artisan_makers')
        .insert({ ...body, maker_id: makerId })
        .select()
        .single()

  const { data, error } = await query

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
