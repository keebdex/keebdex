export const useArtisanSubmission = (initialColorway = {}) => {
  const route = useRoute()
  const toast = useToast()

  const colorway = ref({
    name: '',
    img: '',
    maker_id: String(route.params.maker || route.query.maker || ''),
    sculpt_id: String(route.params.sculpt || route.query.sculpt || ''),
    maker_sculpt_id: `${String(route.params.maker || route.query.maker || '')}/${String(route.params.sculpt || route.query.sculpt || '')}`,
    order: 0,
    currency: 'USD',
    sale_type: 'Raffle',
    ...initialColorway,
  })

  const uploading = ref(false)

  const submit = async () => {
    uploading.value = true

    try {
      const payload = {
        ...colorway.value,
        source: 'keebdex',
        overridden_fields: [],
      }

      const [created] = await $fetch(
        `/api/makers/${payload.maker_id}/sculpts/${payload.sculpt_id}/colorways`,
        {
          method: 'post',
          body: payload,
        },
      )

      if (created?.status === 'Pending') {
        toast.add({
          title: 'Thanks for your contribution!',
          description:
            'Your colorway is now pending review and will display a Pending Review badge.',
          color: 'success',
        })
      } else {
        toast.add(handleSuccess('add', payload.name, 'Colorway'))
      }

      return created
    } catch (error) {
      toast.add(handleError(error, { showOriginalMessage: true }))
      throw error
    } finally {
      uploading.value = false
    }
  }

  return {
    colorway,
    uploading,
    submit,
  }
}
