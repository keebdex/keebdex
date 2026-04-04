import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { maker, sculpt } = event.context.params || {}

  const { error } = await client
    .from('artisan_sculpts')
    .update({ deleted: true })
    .eq('maker_id', maker)
    .eq('sculpt_id', sculpt)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return { success: true }
})
