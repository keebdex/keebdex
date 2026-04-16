import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const kit = pickTableFields('keyset_kits', await readBody(event))

  const query = kit.id
    ? client.from('keyset_kits').update(kit).eq('id', kit.id)
    : client.from('keyset_kits').insert(kit)

  const { data, error } = await query

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
