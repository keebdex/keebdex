import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const { maker: makerId, sculpt: sculptId } = event.context.params || {}

  // TODO: drop this `Record<string, unknown>` cast once the artisan sculpt
  // submission-status migration has been applied and
  // `bun run generate:table-fields` regenerated.
  const body: Record<string, unknown> = pickTableFields(
    'artisan_sculpts',
    await readBody(event),
  )

  body.maker_sculpt_id = `${body.maker_id}/${body.sculpt_id}`

  const isStaff =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, String(body.maker_id || makerId || ''))

  // Moderation fields are only ever set by the server, never trusted from
  // the client.
  if (!body.id) {
    if (isStaff) {
      body.review_status = 'Approved'
      body.submitted_by = user.sub
      body.verified_by = user.sub
      body.verified_at = new Date().toISOString()
    } else {
      body.review_status = 'Pending'
      body.submitted_by = user.sub
    }
  }

  // Editing an existing sculpt never changes its status, except that its
  // submitter resubmits a rejected one for review.
  let record = body

  if (body.id) {
    const { data: current } = await client
      .from('artisan_sculpts')
      .select('review_status, submitted_by')
      .eq('id', body.id as number)
      .maybeSingle()
    const resubmitted =
      !isStaff &&
      current?.submitted_by === user.sub &&
      current.review_status === 'Rejected'

    record = {
      ...omitModerationFields(body),
      ...(resubmitted ? getResubmissionPatch() : {}),
    }
  }

  const query = body.id
    ? client
        .from('artisan_sculpts')
        .update(record)
        .eq('id', body.id as number)
        .select()
        .single()
    : client.from('artisan_sculpts').insert(body).select().single()

  const { data, error } = await query

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  if (body.sculpt_id !== sculptId) {
    await client
      .from('artisan_colorways')
      .update({ sculpt_id: body.sculpt_id })
      .eq('maker_id', makerId)
      .eq('sculpt_id', sculptId)
  }

  return data
})
