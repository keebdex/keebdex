import { serverSupabaseClient } from '#supabase/server'
import { groupBy } from 'es-toolkit'

const MAX_PAGE_SIZE = 50
const INTENTS = ['want', 'sell']

/**
 * Published Wishlist / For Sale or Trade artisan collections that list at
 * least one item, newest first, one page at a time, each with its listed
 * items. `intent=want|sell` keeps only Wishlist or For Sale or Trade
 * collections. Backs the Trading Hub.
 */
export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const { page, size, intent } = getQuery(event)
  const intents = INTENTS.includes(String(intent)) ? [String(intent)] : INTENTS

  const pageSize = Math.min(Math.max(Number(size) || 20, 1), MAX_PAGE_SIZE)
  const from = (Math.max(Number(page) || 1, 1) - 1) * pageSize
  const to = from + pageSize - 1

  // The inner join keeps only collections with a listed item, so pages and
  // the total count never include empty collections
  const listedCollections = (head = false) =>
    client
      .from('user_collections')
      .select('*, listed:user_collection_items!inner(id)', {
        count: 'exact',
        head,
      })
      .eq('published', true)
      .eq('category', 'artisan')
      .in('intent', intents)
      .eq('listed.exchange', true)

  const {
    data: collections,
    count,
    error: collectionsError,
  } = await listedCollections()
    .order('created_at', { ascending: false })
    .range(from, to)

  // PostgREST rejects a range past the last row (e.g. a stale page in the
  // URL), so report the real total with an empty page instead
  if (collectionsError?.code === 'PGRST103') {
    const { count: total } = await listedCollections(true)

    return { data: [], total: total ?? 0 }
  }

  if (collectionsError) {
    throw createError({
      statusCode: 500,
      statusMessage: collectionsError.message,
    })
  }

  if (!collections?.length) {
    return { data: [], total: count ?? 0 }
  }

  const { data: items, error: itemsError } = await client
    .from('user_collection_items')
    .select(
      // Only what the Trading Hub shows; full colorway rows made the
      // response far larger than needed
      'id, collection_id, priority, asking_price, artisan:artisan_colorways(id, name, img, maker_id, sculpt_id, colorway_id, sculpt:artisan_sculpts(name), maker:artisan_makers(name))',
    )
    .in(
      'collection_id',
      collections.map((c) => c.id),
    )
    .eq('exchange', true)
    .order('order', { ascending: true })

  if (itemsError) {
    throw createError({
      statusCode: 500,
      statusMessage: itemsError.message,
    })
  }

  const group = groupBy(items || [], (item) => item.collection_id)

  return {
    data: collections.map(({ listed: _listed, ...collection }) => ({
      ...collection,
      items: group[collection.id] || [],
    })),
    total: count ?? 0,
  }
})
