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

  // catalog-sync matches sculpts by their slug in the Google Doc or on the
  // maker's website. Renaming a synced sculpt keeps that slug in
  // source_sculpt_id (the first time only), so the next sync still finds it
  // instead of recreating the sculpt under its old name.
  delete body.source_sculpt_id

  if (body.id && body.sculpt_id !== sculptId) {
    const { data: stored } = await client
      .from('artisan_sculpts')
      .select('*')
      .eq('id', body.id as number)
      .maybeSingle()
    const synced = stored as Record<string, any> | null

    if (
      synced &&
      ['gdoc', 'scraper'].includes(synced.source) &&
      !synced.source_sculpt_id
    ) {
      body.source_sculpt_id = synced.sculpt_id
    }
  }

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
