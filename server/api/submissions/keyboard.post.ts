import { createError, defineEventHandler, readBody } from 'h3'
import slugify from 'slugify'
import { getActorProfile } from '../../utils/admin'
import { toNullableNumber } from '../../utils'
import {
  canManageAssignment,
  canManageAnyAssignment,
} from '~/utils/permissions'

export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)

  const body = await readBody(event)
  const keyboardInput = pickTableFields('keyboards', body?.keyboard || {})

  if (!keyboardInput.name || !keyboardInput.brand_slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing keyboard name or brand',
    })
  }

  const slug = slugify(String(keyboardInput.name), { lower: true })
  const brand_keyboard_slug = `${keyboardInput.brand_slug}/${slug}`

  // Staff submitting through the community form don't need to self-approve.
  const isModerator =
    canManageAnyAssignment(profile) &&
    canManageAssignment(profile, `${keyboardInput.brand_slug}`)

  const keyboardPayload = {
    ...keyboardInput,
    slug,
    brand_keyboard_slug,
    typing_angle: toNullableNumber(keyboardInput.typing_angle),
    ...getSubmissionAttribution(isModerator, user.sub),
  }

  const { data: keyboard, error: keyboardError } = await client
    .from('keyboards')
    .insert(keyboardPayload)
    .select()
    .single()

  if (keyboardError) {
    throw createError({
      statusCode: 500,
      statusMessage: keyboardError.message,
    })
  }

  return keyboard
})
