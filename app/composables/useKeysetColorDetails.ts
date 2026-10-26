import type { RevisionColor } from '~/utils/revisions'

// Ids asked for once per page load, found or not, so a missing color is not
// fetched again on every change.
const requested = new Set<number>()

/**
 * Colors by id, shared across the app, for a keyset's colors in forms and
 * diffs (which hold them as ids): ids not known yet are fetched from
 * `/api/colors` in one request. `remember` adds colors a page already has,
 * e.g. search results.
 */
export const useKeysetColorDetails = (
  ids: MaybeRefOrGetter<number[] | null | undefined> = [],
) => {
  const details = useState<Record<number, RevisionColor>>(
    'keyset-color-details',
    () => ({}),
  )

  const remember = (colors: RevisionColor[]) => {
    const unknown = colors.filter((color) => color?.id && !details.value[color.id])

    if (unknown.length) {
      details.value = {
        ...details.value,
        ...Object.fromEntries(unknown.map((color) => [color.id, color])),
      }
    }
  }

  watch(
    () => [...new Set(toValue(ids) || [])].filter((id) => !requested.has(id)),
    async (missing) => {
      if (import.meta.server || !missing.length) return

      missing.forEach((id) => requested.add(id))

      try {
        const { data } = await $fetch<{ data: RevisionColor[] }>(
          '/api/colors',
          { query: { ids: missing.join(','), size: missing.length } },
        )

        remember(data)
      } catch (error) {
        missing.forEach((id) => requested.delete(id))
        console.error('fetch colors error', error)
      }
    },
    { immediate: true },
  )

  return { details, remember }
}
