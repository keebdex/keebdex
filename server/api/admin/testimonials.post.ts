import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminClient } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const body = pickTableFields('testimonials', await readBody(event))

  body.status = body.status || 'Pending'
  body.featured = !!body.featured

  const { data, error } = await client
    .from('testimonials')
    .insert(body)
    .select('*')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
