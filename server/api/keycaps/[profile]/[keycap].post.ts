import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { artisans, kits, colors, start, end, profile, ...rest } =
    await readBody(event)

  const { data, error } = rest.id
    ? await client.from('keycaps').update(rest).eq('id', rest.id)
    : await client
        .from('keycaps')
        .insert(rest)
        .eq('profile_keycap_id', rest.profile_keycap_id)

  if (error) {
    return error
  }

  return data
})
