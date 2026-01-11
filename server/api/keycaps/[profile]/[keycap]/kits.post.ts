import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { category, ...kit } = await readBody(event)

  const query = kit.id
    ? client.from('keycap_kits').update(kit).eq('id', kit.id)
    : client.from('keycap_kits').insert(kit)

  const { data } = await query

  return data
})
