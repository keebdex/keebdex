type KitCategory = {
  slug: string
  name: string
}

export const useKeysetKits = () => {
  const { data, status, refresh } = useAsyncData<KitCategory[]>(
    'keyset-kits',
    () => $fetch('/api/keysets/kits'),
    { default: () => [] as KitCategory[] },
  )

  const kits = computed(() => data.value || [])

  return {
    kits,
    status,
    refresh,
  }
}
