export const useCollection = (collectionId: MaybeRefOrGetter<string>) => {
  const userStore = useUserStore()
  const { collections } = storeToRefs(userStore)
  const router = useRouter()
  const toast = useToast()

  const { data, status, refresh } = useAsyncData(
    `collection-${toValue(collectionId)}`,
    () => $fetch(`/api/collections/${toValue(collectionId)}`),
  )

  watch(
    () => toValue(collectionId),
    () => refresh(),
  )

  const deleteCollection = () => {
    return $fetch(
      `/api/users/${data.value?.uid}/collections/${data.value?.id}`,
      { method: 'delete' },
    )
      .then(() => {
        collections.value = collections.value.filter(
          (c: any) => c.id !== data.value?.id,
        )
        userStore.$patch({ collections: collections.value })
        toast.add(successToast('delete', { entity: 'Collection', name: data.value?.name }))
        router.go(-1)
      })
      .catch((error: any) => {
        toast.add(errorToast(error))
      })
  }

  // Shared collections are public: only the owner may edit or delete
  const isOwner = computed(
    () =>
      !!data.value?.uid &&
      data.value.uid === (userStore.user as { uid?: string }).uid,
  )

  return {
    data,
    status,
    refresh,
    deleteCollection,
    isOwner,
  }
}
