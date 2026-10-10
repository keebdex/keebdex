import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createError } from 'h3'
import type { H3Event } from 'h3'

export const NOTIFICATION_PAGE_SIZE = 50

export const NOTIFICATION_FIELDS =
  'id, type, actor_id, entity_type, entity_id, data, read_at, created_at'

/**
 * The signed-in user and a Supabase client for their notifications. RLS keeps
 * every query to the user's own rows and only lets them change `read_at`.
 */
export const getNotificationsContext = async (event: H3Event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  // `notifications` and its RPCs are newer than the generated types.
  return { user, client: client as any }
}

/** Unread count for the badge, from the `unread_count()` RPC. */
export const getUnreadCount = async (client: any): Promise<number> => {
  const { data, error } = await client.rpc('unread_count')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data ?? 0
}
