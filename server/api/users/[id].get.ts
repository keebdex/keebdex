import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('users')
    .select()
    .eq('id', event.context.params?.id)
    .maybeSingle()

  if (error) throw dbError(error, 'user profile')

  return { data }
})
