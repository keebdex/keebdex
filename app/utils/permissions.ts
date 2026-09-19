// Shared, isomorphic permission logic reused by both the Pinia user store
// (client) and Nitro server utils (server/utils/admin.ts), so the
// admin/editor/maker/designer rules are defined in exactly one place.

export type AssignableProfile = {
  role?: string | null
  assignments?: string[] | null
}

/**
 * - admin: can manage everything
 * - editor: can manage everything, or only pages they're assigned to
 * - maker / designer: can only manage pages they're assigned to
 */
export function canManageAssignment(
  profile: AssignableProfile | null | undefined,
  page: string | undefined,
): boolean {
  if (!profile?.role) return false

  switch (profile.role) {
    case 'admin':
      return true
    case 'editor':
      return (
        !profile.assignments || !!profile.assignments.includes(page as string)
      )
    case 'maker':
    case 'designer':
      return (
        !!profile.assignments && profile.assignments.includes(page as string)
      )
    default:
      return false
  }
}

/**
 * Whether a profile can manage at least one page for a given role, without
 * checking a specific assignment (e.g. to decide whether to show a
 * moderation dashboard/nav link).
 */
export function canManageAnyAssignment(
  profile: AssignableProfile | null | undefined,
): boolean {
  if (!profile?.role) return false

  switch (profile.role) {
    case 'admin':
    case 'editor':
      return true
    case 'maker':
    case 'designer':
      return !!profile.assignments?.length
    default:
      return false
  }
}
