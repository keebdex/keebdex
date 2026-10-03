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
  const body = pickTableFields('keyboard_variants', rawBody)
  // Staff reviewing a proposal can approve/reject it while saving.
  const moderation = getModerationOverride(rawBody?.action, user.sub, isStaff)

  const { error: releaseError } = await client
    .from('keyboard_releases')
    .select('id')
    .eq('id', body.release_id)
    .eq('brand_keyboard_slug', brandKeyboardSlug)
    .single()

  if (releaseError) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Release not found for this keyboard',
    })
  }

  const payload = {
    release_id: body.release_id,
    variant_name: body.variant_name,
    finish_type: body.finish_type,
    units_produced: toNullableNumber(body.units_produced),
    release_year: toNullableNumber(body.release_year),
    sale_type: body.sale_type || null,
    img_front: body.img_front || null,
    img_back: body.img_back || null,
    photo_credit: body.photo_credit || null,
    currency: body.currency || null,
    msrp_price: toNullableNumber(body.msrp_price),
    case_materials: Array.isArray(body.case_materials)
      ? body.case_materials
      : null,
    pcb_types: Array.isArray(body.pcb_types) ? body.pcb_types : null,
    plate_materials: Array.isArray(body.plate_materials)
      ? body.plate_materials
      : null,
    weight_materials: Array.isArray(body.weight_materials)
      ? body.weight_materials
      : null,
    brand_slug: brand,
    brand_keyboard_slug: brandKeyboardSlug,
  }

  let result

  if (body.id) {
    // Editing your own rejected variant sends it back to review.
    const resubmission: Record<string, unknown> = {}

    if (!isStaff) {
      const { data: current } = await client
        .from('keyboard_variants')
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
      .from('keyboard_variants')
      .update({ ...payload, ...moderation, ...resubmission })
      .eq('id', body.id as number)
      .eq('brand_keyboard_slug', brandKeyboardSlug)
      .select()
      .maybeSingle()

    // RLS filters rows silently, so no row back means the edit was refused.
    if (!result.error && !result.data) {
      throw createError({
        statusCode: 403,
        statusMessage: "You can't edit this variant in its current state",
      })
    }
  } else {
    result = await client
      .from('keyboard_variants')
      .insert({ ...attribute(payload, { own: true }), ...moderation })
      .select()
      .single()
  }

  if (result.error) {
    throw createError({
      statusCode: 500,
      statusMessage: result.error.message,
    })
  }

  if (moderation) {
    await cascadeKeyboardReview(
      client,
      brandKeyboardSlug,
      Number(result.data.release_id),
      rawBody.action,
      user.sub,
    )
  }

  return omitSensitive(result.data)
})
