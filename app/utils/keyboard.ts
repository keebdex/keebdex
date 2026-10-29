import { formatPrice } from '~/utils'

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
  { term: 'Case', field: 'case_materials' },
  { term: 'PCB', field: 'pcb_types' },
  { term: 'Plate', field: 'plate_materials' },
  { term: 'Weight', field: 'weight_materials' },
] as const

/** A list spec as text, or null when empty. */
export const joinSpecList = (value: unknown) =>
  Array.isArray(value) ? value.join(', ') || null : (value as string) || null

/** A release's shared price; none when each variant sets its own. */
export const releasePrice = (release: Release) =>
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
