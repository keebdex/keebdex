import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { params } = event.context

  const { data } = await client
    .from('keycap_colors')
    .delete()
    .eq('id', params?.id)
    .eq('profile_keycap_id', `${params?.profile}/${params?.keycap}`)

  return data
})
