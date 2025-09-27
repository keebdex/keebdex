import { serverSupabaseClient } from '#supabase/server'
import groupBy from 'lodash.groupby'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { query } = getQuery(event)

  if (!query) return []

  const fts = query
    ?.toString()
    .trim()
    .split(/[\s,\t,\n]+/) // split and remove more than 1 space
    .join(' | ')

  const makerSearch = client
    .from('makers')
    .select()
    .textSearch('fts', `${fts}`)
    .order('id')
    .limit(10)

  const sculptSearch = client
    .from('sculpts')
    .select('*, maker:makers(name)')
    .textSearch('fts', `${fts}`)
    .order('maker_sculpt_id')
    .limit(20)

  const colorwaySearch = client
    .from('colorways')
    .select('*, maker:makers(name), sculpt:sculpts(name)')
    .textSearch('fts', `${fts}`)
    .order('maker_sculpt_id')
    .limit(200)

  const keycapSearch = client
    .from('keycaps')
    .select('*, profile:keycap_profiles(name)')
    .textSearch('fts', `${fts}`)
    .order('profile_keycap_id')
    .limit(10)

  const [makers, sculpts, colorways, keycaps] = await Promise.all([
    makerSearch,
    sculptSearch,
    colorwaySearch,
    keycapSearch,
  ])

  return [
    {
      id: 'artisan-maker',
      label: 'Makers',
      items: makers.data?.map((m: any) => ({
        id: m.id,
        label: m.name,
        to: `/artisan/maker/${m.id}`,
        avatar: {
          src: `/logo/${m.id}.png`,
          alt: m.name,
          ui: {
            root: 'bg-transparent rounded-none',
          },
        },
      })),
    },
    {
      id: 'artisan-sculpt',
      label: 'Sculpts',
      items: sculpts.data?.map((s: any) => ({
        id: s.id,
        label: s.maker.name,
        suffix: s.name,
        to: `/artisan/maker/${s.maker_id}/${s.sculpt_id}`,
        avatar: {
          src: `/logo/${s.maker_id}.png`,
          alt: s.maker.name,
          ui: {
            root: 'bg-transparent rounded-none',
          },
        },
      })),
    },
    {
      id: 'artisan-colorway',
      label: 'Colorways',
      ignoreFilter: true,
      items: Object.entries(groupBy(colorways.data || [], 'maker.name')).map(
        ([maker, items]) => {
          return {
            id: maker.toLowerCase(),
            label: maker,
            avatar: {
              src: `/logo/${items[0].maker_id}.png`,
              alt: items[0].maker.name,
              ui: {
                root: 'bg-transparent rounded-none',
              },
            },
            children: items.map((c) => ({
              id: c.id,
              label: c.sculpt.name,
              suffix: c.name,
              to: `/artisan/maker/${c.maker_id}/${c.sculpt_id}?cid=${c.colorway_id}`,
            })),
          }
        },
      ),
    },
    {
      id: 'keycap-set',
      label: 'Keycap Sets',
      items: keycaps.data?.map((kc: any) => ({
        id: kc.id,
        label: `${kc.profile.name} ${kc.name}`,
        to: `/keycap/${kc.profile_keycap_id}`,
        avatar: {
          src: `/logo/${kc.profile_id}.png`,
          alt: kc.profile.name,
          ui: {
            root: 'bg-transparent rounded-none',
          },
        },
      })),
    },
  ].filter((c) => c.items?.length)
})
