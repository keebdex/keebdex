import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const { maker: makerId } = getRouterParams(event)

  // TODO: drop this `Record<string, unknown>` cast once the artisan sculpt
  // submission-status migration has been applied and
  // `bun run generate:table-fields` regenerated.
  // The database builds maker_sculpt_id (update_maker_sculpt_id) and sets
  // source_slug on the first rename of a synced sculpt (keep_source_slug).
  const body: Record<string, unknown> = pickTableFields(
    'artisan_sculpts',
    await readBody(event),
    [...MODERATION_FIELDS, 'maker_sculpt_id', 'source_slug'],
  )

  const isStaff =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, String(body.maker_id || makerId || ''))

  // Moderation fields are only ever set by the server, never trusted from
  // the client.
  const record = {
    ...body,
    ...(await getPageSaveModeration({
      client,
      table: 'artisan_sculpts',
      id: body.id,
      userId: user.sub,
      isStaff,
    })),
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

  // Colorways follow a renamed sculpt through the maker_sculpt_id cascade.
  return data
})
