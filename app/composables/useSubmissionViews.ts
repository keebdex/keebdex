/**
 * New / Edits switcher of a submission review page (`/{domain}/submissions`):
 * New lists proposals of new records, Edits the edit suggestions to published
 * ones (`?view=edits`). On `/keyset/submissions`, Discovered
 * (`?view=discovered`) lists the keysets the crawler read from forum threads;
 * like the other tabs it shows to every signed-in user, and RLS returns its
 * candidates to staff only. Staff see what waits for their review in each as
 * a badge.
 */
export const useSubmissionViews = () => {
  const route = useRoute()
  const { counts } = usePendingReviews()

  const pending = computed(
    () => counts.value?.[route.path.split('/')[1] as KeebModule],
  )

  const hasDiscovered = computed(() => route.path === '/keyset/submissions')

  const view = computed(() => {
    if (route.query.view === 'edits') return 'edits'
    if (route.query.view === 'discovered' && hasDiscovered.value) {
      return 'discovered'
    }
    return 'new'
  })

  const links = computed(() => [
    {
      label: 'New',
      icon: 'solar:file-add-line-duotone',
      to: { path: route.path },
      active: view.value === 'new',
      badge: pendingBadge(pending.value?.submissions || 0),
    },
    {
      label: 'Edits',
      icon: 'solar:pen-2-line-duotone',
      to: { path: route.path, query: { view: 'edits' } },
      active: view.value === 'edits',
      badge: pendingBadge(pending.value?.edits || 0),
    },
    ...(hasDiscovered.value
      ? [
          {
            label: 'Discovered',
            icon: 'solar:radar-line-duotone',
            to: { path: route.path, query: { view: 'discovered' } },
            active: view.value === 'discovered',
            badge: pendingBadge(pending.value?.discovered || 0),
          },
        ]
      : []),
  ])

  return { view, links }
}
