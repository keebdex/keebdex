import { omit } from 'es-toolkit'
import { omitSensitive, toNullableNumber } from '../../../utils'
import {
  canManageAnyAssignment,
  canManageAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)
  const body = pickTableFields('keyboards', await readBody(event))
  const { brand } = getRouterParams(event)

  const isStaff =
    canManageAnyAssignment(profile) && canManageAssignment(profile, brand)

  // Only staff may set moderation fields; a submitter editing their own
  // rejected keyboard sends it back to review.
  const moderation = isStaff
    ? {}
    : body.id
      ? await getOwnResubmission(
          client,
          'keyboards',
          { id: body.id as number },
          user.sub,
          false,
        )
      : getSubmissionAttribution(false, user.sub)

  // The database builds brand_keyboard_slug from brand_slug and slug.
  const payload = {
    ...omit(isStaff ? body : omitModerationFields(body), [
      'brand_keyboard_slug',
    ]),
    ...moderation,
    typing_angle: toNullableNumber(body.typing_angle),
  }

  // Publishing the keyboard here mustn't publish its status-less releases and
  // variants unreviewed.
  if (isStaff && body.id && 'review_status' in body) {
    await keepChildrenInReviewOnPublish(
      client,
      { table: 'keyboards', match: { id: body.id as number } },
      body.review_status,
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
