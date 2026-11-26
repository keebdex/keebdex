// Receives CSP violation reports (the Content-Security-Policy-Report-Only
// header in nuxt.config.ts points here) and writes one compact log line, which
// shows up in the Worker's observability logs. Unauthenticated by design:
// browsers send reports without credentials, so it logs only a few fields
// (never the full body) and never stores anything.
const MAX_BYTES = 8 * 1024

const origin = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  try {
    return new URL(value).origin
  } catch {
    // 'inline', 'eval', 'data', ...
    return value.slice(0, 40)
  }
}

const path = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  try {
    return new URL(value).pathname
  } catch {
    return undefined
  }
}

const text = (value: unknown) =>
  typeof value === 'string' ? value.slice(0, 200) : undefined

export default defineEventHandler(async (event) => {
  const declared = Number(getRequestHeader(event, 'content-length'))
  if (declared > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Payload Too Large' })
  }

  const raw = await readRawBody(event, 'utf8')
  if (raw && raw.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Payload Too Large' })
  }

  let body: unknown
  try {
    body = raw ? JSON.parse(raw) : undefined
  } catch {
    setResponseStatus(event, 204)
    return null
  }

  // `application/csp-report` wraps the report in "csp-report"; the Reporting
  // API (`application/reports+json`) sends an array of { type, body }
  const entries = Array.isArray(body) ? body : [body]
  for (const entry of entries.slice(0, 5)) {
    const report = (entry as any)?.['csp-report'] ?? (entry as any)?.body
    if (!report || typeof report !== 'object') continue

    console.warn(
      'csp-violation',
      JSON.stringify({
        directive: text(
          report['effective-directive'] ??
            report.effectiveDirective ??
            report['violated-directive'] ??
            report.violatedDirective,
        ),
        blocked: origin(report['blocked-uri'] ?? report.blockedURL),
        page: path(report['document-uri'] ?? report.documentURL),
      }),
    )
  }

  setResponseStatus(event, 204)
  return null
})
