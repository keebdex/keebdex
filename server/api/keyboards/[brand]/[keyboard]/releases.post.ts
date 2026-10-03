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
    // Editing your own rejected release sends it back to review.
    const resubmission: Record<string, unknown> = {}

    if (!isStaff) {
      const { data: current } = await client
        .from('keyboard_releases')
        .select('review_status, submitted_by')
        .eq('id', body.id as number)
        .eq('brand_keyboard_slug', brandKeyboardSlug)
        .maybeSingle()

      if (
        current?.submitted_by === user.sub &&
        current.review_status === 'Rejected'
      ) {
        Object.assign(resubmission, {
          review_status: 'Pending',
          verified_at: null,
          verified_by: null,
        })
      }
    }

    result = await client
      .from('keyboard_releases')
      .update({ ...payload, ...resubmission })
      .eq('id', body.id as number)
      .eq('brand_keyboard_slug', brandKeyboardSlug)
      .select()
      .maybeSingle()

    // RLS filters rows silently, so no row back means the edit was refused.
    if (!result.error && !result.data) {
      throw createError({
        statusCode: 403,
        statusMessage: "You can't edit this release in its current state",
      })
    }
  } else {
    result = await client
      .from('keyboard_releases')
      .insert(attribute(payload))
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
