import { z } from 'zod'

// Link and image URLs users submit end up in `href` and `src`, so only
// http(s) is accepted: `javascript:` and `data:` URLs run script when clicked.
// Whitespace and control characters never belong in a URL
const hasForbiddenChars = (url: string) =>
  [...url].some(
    (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
  )

/** A string that is an absolute http(s) URL, without spaces or control characters. */
export const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false

  const url = value.trim()

  if (!/^https?:\/\//i.test(url) || hasForbiddenChars(url)) return false

  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** The trimmed URL when it is http(s), otherwise `undefined`. */
export const safeExternalUrl = (value: unknown): string | undefined =>
  isHttpUrl(value) ? value.trim() : undefined

export const HTTP_URL_MESSAGE = 'Enter a valid http(s) URL'

export const httpUrlSchema = z.string().refine(isHttpUrl, HTTP_URL_MESSAGE)

/** An http(s) URL, or empty (blank, null, or missing). */
export const optionalHttpUrlSchema = httpUrlSchema
  .nullish()
  .or(z.string().min(0).max(0))
