import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data } = await client
    .from('colors')
    .delete()
    .eq('id', event.context.params?.id)

  return data
})
