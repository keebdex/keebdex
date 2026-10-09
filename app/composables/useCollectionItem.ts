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
          toast.add(successToast('add', { entity: entityName, name: label, target: collection.name }))
        }
      })
      .catch((error: any) => {
        toast.add(errorToast(error))
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
        toast.add(successToast('remove', { entity: entityName, name: label }))
      })
      .catch((error: any) => {
        toast.add(errorToast(error))
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
          successToast('move', { name: label, target: targetCollection.name }),
        )
      })
      .catch((error: any) => {
        toast.add(errorToast(error))
      })
  }

  return { addItem, removeItem, moveItem }
}
