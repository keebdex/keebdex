import { defineSitemapEventHandler } from '#sitemap/server'
import { serverSupabaseClient } from '#supabase/server'
import { PUBLISHED_FILTER } from '../../utils'
import type { PublicTable } from '../../utils/database'

// Supabase returns at most 1000 rows per request
const PAGE_SIZE = 1000

// The sitemap's dynamic pages (see AGENTS.md): every published maker, sculpt,
// profile, keyset, brand, and keyboard, children only under a published parent
export default defineSitemapEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // One column of a published row, in pages of PAGE_SIZE; `parent` names a
  // `alias:table!inner(...)` embed in `column` that must be published too
  const fetchKeys = async (
    table: PublicTable,
    column: string,
    parent?: string,
  ) => {
    const key = column.split(',')[0]!
    const rows: Record<string, string | null>[] = []

    for (let from = 0; ; from += PAGE_SIZE) {
      let query = client.from(table).select(column).or(PUBLISHED_FILTER)

      if (parent) {
        query = query.or(PUBLISHED_FILTER, { referencedTable: parent })
      }

      const { data, error } = await query
        .order(key)
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
      }

      rows.push(...(data as unknown as typeof rows))
      if (data.length < PAGE_SIZE) return rows
    }
  }

  const [makers, sculpts, profiles, keysets, brands, keyboards] =
    await Promise.all([
      fetchKeys('artisan_makers', 'maker_id, updated_at'),
      fetchKeys(
        'artisan_sculpts',
        'maker_sculpt_id, maker:artisan_makers!inner(maker_id)',
        'maker',
      ),
      fetchKeys('keyset_profiles', 'profile_id'),
      fetchKeys(
        'keysets',
        'profile_keyset_id, profile:keyset_profiles!inner(profile_id)',
        'profile',
      ),
      fetchKeys('keyboard_brands', 'slug'),
      fetchKeys(
        'keyboards',
        'brand_keyboard_slug, brand:keyboard_brands!inner(slug)',
        'brand',
      ),
    ])

  return [
    ...makers.map((m) => ({
      loc: `/artisan/maker/${m.maker_id}`,
      lastmod: m.updated_at ?? undefined,
    })),
    ...sculpts.map((s) => ({ loc: `/artisan/maker/${s.maker_sculpt_id}` })),
    ...profiles.map((p) => ({ loc: `/keyset/${p.profile_id}` })),
    ...keysets.map((k) => ({ loc: `/keyset/${k.profile_keyset_id}` })),
    ...brands.map((b) => ({ loc: `/keyboard/brand/${b.slug}` })),
    ...keyboards.map((k) => ({
      loc: `/keyboard/brand/${k.brand_keyboard_slug}`,
    })),
  ]
})
