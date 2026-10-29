// One confirm dialog per page for deleting any of its records: `open` fills
// the target, `confirm` deletes it, toasts, and calls `onDeleted`. Bind
// `target.open` and `deleting` to a `SharedConfirmModal`.
export const useConfirmDelete = (onDeleted: () => unknown) => {
  const toast = useToast()

  const target = reactive({ open: false, entity: '', name: '', url: '' })
  const deleting = ref(false)

  const open = (entity: string, name: string, url: string) => {
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
      onDeleted()
    } catch (error) {
      toast.add(errorToast(error))
    } finally {
      deleting.value = false
    }
  }

  return { target, deleting, open, confirm }
}
