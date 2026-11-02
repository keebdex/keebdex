import { Constants } from '~/types/database.types'

type KeysetProfileItem = {
  profile_id: string
  name: string
  // Keycap profile family (Cherry, SA, …)
  profile: string | null
  manufacturer: string | null
  // The manufacturer's logo key (`logoUrl`)
  manufacturer_id: string | null
}

const PROFILE_GROUPS = new Set<string>(
  Constants.public.Enums.keyset_profile_group,
)

export const useKeysetProfiles = () => {
  const { data, status, refresh } = useAsyncData(
    'keyset-profiles',
    () => $fetch('/api/keysets/profiles'),
    {
      // Only the profile columns the pages read, once: the maps below are
      // built from them, so the SSR payload of every keyset page carries
      // neither the full rows nor the same names three times
      transform: (response: any): KeysetProfileItem[] =>
        (response.profiles || []).map(
          ({ profile_id, name, profile, manufacturer, manufacturer_id }: any) => ({
            profile_id,
            name,
            profile,
            manufacturer,
            manufacturer_id,
          }),
        ),
      default: (): KeysetProfileItem[] => [],
    },
  )

  const profiles = computed(() => data.value || [])

  // Name by profile id, under its keycap profile family (the endpoint's
  // grouping: a family outside the enum goes under Others), in the
  // endpoint's order
  const groupedProfiles = computed(() =>
    profiles.value.reduce<Record<string, Record<string, string>>>(
      (acc, item) => {
        const group =
          item.profile && PROFILE_GROUPS.has(item.profile)
            ? item.profile
            : 'Others'

        acc[group] ??= {}
        acc[group][item.profile_id] = item.name

        return acc
      },
      {},
    ),
  )

  // Name by profile id
  const manufacturers = computed(() =>
    Object.fromEntries(profiles.value.map((item) => [item.profile_id, item.name])),
  )

  return {
    groupedProfiles,
    manufacturers,
    profiles,
    status,
    refresh,
  }
}
