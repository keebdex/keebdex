type PendingCounts = Record<KeebModule, { submissions: number; edits: number }>

/**
 * What waits for the signed-in staff member's review, per module (Pending
 * submissions and edit suggestions of their scope), for the badges of the
 * sidebar's Submissions links and the New / Edits tabs. Staff are never
 * notified of new proposals; these counts are the only signal. Loaded by
 * `plugins/pending-reviews.client.ts` and refreshed after each review action.
 */
export const usePendingReviews = () => {
  const counts = useState<PendingCounts | null>('pending-reviews', () => null)

  const load = async () => {
    if (!useUserStore().isModerator) {
      counts.value = null
      return
    }

    try {
      counts.value = await $fetch<PendingCounts>(
        '/api/submissions/pending-counts',
      )
    } catch (error) {
      console.error('fetch pending reviews error', error)
    }
  }

  const total = (domain: KeebModule) =>
    (counts.value?.[domain].submissions || 0) +
    (counts.value?.[domain].edits || 0)

  return { counts, load, total }
}

// Sidebar and tab badge, capped like the Notifications one.
export const pendingBadge = (count: number) =>
  count
    ? {
        label: count > 9 ? '9+' : String(count),
        color: 'warning' as const,
        variant: 'subtle' as const,
        size: 'sm' as const,
      }
    : undefined
