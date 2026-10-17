import { Constants } from '~/types/database.types'
import { formatDate, formatPrice } from '~/utils'
import { artisanStems } from '~/utils/schemas/artisan'

/**
 * Edit suggestions: signed-in users suggest changes to published records
 * (a missing photo, a wrong date or price), and staff review them in the Edits
 * tab of `/{domain}/submissions`. This registry lists the records that take
 * suggestions and the fields users may change, with how each field is edited
 * and shown. The database whitelist, `edit_suggestion_fields()` in the
 * `edit_suggestions` migration, must list the same keys.
 */

export type SuggestionEntityType =
  | 'artisan_colorway'
  | 'artisan_sculpt'
  | 'keyset_kit'
  | 'keyset'
  | 'keyboard_variant'
  | 'keyboard_release'
  | 'keyboard'

export type SuggestionDomain = 'artisan' | 'keyset' | 'keyboard'

export type SuggestionFieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'image'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'

export interface SuggestionField {
  key: string
  label: string
  type: SuggestionFieldType
  // The column is not nullable.
  required?: boolean
  options?: readonly string[]
  // Numbers shown as prices use the record's currency.
  price?: boolean
  help?: string
}

export interface SuggestionEntity {
  type: SuggestionEntityType
  domain: SuggestionDomain
  table: string
  // Shown to users, e.g. in `Suggest an Edit to Colorway`.
  label: string
  // Name column of the record.
  nameKey: string
  fields: SuggestionField[]
}

const { Enums } = Constants.public

const currency: SuggestionField = {
  key: 'currency',
  label: 'Currency',
  type: 'select',
  options: Enums.currency,
}

const keyboardSpecs: SuggestionField[] = [
  currency,
  { key: 'msrp_price', label: 'MSRP', type: 'number', price: true },
  { key: 'release_year', label: 'Release Year', type: 'number' },
  {
    key: 'case_materials',
    label: 'Case Materials',
    type: 'multiselect',
    options: Enums.keyboard_material,
  },
  {
    key: 'plate_materials',
    label: 'Plate Materials',
    type: 'multiselect',
    options: Enums.keyboard_material,
  },
  {
    key: 'weight_materials',
    label: 'Weight Materials',
    type: 'multiselect',
    options: Enums.keyboard_material,
  },
  {
    key: 'pcb_types',
    label: 'PCB Types',
    type: 'multiselect',
    options: Enums.keyboard_pcb_type,
  },
]

export const SUGGESTION_ENTITIES: Record<
  SuggestionEntityType,
  SuggestionEntity
