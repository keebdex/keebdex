import { omitSensitive, toNullableNumber } from '../../../../utils'

export default defineEventHandler(async (event) => {
  const { brand, keyboard } = getRouterParams(event)
  const brandKeyboardSlug = `${brand}/${keyboard}`

  const { client, user, isStaff, attribute } = await getChildSubmissionContext(
    event,
    'keyboard',
    brandKeyboardSlug,
  )
  const rawBody = await readBody(event)
  const body = pickTableFields('keyboard_releases', rawBody)
  // Staff reviewing a proposal can approve/reject it while saving.
  const moderation = getModerationOverride(rawBody?.action, user.sub, isStaff)

  const payload = {
    ...omitModerationFields(body),
    brand_slug: brand,
    brand_keyboard_slug: brandKeyboardSlug,
    release_year: toNullableNumber(body.release_year),
    msrp_price: toNullableNumber(body.msrp_price),
    currency: body.currency || null,
    case_materials:
      Array.isArray(body.case_materials) && body.case_materials.length
        ? body.case_materials
        : null,
    plate_materials:
      Array.isArray(body.plate_materials) && body.plate_materials.length
        ? body.plate_materials
        : null,
    weight_materials:
      Array.isArray(body.weight_materials) && body.weight_materials.length
        ? body.weight_materials
        : null,
  }

  let result

  if (body.id) {
    result = await client
      .from('keyboard_releases')
      .update({ ...payload, ...moderation })
      .eq('id', body.id as number)
      .eq('brand_keyboard_slug', brandKeyboardSlug)
      .select()
      .single()
  } else {
    result = await client
      .from('keyboard_releases')
      .insert({ ...attribute(payload), ...moderation })
      .select()
      .single()
  }

  if (result.error) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error.message,
    })
  }

  return omitSensitive(result.data)
})
