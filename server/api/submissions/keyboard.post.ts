import { createError, defineEventHandler, readBody } from 'h3'
import slugify from 'slugify'
import { getActorProfile } from '../../utils/admin'
import { toNullableNumber } from '../../utils'

export default defineEventHandler(async (event) => {
  const { client, user } = await getActorProfile(event)

  const body = await readBody(event)
  const keyboardInput = pickTableFields('keyboards', body?.keyboard || {})
  const releasesInput = Array.isArray(body?.releases) ? body.releases : []

  if (!keyboardInput.name || !keyboardInput.brand_slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing keyboard name or brand',
    })
  }

  const slug = slugify(String(keyboardInput.name), { lower: true })
  const brand_keyboard_slug = `${keyboardInput.brand_slug}/${slug}`

  const keyboardPayload = {
    ...keyboardInput,
    slug,
    brand_keyboard_slug,
    typing_angle: toNullableNumber(keyboardInput.typing_angle),
    review_status: 'Pending',
    submitted_by: user.sub,
    verified_at: null,
    verified_by: null,
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

  for (const release of releasesInput) {
    const releasePayload = {
      ...pickTableFields('keyboard_releases', release),
      release_year: toNullableNumber(release.release_year),
      msrp_price: toNullableNumber(release.msrp_price),
      brand_slug: keyboardInput.brand_slug,
      brand_keyboard_slug,
    }

    const { data: createdRelease, error: releaseError } = await client
      .from('keyboard_releases')
      .insert(releasePayload)
      .select()
      .single()

    if (releaseError) {
      throw createError({
        statusCode: 500,
        statusMessage: releaseError.message,
      })
    }

    const variantsInput = Array.isArray(release.variants)
      ? release.variants
      : []

    if (variantsInput.length) {
      const variantsPayload = variantsInput.map((variant: unknown) => ({
        ...pickTableFields('keyboard_variants', variant),
        release_id: createdRelease.id,
        brand_slug: keyboardInput.brand_slug,
        brand_keyboard_slug,
      }))

      const { error: variantsError } = await client
        .from('keyboard_variants')
        .insert(variantsPayload)

      if (variantsError) {
        throw createError({
          statusCode: 500,
          statusMessage: variantsError.message,
        })
      }
    }
  }

  return keyboard
})
