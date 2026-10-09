import type { SupabaseClient } from '@supabase/supabase-js'

export const COLORWAY_SEARCH_SELECT =
  '*, maker:artisan_makers(id, name, invertible_logo), sculpt:artisan_sculpts(name)'

// rows fetched per palette query before ranking
const PALETTE_FETCH_LIMIT = 200

const getSearchWords = (term: string) =>
  term.toLowerCase().trim().split(/\s+/).filter(Boolean)

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Colorways that are not deleted and whose own name contains every word of
 * the term. With `exact`, the name must contain the whole term as separate
 * words ("blue" matches "Baby Blue" but not "Blueberry").
 * Maker/sculpt-only matches are left out because the search palette already
 * lists makers and sculpts in their own groups.
 */
export const matchColorwaysByName = (
  client: SupabaseClient,
  term: string,
  options: { count?: 'exact'; head?: boolean; exact?: boolean } = {},
) => {
  const { exact, ...selectOptions } = options
  const words = getSearchWords(term)

  const query = client
    .from('artisan_colorways')
    .select(COLORWAY_SEARCH_SELECT, selectOptions)
    .not('deleted', 'is', true)

  if (exact) {
    // Postgres word boundaries: \m start of word, \M end of word
    return query.filter(
      'name',
      'imatch',
      `\\m${words.map(escapeRegex).join('\\s+')}\\M`,
    )
  }

  return words.reduce((q, word) => q.ilike('name', `%${word}%`), query)
}

/**
 * Orders colorways by how closely their name matches the term: exact, prefix,
 * then the phrase, before names that only contain all the words.
 */
const rankColorways = (colorways: any[], term: string) => {
  const q = term.toLowerCase().trim()

  const score = (c: any) => {
    const name = String(c.name || '').toLowerCase()

    if (name === q) return 0
    if (name.startsWith(q)) return 1
    if (name.includes(q)) return 2
    return 3
  }

  return colorways
    .map((c) => ({ c, s: score(c) }))
    .sort(
      (a, b) =>
        a.s - b.s ||
        String(a.c.maker_sculpt_id).localeCompare(String(b.c.maker_sculpt_id)) ||
        String(a.c.name).localeCompare(String(b.c.name)),
    )
    .map(({ c }) => c)
}

/**
 * The most relevant colorways for the search palette plus the total number of
 * name matches, so the palette can link to the full results page.
 * Prefix matches are fetched separately so the best results are ranked even
 * when the broad match has more rows than one request returns.
 */
export const searchPaletteColorways = async (
  client: SupabaseClient,
  term: string,
  limit: number,
) => {
  const [prefix, broad] = await Promise.all([
    client
      .from('artisan_colorways')
      .select(COLORWAY_SEARCH_SELECT)
      .not('deleted', 'is', true)
      .ilike('name', `${term.trim()}%`)
      .order('name')
      .limit(limit),
    matchColorwaysByName(client, term, { count: 'exact' })
      .order('maker_id')
      .order('sculpt_id')
      .order('name')
      .limit(PALETTE_FETCH_LIMIT),
  ])

  for (const result of [prefix, broad]) {
    if (result.error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Artisan Colorways: ${result.error.message}`,
      })
    }
  }

  const merged = new Map<number, any>()

  for (const colorway of [...(prefix.data || []), ...(broad.data || [])]) {
    if (!merged.has(colorway.id)) merged.set(colorway.id, colorway)
  }

  return {
    items: rankColorways([...merged.values()], term).slice(0, limit),
    total: broad.count ?? merged.size,
  }
}
