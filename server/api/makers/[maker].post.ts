import { serverSupabaseClient } from '#supabase/server'
import { pickTableFields } from '../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('artisan_makers', await readBody(event))

  const { data, error } = await client
    .from('artisan_makers')
    .upsert(body)
    .eq('id', event.context.params?.maker)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
