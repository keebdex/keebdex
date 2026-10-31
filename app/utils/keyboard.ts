import { formatPrice } from '~/utils'
import { keyboardTopCaseStylesEnabled } from '~/utils/schemas/keyboard'

type Release = {
  msrp_price?: number | null
  currency?: string | null
  release_year?: number | null
  [field: string]: unknown
}

type Variant = {
  msrp_price?: number | null
  currency?: string | null
  release_year?: number | null
  [field: string]: unknown
}

/** The material specs a release sets for its variants, which may override them. */
export const KEYBOARD_MATERIAL_SPECS = [
  { term: 'Case', field: 'case_materials', icon: 'hugeicons:package' },
  { term: 'PCB', field: 'pcb_types', icon: 'hugeicons:chip' },
  { term: 'Plate', field: 'plate_materials', icon: 'hugeicons:layers-02' },
  { term: 'Weight', field: 'weight_materials', icon: 'hugeicons:weight-scale' },
] as const

/** A list spec as text, or null when empty. */
export const joinSpecList = (value: unknown) =>
  Array.isArray(value) ? value.join(', ') || null : (value as string) || null

/** A list spec as a spec list item's text and its `values`, which the list
 * shows as choices when there are several (a PCB, plate, or layout to pick). */
export const listSpec = (value: unknown) => ({
  description: joinSpecList(value),
  values: Array.isArray(value) ? (value as string[]) : undefined,
})

const hasValue = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : value != null && value !== ''

/**
 * A variant's specs: each one its own when set, else its release's (a spec is
 * set once and the level below leaves it empty to inherit). A price of its
 * own is read in its own currency when it has one, else in the release's.
 * `custom` is whether the variant overrides the price or a material; a year
 * of its own is not a spec of its build.
 */
export const resolveVariantSpecs = (variant: Variant, release: Release) => {
  const own = (field: string) => hasValue(variant[field])
  const pick = (field: string) => (own(field) ? variant[field] : release[field])

  return {
    year: (pick('release_year') as number | null) ?? null,
    price: own('msrp_price')
      ? formatPrice(variant.msrp_price, variant.currency || release.currency, {
          stripZeros: true,
        })
      : formatPrice(release.msrp_price, release.currency, { stripZeros: true }),
    materials: Object.fromEntries(
      KEYBOARD_MATERIAL_SPECS.map(({ field }) => [field, pick(field)]),
    ) as Record<
      (typeof KEYBOARD_MATERIAL_SPECS)[number]['field'],
      string[] | null | undefined
    >,
    custom:
      own('msrp_price') ||
      KEYBOARD_MATERIAL_SPECS.some(({ field }) => own(field)),
  }
}

/** The layouts a release was sold in: its own subset, else all of its
 * keyboard's. Only some form factors have them. */
export const releaseTopCaseStyles = (
  release: Release,
  keyboard: { form_factor?: string | null; top_case_styles?: string[] | null },
) =>
  keyboardTopCaseStylesEnabled.includes(keyboard.form_factor || '')
    ? ((hasValue(release.top_case_styles)
        ? release.top_case_styles
        : keyboard.top_case_styles) as string[] | null | undefined)
    : null

/** A release's specs as spec list items, leaving out unset ones. Its layouts
 * show only when it narrows its keyboard's, which the page header lists. */
export const releaseSpecItems = (
  release: Release,
  keyboard: { form_factor?: string | null },
) =>
  [
    {
      term: 'Top Case',
      ...listSpec(
        keyboardTopCaseStylesEnabled.includes(keyboard.form_factor || '')
          ? release.top_case_styles
          : null,
      ),
      icon: 'hugeicons:layout-top',
    },
    ...KEYBOARD_MATERIAL_SPECS.map(({ term, field, icon }) => ({
      term,
      ...listSpec(release[field]),
      icon,
    })),
  ].filter((spec) => spec.description)

/** A keyboard's own specs, shared by every release, as spec list items;
 * unset ones keep a null description. Top case styles apply only to some
 * form factors. */
export const keyboardSpecItems = (keyboard: {
  form_factor?: string | null
  top_case_styles?: string[] | null
  mount_styles?: string[] | null
  typing_angle?: number | null
}) =>
  [
    {
      term: 'Form Factor',
      description: keyboard.form_factor,
      icon: 'hugeicons:keyboard',
    },
    keyboardTopCaseStylesEnabled.includes(keyboard.form_factor || '') && {
      term: 'Top Case',
      ...listSpec(keyboard.top_case_styles),
      icon: 'hugeicons:layout-top',
    },
    {
      term: 'Mount',
      ...listSpec(keyboard.mount_styles),
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
    values?: string[]
    icon: string
  }[]
