// One confirm dialog per page for deleting any of its records: `open` fills
// the target, `confirm` deletes it, toasts, and calls `onDeleted` (or the
// `open` call's own, e.g. to leave a page whose record is gone). Bind
// `target.open` and `deleting` to a `SharedConfirmModal`.
export const useConfirmDelete = (onDeleted: () => unknown) => {
  const toast = useToast()

  const target = reactive({ open: false, entity: '', name: '', url: '' })
  const deleting = ref(false)

  // Kept apart from `target`, which only holds what the dialog shows
  let afterDelete = onDeleted

  const open = (
    entity: string,
    name: string,
    url: string,
    then: () => unknown = onDeleted,
  ) => {
    afterDelete = then
    Object.assign(target, { open: true, entity, name, url })
  }

  const confirm = async () => {
    deleting.value = true

    try {
      await $fetch(target.url, { method: 'delete' })

      toast.add(
        successToast('delete', { entity: target.entity, name: target.name }),
      )

      target.open = false
      afterDelete()
    } catch (error) {
      toast.add(errorToast(error))
    } finally {
      deleting.value = false
    }
  }

  return { target, deleting, open, confirm }
}
