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
