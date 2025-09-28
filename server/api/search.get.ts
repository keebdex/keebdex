import { serverSupabaseClient } from '#supabase/server'
import { groupByMakerWithChunks } from '../utils/group'

const avatarUi = (invertible: boolean, theme: string | undefined) => {
  return {
    root: 'bg-transparent rounded-none',
    image: invertible && theme === 'dark' && 'invert',
  }
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { query, theme } = getQuery(event)

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
    .select('*, maker:makers(name, invertible_logo)')
    .textSearch('fts', `${fts}`)
    .order('maker_sculpt_id')
    .limit(20)

  const colorwaySearch = client
    .from('colorways')
    .select('*, maker:makers(id, name, invertible_logo), sculpt:sculpts(name)')
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
      ignoreFilter: true,
      items: makers.data?.map((m: any) => ({
        id: m.id,
        label: m.name,
        to: `/artisan/maker/${m.id}`,
        avatar: {
          src: `/logo/${m.id}.png`,
          alt: m.name,
          ui: avatarUi(m.invertible_logo, theme?.toString()),
        },
      })),
    },
    {
      id: 'artisan-sculpt',
      label: 'Sculpts',
      ignoreFilter: true,
      items: sculpts.data?.map((s: any) => ({
        id: s.id,
        label: s.maker.name,
        suffix: s.name,
        to: `/artisan/maker/${s.maker_id}/${s.sculpt_id}`,
        avatar: {
          src: `/logo/${s.maker_id}.png`,
          alt: s.maker.name,
          ui: avatarUi(s.maker.invertible_logo, theme?.toString()),
        },
      })),
    },
    {
      id: 'artisan-colorway',
      label: 'Colorways',
      ignoreFilter: true,
      items: groupByMakerWithChunks(colorways.data || []).map(
        ({ first, last, makers }) => {
          const label = `${first}-${last}`

          return {
            id: label.toLowerCase(),
            label: `Colorways by makers: ${first}-${last}`,
            children: makers.map(({ maker, items }) => {
              return {
                id: maker.id,
                label: maker.name,
                avatar: {
                  src: `/logo/${maker.id}.png`,
                  alt: maker.name,
                  ui: avatarUi(maker.invertible_logo, theme?.toString()),
                },
                children: items.map((c: any) => ({
                  id: c.id,
                  label: c.sculpt.name,
                  suffix: c.name,
                  to: `/artisan/maker/${c.maker_id}/${c.sculpt_id}?cid=${c.colorway_id}`,
                })),
              }
            }),
          }
        },
      ),
    },
    {
      id: 'keycap-set',
      label: 'Keycap Sets',
      ignoreFilter: true,
      items: keycaps.data?.map((kc: any) => ({
        id: kc.id,
        label: `${kc.profile.name} ${kc.name}`,
        to: `/keycap/${kc.profile_keycap_id}`,
        avatar: {
          src: `/logo/${kc.profile_id}.png`,
          alt: kc.profile.name,
          ui: {
            root: 'bg-transparent rounded-none',
            image: theme === 'dark' && 'invert',
          },
        },
      })),
    },
  ].filter((c) => c.items?.length)
})
