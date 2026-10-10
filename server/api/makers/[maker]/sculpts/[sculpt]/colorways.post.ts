import { crc32 } from 'crc'
import slugify from 'slugify'

const selfMakers = ['alpha-keycaps', 'gooey-keys']

export default defineEventHandler(async (event) => {
  const { maker, sculpt } = getRouterParams(event)
  const makerSculptId = `${maker}/${sculpt}`

  const { client, user, isStaff, attribute } =
    await getChildSubmissionContext(event, 'artisan', makerSculptId)
  const body = await readBody(event)
  // Staff reviewing a colorway can approve/reject it while saving.
  const moderation = getModerationOverride(
    body?.action,
    user.sub,
    isStaff,
    body?.note,
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
    const { data, resubmitted } = await updateChildSubmission({
      client,
      table: 'artisan_colorways',
      match: {
        id: colorway.id as number,
        maker_id: maker!,
        sculpt_id: sculpt!,
      },
      payload: { ...omitModerationFields(colorway), ...moderation },
      userId: user.sub,
      isStaff,
      label: 'colorway',
    })

    // Editing your own rejected colorway sends its rejected sculpt back too.
    if (resubmitted) {
      await resubmitRejectedParent(client, 'artisan_sculpts', {
        maker_sculpt_id: makerSculptId,
      })
    }

    result = [data]
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
