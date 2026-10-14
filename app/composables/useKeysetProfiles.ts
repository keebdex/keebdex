type KeysetProfilesResponse = {
  groupedProfiles: Record<string, Record<string, string>>
  manufacturers: Record<string, string>
}

const emptyResponse: KeysetProfilesResponse = {
  groupedProfiles: {},
  manufacturers: {},
}

export const useKeysetProfiles = () => {
  const { data, status, refresh } = useAsyncData<KeysetProfilesResponse>(
    'keyset-profiles',
    () => $fetch('/api/keysets/profiles'),
    {
      // The endpoint also returns the full profile rows, which no page reads;
      // keep them out of the SSR payload of every keyset page
      pick: ['groupedProfiles', 'manufacturers'],
      default: () => emptyResponse,
    },
  )

  const groupedProfiles = computed(() => data.value?.groupedProfiles || {})
  const manufacturers = computed(() => data.value?.manufacturers || {})

  return {
    groupedProfiles,
    manufacturers,
    status,
    refresh,
  }
}
