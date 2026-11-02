// Detail endpoints answer 404 for a record that does not exist, or that the
// caller may not see yet (under review). Throwing it as a page error makes the
// response a real 404, so search engines drop the address instead of indexing
// an empty page. Call it right after the page's awaited useAsyncData.
export const throwIfNotFound = (
  error: { statusCode?: number } | null | undefined,
) => {
  if (error?.statusCode === 404) {
    throw createError({ statusCode: 404, fatal: true })
  }
}
