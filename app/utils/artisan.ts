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
      icon: 'solar:keyboard-line-duotone',
    },
    {
      term: 'Cast',
      description: optionLabel(artisanSculptCasts, sculpt.cast),
      icon: 'solar:test-tube-line-duotone',
    },
    {
      term: 'Design',
      description: optionLabel(artisanSculptDesigns, sculpt.design),
      icon: 'solar:paint-brush-line-duotone',
    },
    {
      term: 'Release',
      description: sculpt.release,
      icon: 'solar:calendar-line-duotone',
    },
    {
      term: 'Collection',
      description: sculpt.collection,
      icon: 'solar:library-line-duotone',
    },
  ].filter((spec) => spec.description)

/** A colorway's specs as spec list items; unset ones stay, shown as a dash,
 * so every colorway lists the same specs. `credit: false` leaves out the
 * photo credit, which describes the photo rather than the colorway. */
export const colorwaySpecItems = (colorway: Row, { credit = true } = {}) => [
  {
    term: 'Release',
    description: colorway.release,
    icon: 'solar:calendar-line-duotone',
  },
  {
    term: 'Sale Type',
    description: colorway.sale_type,
    icon: 'solar:tag-line-duotone',
  },
  {
    term: 'Price',
    description: formatPrice(colorway.price, colorway.currency, {
      stripZeros: true,
    }),
    icon: 'solar:banknote-line-duotone',
  },
  {
    term: 'Units',
    description: formatNumber(colorway.qty),
    icon: 'solar:box-line-duotone',
  },
  {
    term: 'Stem',
    description: joinSpecList(colorway.stem),
    icon: 'solar:keyboard-line-duotone',
  },
  ...(credit
    ? [
        {
          term: 'Photo Credit',
          description: colorway.photo_credit,
          icon: 'solar:camera-line-duotone',
        },
      ]
    : []),
]

/** A colorway's sculpt and maker, for a line under its name: `Sculpt · Maker`. */
export const colorwayCaption = (colorway: Row) =>
  [colorway.sculpt?.name, colorway.maker?.name].filter(Boolean).join(' · ')
