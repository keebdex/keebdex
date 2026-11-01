import { formatNumber, formatPrice } from '~/utils'
import { joinSpecList } from '~/utils/keyboard'
import {
  artisanSculptCasts,
  artisanSculptDesigns,
  artisanSculptProfiles,
} from '~/utils/schemas/artisan'

// A sculpt or colorway row, loosely typed like the API returns it
type Row = Record<string, any>

/** A stored option value as its label (`resin` → Resin), or the value
 * itself when it is not one of the options. */
const optionLabel = (
  options: { label: string; value: string }[],
  value: string | null | undefined,
) => options.find((option) => option.value === value)?.label || value || null

/** A sculpt's specs as spec list items, leaving out unset ones (most sculpts
 * only have a few). */
export const sculptSpecItems = (sculpt: Row) =>
  [
    {
      term: 'Profile',
      description: optionLabel(artisanSculptProfiles, sculpt.profile),
      icon: 'hugeicons:keyboard',
    },
    {
      term: 'Cast',
      description: optionLabel(artisanSculptCasts, sculpt.cast),
      icon: 'hugeicons:test-tube-01',
    },
    {
      term: 'Design',
      description: optionLabel(artisanSculptDesigns, sculpt.design),
      icon: 'hugeicons:paint-brush-01',
    },
    {
      term: 'Release',
      description: sculpt.release,
      icon: 'hugeicons:calendar-03',
    },
    {
      term: 'Collection',
      description: sculpt.collection,
      icon: 'hugeicons:folder-library',
    },
  ].filter((spec) => spec.description)

/** A colorway's specs as spec list items; unset ones stay, shown as a dash,
 * so every colorway lists the same specs. */
export const colorwaySpecItems = (colorway: Row) => [
  {
    term: 'Release',
    description: colorway.release,
    icon: 'hugeicons:calendar-03',
  },
  {
    term: 'Sale Type',
    description: colorway.sale_type,
    icon: 'hugeicons:tag-01',
  },
  {
    term: 'Price',
    description: formatPrice(colorway.price, colorway.currency, {
      stripZeros: true,
    }),
    icon: 'hugeicons:money-03',
  },
  {
    term: 'Units',
    description: formatNumber(colorway.qty),
    icon: 'hugeicons:package',
  },
  {
    term: 'Stem',
    description: joinSpecList(colorway.stem),
    icon: 'hugeicons:keyboard',
  },
  {
    term: 'Photo Credit',
    description: colorway.photo_credit,
    icon: 'hugeicons:camera-01',
  },
]
