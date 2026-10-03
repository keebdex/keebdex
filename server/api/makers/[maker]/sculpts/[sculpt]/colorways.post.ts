import { crc32 } from 'crc'
import slugify from 'slugify'

const selfMakers = ['alpha-keycaps', 'gooey-keys']

export default defineEventHandler(async (event) => {
  const { maker, sculpt } = getRouterParams(event)
  const makerSculptId = `${maker}/${sculpt}`

  const { client, user, parent, isStaff, attribute } =
    await getChildSubmissionContext(event, 'artisan', makerSculptId)
  const body = await readBody(event)
  // Staff reviewing a colorway can approve/reject it while saving.
  const moderation = getModerationOverride(
    body?.action,
    user.sub,
    isStaff,
    'status',
  )
  const colorway: Record<string, unknown> = {
    ...pickTableFields('artisan_colorways', body),
    maker_id: maker,
    sculpt_id: sculpt,
    maker_sculpt_id: makerSculptId,
  }

  // A sparse body (e.g. a quick approve) has no name to derive the id from.
  if (
    colorway.name !== undefined &&
    (!colorway.colorway_id || selfMakers.includes(String(maker)))
  ) {
    const slug = slugify(String(colorway.name), { lower: true })
    colorway.colorway_id = crc32(
      `${maker}-${sculpt}-${slug}-${colorway.order}`,
    ).toString(16)
  }

  let result

  if (colorway.id) {
    const payload: Record<string, unknown> = {
      ...omitModerationFields(colorway, 'status'),
      ...moderation,
    }

    // Editing your own rejected colorway (and its sculpt) sends it back to review.
    let resubmitted = false

    if (!isStaff) {
      const { data: current } = await client
        .from('artisan_colorways')
        .select('status, submitted_by')
        .eq('id', colorway.id as number)
        .eq('maker_id', maker)
        .eq('sculpt_id', sculpt)
        .maybeSingle()

      if (current?.submitted_by === user.sub && current.status === 'Rejected') {
        Object.assign(payload, getResubmissionPatch('status'))
        resubmitted = true
      }
    }

    const { data, error } = await client
      .from('artisan_colorways')
      .update(payload)
      .eq('id', colorway.id as number)
      .eq('maker_id', maker)
      .eq('sculpt_id', sculpt)
      .select()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    if (!data?.length) {
      throw createError({
        statusCode: 403,
        statusMessage: "You can't edit this colorway in its current state",
      })
    }

    if (resubmitted && parent.review_status === 'Rejected') {
      const { error: resubmitError } = await client
        .from('artisan_sculpts')
        .update(getResubmissionPatch())
        .eq('maker_sculpt_id', makerSculptId)

      if (resubmitError) {
        throw createError({
          statusCode: 500,
          statusMessage: resubmitError.message,
        })
      }
    }

    result = data
  } else {
    const { data, error } = await client
      .from('artisan_colorways')
      .upsert({
        ...attribute({
          ...colorway,
          source: 'keebdex',
          overridden_fields: [],
        }),
        ...moderation,
      })
      .select()

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    result = data
  }

  if (moderation) {
    await cascadeSculptReview(client, maker, sculpt, body.action, user.sub)
  }

  return result
})
