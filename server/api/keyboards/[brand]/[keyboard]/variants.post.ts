import { normalizeFields, omitSensitive } from '../../../../utils'

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
  const moderation = getModerationOverride(
    rawBody?.action,
    user.sub,
    isStaff,
    rawBody?.note,
  )

  // A sparse edit (e.g. a quick approve) keeps the variant's current release.
  if (!body.id || body.release_id !== undefined) {
    const { error: releaseError } = await client
      .from('keyboard_releases')
      .select('id')
      .eq('id', body.release_id as number)
      .eq('brand_keyboard_slug', brandKeyboardSlug)
      .single()

    if (releaseError) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Release not found for this keyboard',
      })
    }
  }

  const payload = {
    ...normalizeFields(omitSensitive(omitModerationFields(body)), {
      numbers: ['units_produced', 'release_year', 'msrp_price'],
      optional: [
        'sale_type',
        'img_front',
        'img_back',
        'photo_credit',
        'currency',
      ],
      arrays: [
        'case_materials',
        'pcb_types',
        'plate_materials',
        'weight_materials',
      ],
    }),
    brand_slug: brand,
    brand_keyboard_slug: brandKeyboardSlug,
  }

  let variant: Record<string, any>

  if (body.id) {
    const updated = await updateChildSubmission({
      client,
      table: 'keyboard_variants',
      match: { id: body.id as number, brand_keyboard_slug: brandKeyboardSlug },
      payload: { ...payload, ...moderation },
      userId: user.sub,
      isStaff,
      label: 'variant',
    })

    variant = updated.data
  } else {
    const { data, error } = await client
      .from('keyboard_variants')
      .insert({ ...attribute(payload, { own: true }), ...moderation } as any)
      .select()
      .single()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    variant = data
  }

  if (moderation) {
    await cascadeKeyboardReview(
      client,
      brandKeyboardSlug,
      Number(variant.release_id),
      rawBody.action,
      user.sub,
    )
  }

  return omitSensitive(variant)
})
