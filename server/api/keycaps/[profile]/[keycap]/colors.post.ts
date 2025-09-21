import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { profile_keycap_id, color_ids } = await readBody(event)

  const rows = color_ids.map((color_id: number) => ({
    profile_keycap_id,
    color_id,
  }))

  const query = client.from('keycap_colors').insert(rows)

  const { data } = await query

  return data
})
