/** Longest search term the API accepts; longer input is cut. */
export const MAX_SEARCH_TERM_LENGTH = 128

/**
 * Cleans a search term typed by a user: trimmed, cut to
 * `MAX_SEARCH_TERM_LENGTH`, and without `*` (PostgREST reads it as `%` in
 * `like` filters).
 */
export const cleanSearchTerm = (value: unknown) =>
  String(value ?? '')
    .replace(/\*/g, ' ')
    .trim()
    .slice(0, MAX_SEARCH_TERM_LENGTH)

/**
 * The term as a `websearch` query that matches rows holding ANY of its words:
 * each word is quoted, so `-`, `or`, and quotes typed by the user are plain
 * text (`websearch` would read `-word` as a negation), and `websearch` never
 * rejects the query the way `to_tsquery` rejects `&`, `|`, `!`, or `(`.
 * Words split on spaces and commas.
 */
export const websearchAny = (term: string) =>
  cleanSearchTerm(term)
    .split(/[\s,]+/)
    .map((word) => word.replace(/"/g, ''))
    .filter(Boolean)
    .map((word) => `"${word}"`)
    .join(' or ')

/**
 * `%term%` for `.ilike(column, value)`: `%`, `_`, and `\` in the term match
 * themselves instead of acting as wildcards.
 */
export const ilikeContains = (term: string) =>
  `%${cleanSearchTerm(term).replace(/[\\%_]/g, '\\$&')}%`

/** `term%` for `.ilike(column, value)`, with the same literal matching. */
export const ilikeStartsWith = (term: string) =>
  `${cleanSearchTerm(term).replace(/[\\%_]/g, '\\$&')}%`

/**
 * The same pattern as a value inside `.or('col.ilike.<value>,...')`: quoted, so
 * commas and parentheses in the term cannot add filters to the `or`.
 */
export const ilikeOrValue = (term: string) =>
  `"${ilikeContains(term).replace(/["\\]/g, '\\$&')}"`
