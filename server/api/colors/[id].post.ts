import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await client
    .from('color_codes')
    .upsert(body)
    .eq('id', body.id)

  if (error) {
    return error
  }

  return data
})
