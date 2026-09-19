import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createError } from 'h3'
import type { H3Event } from 'h3'
import { canManageAssignment } from '~/utils/permissions'
import type { AssignableProfile } from '~/utils/permissions'

export const requireAdminClient = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { data: actor, error: actorError } = await client
    .from('users')
    .select('role')
    .eq('id', user.sub)
    .single()

  if (actorError) {
    throw createError({
      statusCode: 500,
      statusMessage: actorError.message,
    })
  }

  if (!actor || actor.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return client
}

export type ModeratorProfile = AssignableProfile

/**
 * Whether a staff profile can moderate an artisan colorway scoped to a given
 * assignment (e.g. a maker id).
 */
export const canModerateAssignment = (
  profile: ModeratorProfile | null | undefined,
  assignment: string,
) => canManageAssignment(profile, assignment)

/**
 * Fetches the requesting user and their staff profile, without throwing when
 * the user is not staff. Useful for endpoints that behave differently for
 * regular users vs. Mod/Admin/Maker/Designer staff (e.g. colorway
 * submissions).
 */
export const getActorProfile = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { data: profile, error: profileError } = await client
    .from('users')
    .select('role, assignments')
    .eq('id', user.sub)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    throw createError({
      statusCode: 500,
      statusMessage: profileError.message,
    })
  }

  return { client, user, profile: profile as ModeratorProfile | null }
}
