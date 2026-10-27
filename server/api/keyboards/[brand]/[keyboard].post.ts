import { omitSensitive, toNullableNumber } from '../../../utils'
import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  // The database builds brand_keyboard_slug from brand_slug and slug.
  const rawBody = await readBody(event)
  const body = pickTableFields('keyboards', rawBody, [
    'brand_keyboard_slug',
    ...MODERATION_FIELDS,
  ])
  const { brand } = getRouterParams(event)

  const isStaff =
    canManageAnyAssignment(profile) && canManageAssignment(profile, brand)

  const moderation = await getPageSaveModeration({
    client,
    table: 'keyboards',
    id: body.id,
    status: rawBody?.review_status,
    userId: user.sub,
    isStaff,
  })

  const payload = {
    ...body,
    ...moderation,
    typing_angle: toNullableNumber(body.typing_angle),
  }

  // Publishing the keyboard here mustn't publish its status-less releases and
  // variants unreviewed.
  if (body.id && moderation.review_status === 'Approved') {
    await keepChildrenInReviewOnPublish(
      client,
      { table: 'keyboards', match: { id: body.id as number } },
      'Approved',
      (keyboard) => {
        const match = { brand_keyboard_slug: keyboard.brand_keyboard_slug }

        return [
          { table: 'keyboard_releases', match },
          { table: 'keyboard_variants', match },
        ]
      },
    )
  }

  const { data, error } = body.id
    ? await client
        .from('keyboards')
        .update(payload)
        .eq('id', body.id as number)
        .select()
        .maybeSingle()
    : await client
        .from('keyboards')
        .insert(payload as any)
        .select()
        .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  // RLS filters rows silently, so no row back means the edit was refused.
  if (body.id && !data) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can't edit this keyboard in its current state",
    })
  }

  return omitSensitive(data)
})
