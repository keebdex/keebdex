export const useCollectionItem = (
  collectionId?: MaybeRefOrGetter<string>,
  onMutate?: () => void,
) => {
  const { user } = storeToRefs(useUserStore())
  const toast = useToast()

  const uid = computed(() => (user.value as any).uid)

  const addItem = (
    collection: { id: string; name: string },
    body: Record<string, any>,
    label: string,
    entityName?: string,
  ) => {
    return $fetch(
      `/api/users/${uid.value}/collections/${collection.id}/items`,
      {
        method: 'post',
        body: {
          uid: uid.value,
          collection_id: collection.id,
          ...body,
        },
      },
    )
      .then((result: any) => {
        if (result?.message) {
          toast.add({ color: 'info', title: result.message })
        } else {
          toast.add(handleSuccess('add', label, entityName, collection.name))
        }
      })
      .catch((error: any) => {
        toast.add(handleError(error))
      })
  }

  const removeItem = (
    itemId: string | number,
    label: string,
    entityName?: string,
  ) => {
    return $fetch(
      `/api/users/${uid.value}/collections/${toValue(collectionId)}/items/${itemId}`,
      { method: 'delete' },
    )
      .then(() => {
        onMutate?.()
        toast.add(handleSuccess('delete', label, entityName))
      })
      .catch((error: any) => {
        toast.add(handleError(error))
      })
  }

  const moveItem = (
    targetCollection: { id: string; name: string },
    itemId: string | number,
    label: string,
  ) => {
    return $fetch(
      `/api/users/${uid.value}/collections/${toValue(collectionId)}/items/${itemId}`,
      {
        method: 'post',
        body: {
          collection_id: targetCollection.id,
          exchange: true,
        },
      },
    )
      .then(() => {
        onMutate?.()
        toast.add(
          handleSuccess('move', label, undefined, targetCollection.name),
        )
      })
      .catch((error: any) => {
        toast.add(handleError(error))
      })
  }

  return { addItem, removeItem, moveItem }
}
