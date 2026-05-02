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

  const body = await readBody(event)

  if (typeof body?.featured !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing or invalid featured value',
    })
  }

  const { data, error } = await client
    .from('testimonials')
    .update({ featured: body.featured })
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
