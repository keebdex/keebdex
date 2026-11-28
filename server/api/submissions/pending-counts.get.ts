import { createError, defineEventHandler } from 'h3'
import { getActorProfile } from '../../utils/admin'
import { getAssignmentScope } from '../../utils/child-submissions'
import { suggestionsTable } from '../../utils/edit-suggestions'
import { candidatesTable } from '../../utils/ingest'
import {
  KEYBOARD_QUEUE,
  KEYSET_QUEUE,
  countGroupedPending,
} from '../../utils/submission-queue'
import { canManageAnyAssignment } from '~/utils/permissions'
import { KEEB_MODULES } from '~/utils/keeb-modules'
import type { KeebModule } from '~/utils/keeb-modules'

/**
 * What waits for the staff member's review, per module: Pending submissions
 * (colorways, kits, variants, counted like the New tab's Pending filter) and
 * Pending edit suggestions of their scope (the Edits tab, without their own),
 * and the discovered keysets waiting in `ingest.candidates` (the keyset
 * Discovered tab; RLS limits them to the caller's scope).
 * Drives the badges of the sidebar's Submissions links; never a notification.
 */
export default defineEventHandler(async (event) => {
  const { client, user, profile } = await getActorProfile(event)

  if (!canManageAnyAssignment(profile)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const scope = getAssignmentScope(profile)

  const countColorways = async () => {
    let request = client
      .from('artisan_colorways')
      .select('id', { count: 'exact', head: true })
      .eq('review_status', 'Pending')

    if (scope) request = request.in('maker_id', scope)

    const { count, error } = await request

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return count || 0
  }

  // RLS returns suggestions of the caller's scope plus their own, so their
  // own (made outside their scope) are left out.
  const countEdits = async (domain: KeebModule) => {
    const { count, error } = await suggestionsTable(client)
      .select('id', { count: 'exact', head: true })
      .eq('domain', domain)
      .eq('review_status', 'Pending')
      .neq('submitted_by', user.sub)

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return (count as number) || 0
  }

  // Zero, not a failed request, where the `ingest` schema is not exposed
  // yet: the other badges still load.
  const countDiscovered = async () => {
    const { count, error } = await candidatesTable(client)
      .select('id', { count: 'exact', head: true })
      .eq('module', 'Keyset')
      .eq('state', 'new')

    if (error) {
      console.error('count discovered keysets error', error)
      return 0
    }

    return (count as number) || 0
  }

  const [artisan, keyset, keyboard, discovered, ...edits] = await Promise.all([
    countColorways(),
    countGroupedPending(client, KEYSET_QUEUE, { userId: user.sub, scope }),
    countGroupedPending(client, KEYBOARD_QUEUE, { userId: user.sub, scope }),
    countDiscovered(),
    ...KEEB_MODULES.map(countEdits),
  ])

  const submissions = { artisan, keyset, keyboard }

  return Object.fromEntries(
    KEEB_MODULES.map((domain, i) => [
      domain,
      {
        submissions: submissions[domain],
        edits: edits[i] || 0,
        discovered: domain === 'keyset' ? discovered : 0,
      },
    ]),
  ) as Record<
    KeebModule,
    { submissions: number; edits: number; discovered: number }
  >
})
