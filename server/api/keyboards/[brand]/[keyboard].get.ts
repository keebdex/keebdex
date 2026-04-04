import { serverSupabaseClient } from '#supabase/server'
import groupBy from 'lodash.groupby'

export default defineEventHandler(async (event) => {
  const brandSlug = event.context.params?.brand
  const keyboardSlug = event.context.params?.keyboard
  const client = await serverSupabaseClient(event)

  const { data: keyboard, error: keyboardError } = await client
    .from('keyboards')
    .select('*')
    .eq('brand_slug', brandSlug)
    .eq('slug', keyboardSlug)
    .single()

  if (keyboardError) {
    throw createError({
      statusCode: 404,
      statusMessage: keyboardError.message,
    })
  }

  const { data: brand, error: brandError } = await client
    .from('keyboard_brands')
    .select('*')
    .eq('slug', brandSlug)
    .single()

  if (brandError) {
    throw createError({
      statusCode: 404,
      statusMessage: brandError.message,
    })
  }

  const { data: releases, error: releasesError } = await client
    .from('keyboard_releases')
    .select('*')
    .eq('keyboard_slug', keyboardSlug)
    .order('release_year', { ascending: false })
    .order('id', { ascending: false })

  if (releasesError) {
    throw createError({
      statusCode: 500,
      statusMessage: releasesError.message,
    })
  }

  const releaseIds = (releases || []).map((release: any) => release.id)

  let variants: any[] = []

  if (releaseIds.length) {
    const { data: variantsData, error: variantsError } = await client
      .from('keyboard_variants')
      .select('*')
      .in('release_id', releaseIds)
      .order('id', { ascending: false })

    if (variantsError) {
      throw createError({
        statusCode: 500,
        statusMessage: variantsError.message,
      })
    }

    variants = variantsData || []
  }

  const variantsByRelease = groupBy(variants, 'release_id')
  const coverImage = variants.find((variant: any) => variant.image_url)?.image_url

  return {
    brand,
    keyboard: {
      ...keyboard,
      cover_image: coverImage || null,
    },
    releases: (releases || []).map((release: any) => ({
      ...release,
      variants: variantsByRelease[release.id] || [],
    })),
  }
})
