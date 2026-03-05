import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { maker, sculpt, id } = event.context.params || {}

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing colorway id' })
  }

  const { error } = await client
    .from('colorways')
    .delete()
    .eq('id', id)
    .eq('maker_id', maker)
    .eq('sculpt_id', sculpt)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete colorway',
    })
  }

  return { success: true }
})
