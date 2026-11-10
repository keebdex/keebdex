import { canManageAssignment } from '~/utils/permissions'
import { normalizeRalCode, parsePantoneCode } from '~/utils/color'

type FetchColorBody = {
  system?: string
  code?: string
}

/**
 * What a lookup fills in. RAL pages state the hex; Pantone keeps it behind
 * its paid plan, so a Pantone lookup returns its flat swatch image instead
 * (`swatch`, a data URL) and the form reads the hex from its pixels.
 */
type FetchedColor = {
  system: string
  code: string
  name: string | null
  hex?: string
  swatch?: string
  sourceUrl: string
}

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const PANTONE_SWATCH_URL =
  'https://pantone-web-assets-dev.s3.us-east-2.amazonaws.com/magento/media/color-finder/img/slabs/pantone-color-slab-'

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildRalSlug(code: string) {
  return code.replace(/\s+/g, '-').toLowerCase()
}

function extractPreviewButton(html: string) {
  const buttonMatch = html.match(/<button[^>]*id=["']color_preview["'][^>]*>/i)

  if (!buttonMatch) return null

  const buttonTag = buttonMatch[0]
  const styleMatch = buttonTag.match(/style=["']([^"']*)["']/i)
  const titleMatch = buttonTag.match(/title=["']([^"']*)["']/i)
  const hexMatch = styleMatch?.[1]?.match(
    /background-color\s*:\s*(#[0-9a-fA-F]{3,6})/,
  )

  return {
    hex: hexMatch?.[1]?.toLowerCase() || null,
    title: titleMatch?.[1]?.trim() || null,
  }
}

async function fetchRalColor(code: string): Promise<FetchedColor> {
  const normalizedCode = normalizeRalCode(code)

  if (!normalizedCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid RAL code format. Expected: 000 00 00',
    })
  }

  const sourceUrl = `https://www.ralcolorchart.com/ral-design/ral-${buildRalSlug(normalizedCode)}`
  const html = await $fetch<string>(sourceUrl, {
    headers: { 'user-agent': BROWSER_USER_AGENT },
  }).catch(() => {
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to fetch color from source website',
    })
  })

  const preview = extractPreviewButton(html)

  if (!preview?.hex || !preview?.title) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Color preview not found for this RAL code',
    })
  }

  const titleMatch = preview.title.match(
    /^(RAL)\s+(\d{3}\s\d{2}\s\d{2})\s+(.+)$/i,
  )

  return {
    system: 'RAL',
    code: titleMatch?.[2] || normalizedCode,
    name: titleMatch?.[3] ? toTitleCase(titleMatch[3]) : null,
    hex: preview.hex,
    sourceUrl,
  }
}

/**
 * The color name from a Color Finder page title (`PANTONE® USA | Pantone
 * 19-4052 TCX Classic Blue`): the words after the code. Codes without a
 * name (`185 C`) give `null`.
 */
function extractPantoneName(html: string, slug: string) {
  const title = html.match(/<title>[^<]*\|\s*Pantone\s+([^<]+)<\/title>/i)?.[1]
  if (!title) return null

  const words = title.trim().split(/\s+/)
  let code = ''

  for (let index = 0; index < words.length; index++) {
    code = [code, words[index]].filter(Boolean).join('-').toLowerCase()
    if (code === slug) {
      const name = words.slice(index + 1).join(' ')
      return name ? toTitleCase(name) : null
    }
  }

  return null
}

async function fetchPantoneColor(code: string): Promise<FetchedColor> {
  const parsed = parsePantoneCode(code)

  if (!parsed) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Invalid Pantone code. Include the library suffix, e.g. 185 C or 19-4052 TCX.',
    })
  }

  const sourceUrl = `https://www.pantone.com/connect/${parsed.slug}`

  // The swatch decides whether the code exists; the page only adds the name.
  const [swatch, html] = await Promise.all([
    $fetch<ArrayBuffer>(`${PANTONE_SWATCH_URL}${parsed.slug}.webp`, {
      responseType: 'arrayBuffer',
    }).catch(() => null),
    $fetch<string>(sourceUrl, {
      headers: { 'user-agent': BROWSER_USER_AGENT },
    }).catch(() => ''),
  ])

  if (!swatch?.byteLength) {
    throw createError({
      statusCode: 404,
      statusMessage: `Pantone ${parsed.code} was not found`,
    })
  }

  const bytes = new Uint8Array(swatch)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)

  return {
    system: 'Pantone',
    code: parsed.code,
    name: extractPantoneName(html, parsed.slug),
    swatch: `data:image/webp;base64,${btoa(binary)}`,
    sourceUrl,
  }
}

export default defineEventHandler(async (event) => {
  const { profile } = await getActorProfile(event)

  if (!canManageAssignment(profile, undefined)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const { system, code } = (await readBody(event)) as FetchColorBody

  if (!system || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'System and code are required',
    })
  }

  switch (system.toUpperCase()) {
    case 'RAL':
      return fetchRalColor(code)
    case 'PANTONE':
      return fetchPantoneColor(code)
    default:
      throw createError({
        statusCode: 400,
        statusMessage: `System ${system} is not supported yet`,
      })
  }
})
