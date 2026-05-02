import { createError, defineEventHandler } from 'h3'
import { requireAdminClient } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const client = await requireAdminClient(event)

  const id = Number(event.context.params?.id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing feedback id' })
  }

  const { data: feedback, error: feedbackError } = await client
    .from('feedbacks')
    .select('id, name, message, resolved')
    .eq('id', id)
    .single()

  if (feedbackError) {
    throw createError({
      statusCode: 500,
      statusMessage: feedbackError.message,
    })
  }

  if (!feedback?.message?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Feedback message is required',
    })
  }

  if (feedback.resolved) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Feedback has already been resolved',
    })
  }

  const payload = {
    name: feedback.name?.trim() || 'Anonymous',
    content: feedback.message.trim(),
    role: null,
    avatar_url: null,
    status: 'Approved',
    featured: false,
  }

  const { data: testimonial, error: testimonialError } = await client
    .from('testimonials')
    .insert(payload)
    .select('id, featured, status, name, content')
    .single()

  if (testimonialError) {
    throw createError({
      statusCode: 500,
      statusMessage: testimonialError.message,
    })
  }

  const { error: resolveError } = await client
    .from('feedbacks')
    .update({ resolved: true })
    .eq('id', id)

  if (resolveError) {
    throw createError({
      statusCode: 500,
      statusMessage: resolveError.message,
    })
  }

  return testimonial
})
