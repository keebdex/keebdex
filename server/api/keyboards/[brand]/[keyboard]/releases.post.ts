import { normalizeFields, omitSensitive } from '../../../../utils'

export default defineEventHandler(async (event) => {
  const { brand, keyboard } = getRouterParams(event)
  const brandKeyboardSlug = `${brand}/${keyboard}`

  const { client, user, isStaff, attribute } = await getChildSubmissionContext(
    event,
    'keyboard',
    brandKeyboardSlug,
  )
  const body = pickTableFields('keyboard_releases', await readBody(event))

  const payload = {
    ...normalizeFields(omitSensitive(omitModerationFields(body)), {
      numbers: ['release_year', 'msrp_price'],
      optional: ['currency'],
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

  if (body.id) {
    const { data } = await updateChildSubmission({
      client,
      table: 'keyboard_releases',
      match: { id: body.id as number, brand_keyboard_slug: brandKeyboardSlug },
      payload,
      userId: user.sub,
      isStaff,
      label: 'release',
    })

    return omitSensitive(data)
  }

  const { data, error } = await client
    .from('keyboard_releases')
    .insert(attribute(payload) as any)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return omitSensitive(data)
})
