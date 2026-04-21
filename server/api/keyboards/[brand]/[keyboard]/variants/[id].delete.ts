import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { id } = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Variant ID is required',
    })
  }

  const { error } = await client.from('keyboard_variants').delete().eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return { success: true }
})
