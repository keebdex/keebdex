import { defineSitemapEventHandler } from '#sitemap/server'
import { serverSupabaseClient } from '#supabase/server'
import { PUBLISHED_FILTER } from '../../utils'

// Supabase returns at most 1000 rows per request
const PAGE_SIZE = 1000

type SitemapTable =
  | 'artisan_makers'
  | 'artisan_sculpts'
  | 'keyset_profiles'
  | 'keysets'
  | 'keyboard_brands'
  | 'keyboards'

// The dynamic pages of the sitemap (`sources` in nuxt.config.ts; the module
// lists the static pages itself): every published maker, sculpt, profile,
// keyset, brand, and keyboard. Children also need a published parent, since
// their page 404s otherwise. The module caches the resolved sitemap, so this
// runs about once an hour per Worker isolate.
export default defineSitemapEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const fetchAll = async <T>(
    table: SitemapTable,
    columns: string,
    order: string,
  ) => {
    const rows: T[] = []

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await client
        .from(table)
        .select(columns)
        .or(PUBLISHED_FILTER)
        .order(order)
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
      }

      rows.push(...(data as T[]))
      if (data.length < PAGE_SIZE) return rows
    }
  }

  const [makers, sculpts, profiles, keysets, brands, keyboards] =
    await Promise.all([
      fetchAll<{ maker_id: string; updated_at: string | null }>(
        'artisan_makers',
        'maker_id, updated_at',
        'maker_id',
      ),
      fetchAll<{ maker_id: string; maker_sculpt_id: string }>(
        'artisan_sculpts',
        'maker_id, maker_sculpt_id',
        'maker_sculpt_id',
      ),
      fetchAll<{ profile_id: string }>(
        'keyset_profiles',
        'profile_id',
        'profile_id',
      ),
      fetchAll<{ profile_id: string; profile_keyset_id: string }>(
        'keysets',
        'profile_id, profile_keyset_id',
        'profile_keyset_id',
      ),
      fetchAll<{ slug: string }>('keyboard_brands', 'slug', 'slug'),
      fetchAll<{ brand_slug: string; brand_keyboard_slug: string }>(
        'keyboards',
        'brand_slug, brand_keyboard_slug',
        'brand_keyboard_slug',
      ),
    ])

  const makerIds = new Set(makers.map((m) => m.maker_id))
  const profileIds = new Set(profiles.map((p) => p.profile_id))
  const brandSlugs = new Set(brands.map((b) => b.slug))

  return [
    ...makers.map((m) => ({
      loc: `/artisan/maker/${m.maker_id}`,
      lastmod: m.updated_at ?? undefined,
    })),
    ...sculpts
      .filter((s) => makerIds.has(s.maker_id))
      .map((s) => ({ loc: `/artisan/maker/${s.maker_sculpt_id}` })),
    ...profiles.map((p) => ({ loc: `/keyset/${p.profile_id}` })),
    ...keysets
      .filter((k) => profileIds.has(k.profile_id))
      .map((k) => ({ loc: `/keyset/${k.profile_keyset_id}` })),
    ...brands.map((b) => ({ loc: `/keyboard/brand/${b.slug}` })),
    ...keyboards
      .filter((k) => brandSlugs.has(k.brand_slug))
      .map((k) => ({ loc: `/keyboard/brand/${k.brand_keyboard_slug}` })),
  ]
})
