import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

/**
 * The session user, or `null` for a guest. `serverSupabaseUser` returns `null`
 * without a session cookie but throws a 500 when the cookie holds a session
 * that no longer works (expired with a revoked refresh token, or signed out in
 * another tab), so a public page would break for someone who only needs to be
 * treated as signed out.
 */
export const optionalUser = (event: H3Event) =>
  serverSupabaseUser(event).catch(() => null)
