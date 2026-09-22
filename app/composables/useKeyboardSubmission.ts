export const useKeyboardSubmission = ({ keyboard, releases, isEdit }) => {
  const buildReleasesPayload = () =>
    releases.value
      .filter((release) => release.name)
      .map(({ _key, variants, ...release }) => ({
        ...release,
        variants: variants
          .filter((variant) => variant.variant_name)
          .map(({ _key: variantKey, ...variant }) => variant),
      }))

  const save = async (action = 'update') => {
    const releasesPayload = buildReleasesPayload()

    if (isEdit.value) {
      return $fetch(`/api/submissions/keyboard/${keyboard.value.id}`, {
        method: 'post',
        body: { action, keyboard: keyboard.value, releases: releasesPayload },
      })
    }

    return $fetch('/api/submissions/keyboard', {
      method: 'post',
      body: { keyboard: keyboard.value, releases: releasesPayload },
    })
  }

  const remove = async () =>
    $fetch(`/api/submissions/keyboard/${keyboard.value.id}`, {
      method: 'delete',
    })

  return {
    buildReleasesPayload,
    save,
    remove,
  }
}
