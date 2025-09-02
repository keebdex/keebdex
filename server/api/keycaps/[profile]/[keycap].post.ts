import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { artisans, kits, start, end, profile, ...rest } = await readBody(event)

  const { data, error } = await client
    .from('keycaps')
    .upsert(rest)
    .eq('profile_keycap_id', rest.profile_keycap_id)

  if (error) {
    return error
  }

  return data
})
