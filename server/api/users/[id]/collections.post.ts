import { serverSupabaseClient } from '#supabase/server'
import { pickTableFields } from '../../../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const body = pickTableFields('user_collections', await readBody(event))

  const { data, error } = await client.from('user_collections').insert(body)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
