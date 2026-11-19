/**
 * Safety net for the ~100 handlers that throw `createError({ statusCode: 500,
 * statusMessage: error.message })`: a failed database query must not hand its
 * text (table, column, and constraint names, tsquery syntax, timeouts) to the
 * client. Nitro calls the `error` hook before it builds the response from the
 * same error object, so replacing the message here changes what is sent, for
 * the JSON of the API and the error page alike.
 *
 * Only 5xx errors are touched, plus the one PostgREST text that handlers pass
 * through as a 404 (`.single()` found no row): a 4xx message is otherwise
 * written for the user (the submission flows show it in a toast). A
 * deliberate 5xx message that is safe to show says so with
 * `data: { expose: true }` in its `createError`. The original message, or the
 * `cause` that `dbError` attaches, goes to the server log with the ray id.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error: any, context) => {
    const status = Number(error?.statusCode)

    if (
      status === 404 &&
      /Cannot coerce the result to a single JSON object/i.test(
        String(error?.statusMessage),
      )
    ) {
      error.statusMessage = 'Not Found'
      error.message = 'Not Found'
      return
    }

    if (!(status >= 500) || error?.data?.expose) return

    const ray = (context?.event as any)?.node?.req?.headers?.['cf-ray']
    console.error(
      `[server error ${status}] ${error.cause?.message || error.statusMessage || error.message}${ray ? ` (cf-ray ${ray})` : ''}`,
    )

    error.statusMessage = 'Internal Server Error'
    error.message = 'Internal Server Error'
  })
})
