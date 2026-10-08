import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const { maker: makerId, sculpt: sculptId } = getRouterParams(event)

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
  // the client. Editing an existing sculpt never changes its status, except
  // that its submitter resubmits a rejected one for review.
  const record = {
    ...omitModerationFields(body),
    ...(body.id
      ? await getOwnResubmission(
          client,
          'artisan_sculpts',
          { id: body.id as number },
          user.sub,
          isStaff,
        )
      : getSubmissionAttribution(isStaff, user.sub)),
  }

  const { data, error } = body.id
    ? await client
        .from('artisan_sculpts')
        .update(record)
        .eq('id', body.id as number)
        .select()
        .maybeSingle()
    : await client
        .from('artisan_sculpts')
        .insert(record as any)
        .select()
        .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // RLS filters rows silently, so no row back means the edit was refused.
  if (!data) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can't edit this sculpt in its current state",
    })
  }

  if (body.sculpt_id !== sculptId) {
    await client
      .from('artisan_colorways')
      .update({ sculpt_id: body.sculpt_id as string })
      .eq('maker_id', makerId!)
      .eq('sculpt_id', sculptId!)
  }

  return data
})
