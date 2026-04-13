import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { artisans, kits, colors, start, end, profile, ...rest } =
    await readBody(event)

  const { data, error } = rest.id
    ? await client.from('keysets').update(rest).eq('id', rest.id)
    : await client.from('keysets').insert(rest)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
