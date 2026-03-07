import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { params } = event.context

  const { data, error } = await client
    .from('keycap_colors')
    .delete()
    .eq('id', params?.id)
    .eq('profile_keycap_id', `${params?.profile}/${params?.keycap}`)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
