import { createError, defineEventHandler, readBody } from 'h3'
import { canModerateAssignment, getActorProfile } from '../../../utils/admin'

const ALLOWED_ACTIONS = new Set(['approve', 'reject', 'update'])

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing colorway id' })
  }

  const body = await readBody(event)
  const action = String(body?.action || '').trim()

  if (!ALLOWED_ACTIONS.has(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
  }

  const { data: existing, error: existingError } = await client
    .from('artisan_colorways')
    .select('id, maker_id')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Colorway not found' })
  }

  if (!canModerateAssignment(profile, existing.maker_id)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const editableFields = pickTableFields(
    'artisan_colorways',
    body?.colorway || {},
  )
  const payload: Record<string, unknown> = { ...editableFields }

  if (action === 'approve' || action === 'update') {
    payload.status = 'Approved'
    payload.verified_by = user.sub
    payload.verified_at = new Date().toISOString()
  } else if (action === 'reject') {
    payload.status = 'Rejected'
    payload.verified_by = user.sub
    payload.verified_at = new Date().toISOString()
  }

  const { data, error } = await client
    .from('artisan_colorways')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return data
})
