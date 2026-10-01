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
    .select('id, maker_id, sculpt_id')
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

  // The sculpt attached to this colorway may itself be a Pending proposal
  // created alongside it (see server/api/makers/[maker]/sculpts/[sculpt].post.ts).
  // Approving/rejecting the colorway resolves that sculpt the same way, since
  // there's no separate moderation queue for sculpts.
  if (action === 'approve' || action === 'reject') {
    await client
      .from('artisan_sculpts')
      .update({
        review_status: action === 'approve' ? 'Approved' : 'Rejected',
        verified_by: user.sub,
        verified_at: new Date().toISOString(),
      })
      .eq('maker_id', existing.maker_id)
      .eq('sculpt_id', existing.sculpt_id)
      .eq('review_status', 'Pending')
  }

  return data
})
