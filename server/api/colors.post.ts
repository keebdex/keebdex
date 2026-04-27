import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('colors', await readBody(event))

  const { data, error } = await client
    .from('colors')
    .upsert(body, {
      onConflict: 'system,code',
      ignoreDuplicates: true,
    })
    .select()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
