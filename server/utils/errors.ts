/**
 * The error to throw for a failed Supabase query: it carries a generic message,
 * never the database's text (table, column, and constraint names, tsquery
 * syntax, timeouts), which the client does not need. The real error rides
 * along as `cause`, and `server/plugins/hide-server-error-details.ts` writes
 * it to the server log with the Cloudflare ray id.
 *
 *   if (error) throw dbError(error, 'colors')
 *
 * A malformed value (`22P02`, e.g. an id that is not a uuid) is the caller's
 * fault, so it answers 400, and a missing row (`PGRST116`) answers 404.
 */
export const dbError = (
  error: { code?: string; message?: string } | null | undefined,
  label = 'database',
) => {
  const cause = Object.assign(
    new Error(
      `[${label}] ${error?.code ?? 'unknown'}: ${error?.message ?? ''}`,
    ),
    { code: error?.code },
  )

  if (error?.code === '22P02') {
    return createError({ statusCode: 400, statusMessage: 'Bad Request', cause })
  }

  if (error?.code === 'PGRST116') {
    return createError({ statusCode: 404, statusMessage: 'Not Found', cause })
  }

  return createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
    cause,
  })
}

// What Postgres and PostgREST say on their own: names of tables, columns, and
// constraints, and the offending input. A message raised by our own functions
// (`raise exception '...'`) is written for users and does not match.
const BUILT_IN_DB_MESSAGE =
  /violates|invalid input|row-level security|permission denied|null value|out of range|does not exist|syntax error|duplicate key|too long|query returned no rows|cannot coerce|could not|must be/i

/**
 * The message of a database error that a handler maps to a 4xx: kept when one
 * of our own functions wrote it for the user, replaced by `fallback` when it
 * is a built-in Postgres message.
 */
export const userFacingDbMessage = (
  error: { message?: string },
  fallback: string,
) =>
  error.message && !BUILT_IN_DB_MESSAGE.test(error.message)
    ? error.message
    : fallback
