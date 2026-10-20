/**
 * New / Edits switcher of a submission review page (`/{domain}/submissions`):
 * New lists proposals of new records, Edits the edit suggestions to published
 * ones (`?view=edits`).
 */
export const useSubmissionViews = () => {
  const route = useRoute()

  const view = computed(() =>
    route.query.view === 'edits' ? 'edits' : 'new',
  )

  const links = computed(() => [
    {
      label: 'New',
      icon: 'hugeicons:file-add',
      to: { path: route.path },
      active: view.value === 'new',
    },
    {
      label: 'Edits',
      icon: 'hugeicons:pencil-edit-02',
      to: { path: route.path, query: { view: 'edits' } },
      active: view.value === 'edits',
    },
  ])

  return { view, links }
}
