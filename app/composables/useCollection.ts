// `item` names what the collection holds (`keyset`), for its description
export const useCollection = (
  collectionId: MaybeRefOrGetter<string>,
  item: string,
) => {
  const userStore = useUserStore()
  const { collections } = storeToRefs(userStore)
  const router = useRouter()

  // During SSR, `useRequestFetch` forwards the visitor's cookies, so the
  // owner's private collection passes RLS on a direct load too ($fetch
  // would call the API as a guest and get a 404).
  const requestFetch = useRequestFetch()

  const { data, status, refresh } = useAsyncData(
    `collection-${toValue(collectionId)}`,
    () => requestFetch(`/api/collections/${toValue(collectionId)}`),
  )

  watch(
    () => toValue(collectionId),
    () => refresh(),
  )

  // After `CollectionHeaderActions` deletes it: drop it from the user's
  // collections and leave its page
  const onDeleted = () => {
    collections.value = collections.value.filter(
      (c: any) => c.id !== data.value?.id,
    )
    userStore.$patch({ collections: collections.value })
    router.go(-1)
  }

  // Shared collections are public: only the owner may edit or delete
  const isOwner = computed(
    () =>
      !!data.value?.uid &&
      data.value.uid === (userStore.user as { uid?: string }).uid,
  )

  // Read through getters: the collection loads after setup, also on the server
  useSeoMeta({
    title: () =>
      data.value?.name ? `${data.value.name} • Collection` : 'Collection',
    description: () => {
      if (!data.value) return undefined

      const { name, intent, items } = data.value
      const count = countLabel(items?.length || 0, item)

      // Wishlists and sale lists are what the Trading Hub links to
      if (intent === 'want') {
        return `${name}: a wishlist of ${count} a collector is hunting for on Keebdex.`
      }
      if (intent === 'sell') {
        return `${name}: ${count} for sale or trade on Keebdex.`
      }
      return `${name}: a collection of ${count} on Keebdex.`
    },
  })

  return {
    data,
    status,
    refresh,
    onDeleted,
    isOwner,
  }
}
