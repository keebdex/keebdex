import { createError, type H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

// Auth errors that mean the cookie holds no usable session (a revoked or
// unknown refresh token is an `AuthApiError` with a 4xx status)
const DEAD_SESSION_ERRORS = ['AuthSessionMissingError', 'AuthInvalidJwtError']

const isDeadSession = (error: { name?: string; status?: number }) =>
  DEAD_SESSION_ERRORS.includes(error.name ?? '') ||
  (typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500 &&
    // Rate limited or timed out: the session may be fine, so do not hide it
    error.status !== 408 &&
    error.status !== 429)

/**
 * The session user, or `null` for a guest. Only a session that does not work
 * (no session, a bad token, or a refresh token that was revoked or never
 * existed, e.g. after signing out in another tab) counts as a guest, so a
 * public page does not break for someone who only needs to be treated as signed
 * out. Any other Auth error (the service is down, a 5xx, an unknown failure) is
 * logged and answered with a 500, as `serverSupabaseUser` does, instead of
 * silently turning a signed-in owner into a guest.
 */
export const optionalUser = async (event: H3Event) => {
  const client = await serverSupabaseClient(event)
  const { data, error } = await client.auth.getClaims()

  if (!error) return data?.claims ?? null
  if (isDeadSession(error)) return null

  console.error('Auth getClaims failed', error.name, (error as any).status)
  throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
}
