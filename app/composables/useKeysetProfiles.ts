import type { Tables } from '~/types/database.types'

type KeysetProfile = Pick<Tables<'keyset_profiles'>, 'id' | 'name' | 'profile'>

type KeysetProfilesResponse = {
  profiles: KeysetProfile[]
  groupedProfiles: Record<string, Record<string, string>>
  manufacturers: Record<string, string>
}

const emptyResponse: KeysetProfilesResponse = {
  profiles: [],
  groupedProfiles: {},
  manufacturers: {},
}

export const useKeysetProfiles = () => {
  const { data, status, refresh } = useAsyncData<KeysetProfilesResponse>(
    'keyset-profiles',
    () => $fetch('/api/keysets/profiles'),
    {
      default: () => emptyResponse,
    },
  )

  const profiles = computed(() => data.value?.profiles || [])
  const groupedProfiles = computed(() => data.value?.groupedProfiles || {})
  const manufacturers = computed(() => data.value?.manufacturers || {})

  return {
    profiles,
    groupedProfiles,
    manufacturers,
    status,
    refresh,
  }
}
