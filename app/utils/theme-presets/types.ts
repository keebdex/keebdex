export interface ThemePreset {
  id: string
  label: string
  icon: string
  ui: Record<string, any>
  css: {
    root?: Record<string, string>
    html?: Record<string, string>
    body?: Record<string, string>
    headings?: Record<string, string>
    light?: Record<string, string>
    dark?: Record<string, string>
  }
}

export const palette = (name: string, shades: Record<number, string>) =>
  Object.fromEntries(
    Object.entries(shades).map(([shade, value]) => [
      `--color-${name}-${shade}`,
      value,
    ]),
  )

const decl = (variables: Record<string, string>) =>
  Object.entries(variables)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')

const block = (selector: string, variables?: Record<string, string>) =>
  variables && Object.keys(variables).length
    ? `${selector}{${decl(variables)}}`
    : ''

export function presetToCss(preset: ThemePreset): string {
  const css = preset.css

  return [
    block('html:root', css.root),
    block('html:root', css.html),
    block('html body', css.body),
    block('html body :is(h1,h2,h3,h4,h5,h6)', css.headings),
    block('html:root:not(.dark)', css.light),
    block('html:root.dark', css.dark),
  ].join('')
}