> = {
  artisan_colorway: {
    type: 'artisan_colorway',
    domain: 'artisan',
    table: 'artisan_colorways',
    label: 'Colorway',
    nameKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      {
        key: 'img',
        label: 'Image',
        type: 'image',
        help: 'A square photo focused on the keycap works best.',
      },
      { key: 'photo_credit', label: 'Photo Credit', type: 'text' },
      { key: 'release', label: 'Release', type: 'text' },
      {
        key: 'sale_type',
        label: 'Sale Type',
        type: 'select',
        options: Enums.sale_format,
      },
      currency,
      { key: 'price', label: 'Price', type: 'number', price: true },
      { key: 'qty', label: 'Quantity', type: 'number' },
      {
        key: 'stem',
        label: 'Stem',
        type: 'multiselect',
        options: artisanStems,
      },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  artisan_sculpt: {
    type: 'artisan_sculpt',
    domain: 'artisan',
    table: 'artisan_sculpts',
    label: 'Sculpt',
    nameKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'img', label: 'Image', type: 'image' },
      { key: 'release', label: 'Release', type: 'text' },
      {
        key: 'profile',
        label: 'Profile',
        type: 'select',
        options: ['sculpted', 'blank'],
      },
      { key: 'cast', label: 'Cast', type: 'select', options: ['resin', 'mixed'] },
      {
        key: 'design',
        label: 'Design',
        type: 'select',
        options: ['physical', 'digital', 'hybrid'],
      },
      { key: 'story', label: 'Story', type: 'textarea' },
    ],
  },
  keyset_kit: {
    type: 'keyset_kit',
    domain: 'keyset',
    table: 'keyset_kits',
    label: 'Kit',
    nameKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'img', label: 'Image', type: 'image', required: true },
      { key: 'price', label: 'Price', type: 'number', price: true },
      { key: 'qty', label: 'Quantity', type: 'number' },
      { key: 'cancelled', label: 'Cancelled', type: 'boolean', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  keyset: {
    type: 'keyset',
    domain: 'keyset',
    table: 'keysets',
    label: 'Keyset',
    nameKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'img', label: 'Cover Image', type: 'image' },
      { key: 'designer', label: 'Designer', type: 'text' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: Enums.keyset_status,
      },
      { key: 'ic_date', label: 'IC Date', type: 'date' },
      { key: 'start_date', label: 'GB Start', type: 'date' },
      { key: 'end_date', label: 'GB End', type: 'date' },
      {
        key: 'url',
        label: 'Link',
        type: 'url',
        help: 'The Geekhack thread or the vendor page.',
      },
      { key: 'order_graph', label: 'Order Graph', type: 'image' },
      { key: 'order_history', label: 'Order History', type: 'image' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  keyboard_variant: {
    type: 'keyboard_variant',
    domain: 'keyboard',
    table: 'keyboard_variants',
    label: 'Variant',
    nameKey: 'variant_name',
    fields: [
      { key: 'variant_name', label: 'Name', type: 'text', required: true },
      { key: 'img_front', label: 'Front Image', type: 'image' },
      { key: 'img_back', label: 'Back Image', type: 'image' },
      { key: 'photo_credit', label: 'Photo Credit', type: 'text' },
      {
        key: 'finish_type',
        label: 'Finish',
        type: 'select',
        options: Enums.keyboard_finish_type,
        required: true,
      },
      {
        key: 'sale_type',
        label: 'Sale Type',
        type: 'select',
        options: Enums.sale_format,
      },
      { key: 'units_produced', label: 'Units Produced', type: 'number' },
      ...keyboardSpecs,
    ],
  },
  keyboard_release: {
    type: 'keyboard_release',
    domain: 'keyboard',
    table: 'keyboard_releases',
    label: 'Release',
    nameKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      ...keyboardSpecs,
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  keyboard: {
    type: 'keyboard',
    domain: 'keyboard',
    table: 'keyboards',
    label: 'Keyboard',
    nameKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      {
        key: 'form_factor',
        label: 'Form Factor',
        type: 'select',
        options: Enums.keyboard_form_factor,
        required: true,
      },
      {
        key: 'top_case_styles',
        label: 'Top Case Styles',
        type: 'multiselect',
        options: Enums.keyboard_top_case_style,
      },
      {
        key: 'mount_styles',
        label: 'Mount Styles',
        type: 'multiselect',
        options: Enums.keyboard_mounting_style,
      },
      { key: 'typing_angle', label: 'Typing Angle', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
}

export const SUGGESTION_ENTITY_TYPES = Object.keys(
  SUGGESTION_ENTITIES,
) as SuggestionEntityType[]

export const isSuggestionEntityType = (
  value: unknown,
): value is SuggestionEntityType =>
  typeof value === 'string' && value in SUGGESTION_ENTITIES

export const suggestionField = (type: SuggestionEntityType, key: string) =>
  SUGGESTION_ENTITIES[type].fields.find((field) => field.key === key)

/** Published records take suggestions; the rest are still under review. */
export const isSuggestable = (record?: { review_status?: string | null }) =>
  !!record &&
  (!record.review_status || record.review_status === 'Approved') &&
  !(record as { deleted?: boolean }).deleted

const isBlank = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && !value.length)

/** Same value once blanks are treated alike and arrays compared by items. */
export const sameSuggestionValue = (a: unknown, b: unknown) => {
  if (isBlank(a) && isBlank(b)) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index])
  }
  return a === b
}

/** The fields of `draft` that differ from `record`. */
export const suggestionDiff = (
  type: SuggestionEntityType,
  record: Record<string, any>,
  draft: Record<string, any>,
) =>
  Object.fromEntries(
    SUGGESTION_ENTITIES[type].fields
      .filter(({ key }) => !sameSuggestionValue(draft[key], record[key]))
      .map(({ key }) => [key, draft[key]]),
  )

/** A field value for tables and diffs: `Yes`, `ABS, PBT`, `$120`, `—`. */
export const formatSuggestionValue = (
  field: SuggestionField | undefined,
  value: unknown,
  values: Record<string, any> = {},
) => {
  if (isBlank(value)) return '—'
  if (field?.type === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (field?.type === 'date') return formatDate(String(value))
  if (field?.price && typeof value === 'number') {
    return formatPrice(value, values.currency || 'USD', { stripZeros: true })
  }
  return String(value)
}

/** Detail page of a suggested record, from its parent key. */
export const suggestionRecordPath = (
  type: SuggestionEntityType,
  parentKey: string,
  record: Record<string, any> = {},
) => {
  const { domain } = SUGGESTION_ENTITIES[type]

  if (domain === 'artisan') {
    return type === 'artisan_colorway' && record.colorway_id
      ? `/artisan/maker/${parentKey}?cid=${record.colorway_id}`
      : `/artisan/maker/${parentKey}`
  }

  return domain === 'keyset'
    ? `/keyset/${parentKey}`
    : `/keyboard/brand/${parentKey}`
}

export interface SuggestionUploadTarget {
  category: SuggestionDomain
  assignment: string
}

// Image uploads go to the module's category; the assignment only names the
// page the image belongs to.
export const suggestionUploadTarget = (
  type: SuggestionEntityType,
  record: Record<string, any>,
): SuggestionUploadTarget => {
  const { domain } = SUGGESTION_ENTITIES[type]

  return {
    category: domain,
    assignment: String(
      (domain === 'artisan'
        ? record.maker_id
        : domain === 'keyset'
          ? record.profile_keyset_id
          : record.brand_slug) || domain,
    ),
  }
}
