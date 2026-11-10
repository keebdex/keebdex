/** `#rgb` or `#rrggbb` as its red, green, and blue channels (0–255). */
export const hexToRgb = (hex: string): [number, number, number] | null => {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? [...value].map((digit) => digit + digit).join('')
      : value

  if (!/^[0-9a-f]{6}$/i.test(full)) return null

  return [0, 2, 4].map((start) =>
    Number.parseInt(full.slice(start, start + 2), 16),
  ) as [number, number, number]
}

/**
 * Whether dark text reads better than white on a color: its relative
 * luminance (WCAG) is above the point where both contrast the same.
 */
export const isLightColor = (hex: string) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return true

  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]

  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179
}

/** Text that reads on a swatch of this color, a little see-through. */
export const contrastTextClass = (hex: string) =>
  isLightColor(hex) ? 'text-black/70' : 'text-white/80'

/** A RAL Design code as `000 00 00`, from any spacing or prefix, else `null`. */
export const normalizeRalCode = (value: string) => {
  const parts = value
    .replace(/^ral\s*/i, '')
    .replace(/[^0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length !== 3) return null

  const [a, b, c] = parts
  if (a?.length !== 3 || b?.length !== 2 || c?.length !== 2) return null

  return `${a} ${b} ${c}`
}

/**
 * A Pantone code (`19-4052 TCX`, `185C`, `Pantone Cool Gray 1 C`, `Process
 * Blue C`) split into the code as written in Pantone's guides and the slug of
 * its Color Finder page and swatch image (`19-4052-tcx`, `185-c`,
 * `cool-gray-1-c`, `process-blue-c`), else `null`. The code ends in its
 * library suffix (C, U, TCX, TPG, ...).
 */
export const parsePantoneCode = (value: string) => {
  const match = value
    .replace(/^(pantone|pms)\b\s*/i, '')
    .replace(/®/g, '')
    .trim()
    .match(
      /^([a-z][a-z -]*?)?[\s-]*(\d+(?:-\d+)?)?[\s-]+([a-z]{1,3})$|^(\d+(?:-\d+)?)([a-z]{1,3})$/i,
    )

  if (!match) return null

  const words = match[1] || ''
  const number = match[2] || match[4] || ''
  const suffix = match[3] || match[5] || ''
  const name = words
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())

  if (!name.length && !number) return null

  const parts = [...name, number, suffix.toUpperCase()].filter(Boolean)

  return { code: parts.join(' '), slug: parts.join('-').toLowerCase() }
}
