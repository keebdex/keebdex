type FetchColorBody = {
  system?: string
  code?: string
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function normalizeRalCode(value: string) {
  const parts = value
    .replace(/^ral\s*/i, '')
    .replace(/[^0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length !== 3) return null

  const [a, b, c] = parts
  if (!a || !b || !c) return null

  if (a.length !== 3 || b.length !== 2 || c.length !== 2) return null

  return `${a} ${b} ${c}`
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

export default defineEventHandler(async (event) => {
  const { system, code } = (await readBody(event)) as FetchColorBody

  if (!system || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'System and code are required',
    })
  }

  if (system.toUpperCase() !== 'RAL') {
    throw createError({
      statusCode: 400,
      statusMessage: `System ${system} is not supported yet`,
    })
  }

  const normalizedCode = normalizeRalCode(code)

  if (!normalizedCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid RAL code format. Expected: 000 00 00',
    })
  }

  const sourceUrl = `https://www.ralcolorchart.com/ral-design/ral-${buildRalSlug(normalizedCode)}`
  const html = await $fetch<string>(sourceUrl, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
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

  const derivedSystem = titleMatch?.[1]?.toUpperCase() || 'RAL'
  const derivedCode = titleMatch?.[2] || normalizedCode
  const derivedName = titleMatch?.[3] ? toTitleCase(titleMatch[3]) : null

  return {
    system: derivedSystem,
    code: derivedCode,
    name: derivedName,
    hex: preview.hex,
    sourceUrl,
  }
})
