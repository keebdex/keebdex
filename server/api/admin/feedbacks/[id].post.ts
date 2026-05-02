import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminClient } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const id = Number(event.context.params?.id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing feedback id' })
  }

  const body = pickTableFields('feedbacks', await readBody(event))
  body.resolved = !!body.resolved

  const { data, error } = await client
    .from('feedbacks')
    .update(body)
    .eq('id', id)
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
