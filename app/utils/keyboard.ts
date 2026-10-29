import { formatPrice } from '~/utils'
import { keyboardTopCaseStylesEnabled } from '~/utils/schemas/keyboard'

type Priced = {
  msrp_price?: number | null
  currency?: string | null
}

type Release = Priced & {
  variant_specs?: boolean | null
  [field: string]: unknown
}

type Variant = Priced & { [field: string]: unknown }

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

/** A release's shared price; none when each variant sets its own. */
const releasePrice = (release: Release) =>
  release.variant_specs
    ? ''
    : formatPrice(release.msrp_price, release.currency, { stripZeros: true })

/** A variant's own price, else its release's. */
export const variantPrice = (variant: Variant, release: Release) =>
  variant.msrp_price
    ? formatPrice(variant.msrp_price, variant.currency, { stripZeros: true })
    : releasePrice(release)

/** A variant's own materials for a spec, else its release's. */
export const variantMaterials = (
  variant: Variant,
  release: Release,
  field: string,
) =>
  joinSpecList(
    (variant[field] as unknown[])?.length ? variant[field] : release[field],
  )

/** Whether a variant sets its own price or materials on a release whose
 * variants otherwise share them. */
export const hasCustomSpecs = (variant: Variant, release: Release) =>
  !release.variant_specs &&
  (!!variant.msrp_price ||
    KEYBOARD_MATERIAL_SPECS.some(
      ({ field }) => (variant[field] as unknown[])?.length,
    ))

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
