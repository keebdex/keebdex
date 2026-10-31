import { formatKeyboardDescription, formatPrice, isBlank } from '~/utils'
import { keyboardTopCaseStylesEnabled } from '~/utils/schemas/keyboard'

// A keyboard, release, or variant: the specs one level sets and the level
// below inherits
type Specs = {
  form_factor?: string | null
  top_case_styles?: string[] | null
  msrp_price?: number | null
  currency?: string | null
  release_year?: number | null
  [field: string]: unknown
}

/** The material specs a release sets for its variants, which may override
 * them, case first, then what sits inside it. */
const KEYBOARD_MATERIAL_SPECS = [
  { term: 'Case', field: 'case_materials', icon: 'hugeicons:package' },
  { term: 'Plate', field: 'plate_materials', icon: 'hugeicons:layers-02' },
  { term: 'PCB', field: 'pcb_types', icon: 'hugeicons:chip' },
  { term: 'Weight', field: 'weight_materials', icon: 'hugeicons:weight-scale' },
] as const

type MaterialField = (typeof KEYBOARD_MATERIAL_SPECS)[number]['field']

/** A list spec as text, or null when empty. */
export const joinSpecList = (value: unknown) =>
  Array.isArray(value) ? value.join(', ') || null : (value as string) || null

/** A list spec as an array: older rows may store a single value. */
export const toArray = (value: unknown) =>
  Array.isArray(value) ? value : value ? [value] : []

/** Whether two list specs hold the same values, in any order. */
const sameList = (a: unknown, b: unknown) =>
  [...toArray(a)].sort().join('|') === [...toArray(b)].sort().join('|')

/** Whether a keyboard's form factor has top case layouts (WK, WKL, HHKB). */
export const hasTopCaseStyles = (keyboard: Specs) =>
  keyboardTopCaseStylesEnabled.includes(keyboard.form_factor || '')

/**
 * A variant's specs: each one its own when set, else its release's (a spec is
 * set once and the level below leaves it empty to inherit). A price of its
 * own is read in its own currency when it has one, else in the release's.
 * `custom` is whether the variant is built differently from its release: a
 * material of its own that differs from the release's. A price of its own
 * shows on its card, and a year of its own is not a spec of its build.
 * Resolving an empty variant gives what its release passes down.
 */
export const resolveVariantSpecs = (variant: Specs, release: Specs) => {
  const own = (field: string) => !isBlank(variant[field])
  const pick = (field: string) => (own(field) ? variant[field] : release[field])

  return {
    year: (pick('release_year') as number | null) ?? null,
    price: formatPrice(
      pick('msrp_price') as number | null,
      (own('msrp_price') && variant.currency) || release.currency,
      { stripZeros: true },
    ),
    materials: Object.fromEntries(
      KEYBOARD_MATERIAL_SPECS.map(({ field }) => [field, pick(field)]),
    ) as Record<MaterialField, string[] | null | undefined>,
    custom: KEYBOARD_MATERIAL_SPECS.some(
      ({ field }) => own(field) && !sameList(variant[field], release[field]),
    ),
  }
}

const materialItems = (materials: Partial<Record<MaterialField, unknown>>) =>
  KEYBOARD_MATERIAL_SPECS.map(({ term, field, icon }) => ({
    term,
    description: joinSpecList(materials[field]),
    icon,
  }))

/** A release's specs as spec list items, leaving out unset ones. Its layouts
 * show only when it narrows its keyboard's, which the page header lists. */
export const releaseSpecItems = (release: Specs, keyboard: Specs) =>
  [
    {
      term: 'Top Case',
      description: hasTopCaseStyles(keyboard)
        ? joinSpecList(release.top_case_styles)
        : null,
      icon: 'hugeicons:layout-top',
    },
    ...materialItems(release),
  ].filter((spec) => spec.description)

/** A keyboard's own specs, shared by every release, as spec list items;
 * unset ones keep a null description. Top case styles apply only to some
 * form factors. */
export const keyboardSpecItems = (keyboard: Specs) =>
  [
    {
      term: 'Form Factor',
      description: keyboard.form_factor,
      icon: 'hugeicons:keyboard',
    },
    hasTopCaseStyles(keyboard) && {
      term: 'Top Case',
      description: joinSpecList(keyboard.top_case_styles),
      icon: 'hugeicons:layout-top',
    },
    {
      term: 'Mount',
      description: joinSpecList(keyboard.mount_styles),
      icon: 'hugeicons:layers-01',
    },
    {
      term: 'Typing Angle',
      description: keyboard.typing_angle ? `${keyboard.typing_angle}°` : null,
      icon: 'hugeicons:angle-01',
    },
  ].filter((spec) => !!spec) as {
    term: string
    description?: string | null
    icon: string
  }[]

/** Everything about one variant as spec list items, read from the board
 * outwards: the keyboard's design (with the layouts its release was sold in,
 * else all of the keyboard's), then what it is built from, then how it was
 * sold. Each is resolved through its release. Unset ones stay, shown as a
 * dash like the keyboard's own, so every variant lists the same specs; Top
 * Case appears only for form factors that have layouts. */
export const variantSpecItems = (
  keyboard: Specs,
  release: Specs,
  variant: Specs,
) => {
  const resolved = resolveVariantSpecs(variant, release)
  const [caseMaterials, ...insides] = materialItems(resolved.materials)

  return [
    // Design: form factor, layouts, mount, typing angle
    ...keyboardSpecItems({
      ...keyboard,
      top_case_styles: isBlank(release.top_case_styles)
        ? keyboard.top_case_styles
        : release.top_case_styles,
    }),
    // Build: the case and its finish, then what sits inside
    caseMaterials,
    {
      term: 'Finish',
      description: variant.finish_type as string | null,
      icon: 'hugeicons:paint-brush-01',
    },
    ...insides,
    // Sale
    {
      term: 'Release Year',
      description: resolved.year,
      icon: 'hugeicons:calendar-03',
    },
    {
      term: 'Sale Type',
      description: variant.sale_type as string | null,
      icon: 'hugeicons:shopping-bag-01',
    },
    {
      term: 'Pricing',
      description: resolved.price,
      icon: 'hugeicons:sale-tag-02',
    },
    {
      term: 'Units Produced',
      description: variant.units_produced as number | null,
      icon: 'hugeicons:hashtag',
    },
  ]
}

/** A variant's full name: brand, keyboard, release, and variant. */
export const variantTitle = (keyboard: Specs, release: Specs, variant: Specs) =>
  formatKeyboardDescription([
    (keyboard.brand as { name?: string } | undefined)?.name,
    keyboard.name as string,
    release.name as string,
    variant.variant_name as string,
  ])

/** The photos for a view of a variant: `front` or `back` (each falling back
 * to the other, then to the placeholder), or `side` for both. */
export const variantPhotos = (variant: Specs, view: string) => {
  const front = (variant.img_front || variant.img_back || '/keyboard.png') as string
  const back = (variant.img_back || variant.img_front || '/keyboard.png') as string

  if (view === 'side') {
    return [
      { label: 'Front', src: front },
      { label: 'Back', src: back },
    ]
  }

  return [view === 'back' ? { label: 'Back', src: back } : { label: 'Front', src: front }]
}
