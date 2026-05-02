import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminClient } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const id = Number(event.context.params?.id)
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing testimonial id',
    })
  }

  const body = pickTableFields('testimonials', await readBody(event))
  body.featured = !!body.featured

  const { data, error } = await client
    .from('testimonials')
    .update(body)
    .eq('id', id)
    .select('id, featured')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
