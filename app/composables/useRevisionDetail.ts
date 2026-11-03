import type { RevisionDetail } from '~/utils/revisions'

/** `Name, Price and Status`, from field keys. */
export const revisionFieldList = (keys: string[]) => {
  const labels = keys.map(suggestionFieldLabel)

  return labels.length > 1
    ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
    : labels[0] || ''
}

/**
 * One revision opened from History or Recent Changes: loads it
 * (`GET /api/revisions/:id`), compares it with the record before it, and
 * undoes or restores it
 * through a confirmation (`confirm(mode)`, then `revert()`). `onReverted`
 * gets the fields the revert wrote, after which the revision reloads.
 */
export const useRevisionDetail = (
  options: {
    onReverted?: (revert: {
      entityType: string
      changes: Record<string, unknown>
    }) => unknown
  } = {},
) => {
  const toast = useToast()

  const selectedId = ref<number | null>(null)
  const detail = ref<RevisionDetail | null>(null)
  const detailLoading = ref(false)

  const loadDetail = async (id: number) => {
    detailLoading.value = true

    try {
      const result = await $fetch<RevisionDetail>(`/api/revisions/${id}`)

      if (selectedId.value === id) detail.value = result
    } catch (error) {
      toast.add(errorToast(error))
      if (selectedId.value === id) selectedId.value = null
    } finally {
      detailLoading.value = false
    }
  }

  const selectRevision = (id: number) => {
    detail.value = null
    selectedId.value = id
    loadDetail(id)
  }

  watch(selectedId, (id) => {
    if (!id) detail.value = null
  })

  const detailTitle = computed(() =>
    detail.value
      ? detail.value.label || revisionEntityLabel(detail.value)
      : 'Revision',
  )

  const changeDiffs = computed(() =>
    detail.value ? revisionChangeDiff(detail.value) : [],
  )
  const undoFields = computed(() =>
    detail.value ? revertableFields(detail.value, 'undo') : [],
  )
  const restoreFields = computed(() =>
    detail.value ? revertableFields(detail.value, 'restore') : [],
  )
  const conflicts = computed(() =>
    detail.value?.current && detail.value.action === 'update'
      ? undoConflicts(detail.value)
      : [],
  )

  // Undo / Restore -----------------------------------------------------------

  const confirmOpen = ref(false)
  const confirmMode = ref<'undo' | 'restore'>('undo')
  const reverting = ref(false)

  const confirm = (mode: 'undo' | 'restore') => {
    confirmMode.value = mode
    confirmOpen.value = true
  }

  const confirmTitle = computed(() =>
    confirmMode.value === 'undo' ? 'Undo This Change' : 'Restore This Revision',
  )

  const confirmDescription = computed(() => {
    if (!detail.value) return undefined

    const keys = (
      confirmMode.value === 'undo' ? undoFields.value : restoreFields.value
    ).map((diff) => diff.key)
    const locked = syncLockedFields(detail.value, keys)
    const action =
      confirmMode.value === 'undo'
        ? `${revisionFieldList(keys)} will go back to the values before this change.`
        : `${revisionFieldList(keys)} will go back to the values of this revision.`
    const warning = locked.length
      ? ` ${revisionFieldList(locked)} will stop updating from the maker's ${
          detail.value.current?.source === 'scraper' ? 'website' : 'Google Doc'
        }.`
      : ''

    return `${action}${warning} The change is saved as a new revision, so it can be reverted too.`
  })

  const revert = async () => {
    if (!detail.value) return

    const revision = detail.value
    reverting.value = true

    try {
      const { changes } = await $fetch<{ changes: Record<string, unknown> }>(
        `/api/revisions/${revision.id}/revert`,
        {
          method: 'POST',
          body: { mode: confirmMode.value },
        },
      )

      toast.add(
        successToast('update', {
          entity: revisionEntityLabel(revision),
          name: revision.label,
        }),
      )
      confirmOpen.value = false
      await Promise.all([
        options.onReverted?.({ entityType: revision.entity_type, changes }),
        loadDetail(revision.id),
      ])
    } catch (error) {
      toast.add(errorToast(error, { showOriginalMessage: true }))
    } finally {
      reverting.value = false
    }
  }

  return {
    selectedId,
    detail,
    detailLoading,
    detailTitle,
    changeDiffs,
    undoFields,
    restoreFields,
    conflicts,
    selectRevision,
    confirmOpen,
    confirmMode,
    confirmTitle,
    confirmDescription,
    reverting,
    confirm,
    revert,
  }
}
