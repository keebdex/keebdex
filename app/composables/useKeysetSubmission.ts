export const useKeysetSubmission = ({ keyset, kits, range, isEdit }) => {
  const buildKitsPayload = () =>
    kits.value
      .filter((kit) => kit.name || kit.img || kit.description)
      .map(({ _key, ...kit }) => kit)

  const save = async (action = 'update') => {
    if (range.value.start) {
      keyset.value.start_date = toISODate(range.value.start)
    }
    if (range.value.end) {
      keyset.value.end_date = toISODate(range.value.end)
    }

    const kitsPayload = buildKitsPayload()

    if (isEdit.value) {
      return $fetch(`/api/submissions/keyset/${keyset.value.id}`, {
        method: 'post',
        body: { action, keyset: keyset.value, kits: kitsPayload },
      })
    }

    return $fetch('/api/submissions/keyset', {
      method: 'post',
      body: { keyset: keyset.value, kits: kitsPayload },
    })
  }

  const remove = async () =>
    $fetch(`/api/submissions/keyset/${keyset.value.id}`, {
      method: 'delete',
    })

  return {
    buildKitsPayload,
    save,
    remove,
  }
}
