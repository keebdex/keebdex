import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminClient } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const id = Number(event.context.params?.id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing feedback id' })
  }

  const body = await readBody(event)

  if (typeof body?.resolved !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid resolved value',
    })
  }

  const { data, error } = await client
    .from('feedbacks')
    .update({ resolved: body.resolved })
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
