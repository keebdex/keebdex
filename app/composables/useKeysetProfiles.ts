type KeysetProfileItem = {
  profile_id: string
  name: string
  // Keycap profile family (Cherry, SA, …)
  profile: string | null
  manufacturer: string | null
  // The manufacturer's logo key (`logoUrl`)
  manufacturer_id: string | null
}

type KeysetProfilesResponse = {
  groupedProfiles: Record<string, Record<string, string>>
  manufacturers: Record<string, string>
  profiles: KeysetProfileItem[]
}

const emptyResponse: KeysetProfilesResponse = {
  groupedProfiles: {},
  manufacturers: {},
  profiles: [],
}

export const useKeysetProfiles = () => {
  const { data, status, refresh } = useAsyncData<KeysetProfilesResponse>(
    'keyset-profiles',
    () => $fetch('/api/keysets/profiles'),
    {
      // Only the columns the pages read: the full rows (descriptions,
      // review fields) would weigh down the SSR payload of every keyset page
      transform: (response: any) => ({
        groupedProfiles: response.groupedProfiles,
        manufacturers: response.manufacturers,
        profiles: (response.profiles || []).map(
          ({ profile_id, name, profile, manufacturer, manufacturer_id }: any) => ({
            profile_id,
            name,
            profile,
            manufacturer,
            manufacturer_id,
          }),
        ),
      }),
      default: () => emptyResponse,
    },
  )

  const groupedProfiles = computed(() => data.value?.groupedProfiles || {})
  const manufacturers = computed(() => data.value?.manufacturers || {})
  const profiles = computed(() => data.value?.profiles || [])

  return {
    groupedProfiles,
    manufacturers,
    profiles,
    status,
    refresh,
  }
}
