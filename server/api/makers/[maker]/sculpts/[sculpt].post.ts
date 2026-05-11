import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { maker: makerId, sculpt: sculptId } = event.context.params || {}

  const body = pickTableFields('artisan_sculpts', await readBody(event))

  body.maker_sculpt_id = `${body.maker_id}/${body.sculpt_id}`

  const query = body.id
    ? client
        .from('artisan_sculpts')
        .update(body)
        .eq('id', body.id)
        .select()
        .single()
    : client.from('artisan_sculpts').insert(body).select().single()

  const { data, error } = await query

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  if (body.sculpt_id !== sculptId) {
    await client
      .from('artisan_colorways')
      .update({ sculpt_id: body.sculpt_id })
      .eq('maker_id', makerId)
      .eq('sculpt_id', sculptId)
  }

  return data
})
