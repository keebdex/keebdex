/**
 * New / Edits switcher of a submission review page (`/{domain}/submissions`):
 * New lists proposals of new records, Edits the edit suggestions to published
 * ones (`?view=edits`). Staff see what waits for their review in each as a
 * badge.
 */
export const useSubmissionViews = () => {
  const route = useRoute()
  const { counts } = usePendingReviews()

  const pending = computed(
    () => counts.value?.[route.path.split('/')[1] as ReviewDomain],
  )

  const view = computed(() =>
    route.query.view === 'edits' ? 'edits' : 'new',
  )

  const links = computed(() => [
    {
      label: 'New',
      icon: 'hugeicons:file-add',
      to: { path: route.path },
      active: view.value === 'new',
      badge: pendingBadge(pending.value?.submissions || 0),
    },
    {
      label: 'Edits',
      icon: 'hugeicons:pencil-edit-02',
      to: { path: route.path, query: { view: 'edits' } },
      active: view.value === 'edits',
      badge: pendingBadge(pending.value?.edits || 0),
    },
  ])

  return { view, links }
}
