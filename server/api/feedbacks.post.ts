import { serverSupabaseClient } from '#supabase/server'
import { pickTableFields } from '../utils'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = pickTableFields('feedbacks', await readBody(event))

  const { data, error } = await client.from('feedbacks').insert(body)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
