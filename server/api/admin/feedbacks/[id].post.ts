import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminClient } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const { id, ...body } = pickTableFields('feedbacks', await readBody(event))

  const { data, error } = await client
    .from('feedbacks')
    .update(body)
    .eq('id', event.context.params?.id)
    .select('id, resolved')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
