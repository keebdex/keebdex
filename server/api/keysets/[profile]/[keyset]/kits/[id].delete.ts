import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { params } = event.context

  const { data, error } = await client
    .from('keyset_kits')
    .delete()
    .eq('id', params?.id)
    .eq('profile_keyset_id', `${params?.profile}/${params?.keyset}`)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
