import slugify from 'slugify'
import { formatDate, formatPrice } from '~/utils'

/**
 * Edit suggestions: signed-in users suggest changes to published records (a
 * missing photo, a wrong date or price), and staff review them in the Edits
 * tab of `/{domain}/submissions`. Suggestions are made in the record's own
 * atomic form (`mode="embedded"`, `suggest`), so the fields stay in sync with
 * the admin forms: any column the form edits can be suggested, except the
 * keys, parent links, and system columns listed in `protected` here and in
 * `edit_suggestion_protected_fields()` of the `edit_suggestions` migration,
 * which must list the same columns.
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

export interface SuggestionEntity {
  type: SuggestionEntityType
  domain: SuggestionDomain
  table: string
  // Shown to users, e.g. in `Edit Colorway`.
  label: string
  // Name column of the record.
  nameKey: string
  // Props the record's atomic form needs besides the record itself (pages
  // may pass richer ones, e.g. option lists); forms with fields a
  // suggestion cannot change take `suggest` to hide them.
  formProps: (record: Record<string, any>) => Record<string, unknown>
  // Columns a suggestion never changes.
  protected: string[]
  // The record's own slug, built from the name as the admin form saves it,
  // so a suggested rename moves the page to its new address (the database
  // builds the page key from it). It goes back to the record's when the name
  // does.
  slugKeys?: (name: string) => Record<string, string>
}

const nameSlug = (name: string) => slugify(name, { lower: true })

// Every table: identity, timestamps, search, and moderation columns.
const SYSTEM_FIELDS = [
  'id',
  'created_at',
  'updated_at',
  'fts',
  'review_status',
  'review_note',
  'submitted_by',
  'verified_at',
  'verified_by',
]

// Columns the Google Doc sync owns besides the data it fills in.
const SYNC_FIELDS = ['deleted', 'source', 'source_document_id', 'overridden_fields']

const keyboardOf = (record: Record<string, any>) => ({
  brand_slug: record.brand_slug,
  brand_keyboard_slug: record.brand_keyboard_slug,
  releases: [],
})

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
    formProps: (record) => ({ makerId: record.maker_id, suggest: true }),
    protected: [
      'colorway_id',
      'maker_id',
      'sculpt_id',
      'maker_sculpt_id',
      'order',
      ...SYNC_FIELDS,
    ],
  },
  artisan_sculpt: {
    type: 'artisan_sculpt',
    domain: 'artisan',
    table: 'artisan_sculpts',
    label: 'Sculpt',
    nameKey: 'name',
    formProps: () => ({ isEdit: true }),
    // maker_sculpt_id and source_slug are built by the database.
    protected: [
      'maker_id',
      'maker_sculpt_id',
      'source_slug',
      ...SYNC_FIELDS,
    ],
    slugKeys: (name) => ({ sculpt_id: nameSlug(name) }),
  },
  keyset_kit: {
    type: 'keyset_kit',
    domain: 'keyset',
    table: 'keyset_kits',
    label: 'Kit',
    nameKey: 'name',
    formProps: () => ({ isEdit: true }),
    protected: ['profile_keyset_id'],
  },
  keyset: {
    type: 'keyset',
    domain: 'keyset',
    table: 'keysets',
    label: 'Keyset',
    nameKey: 'name',
    formProps: () => ({ isEdit: true, suggest: true }),
    // profile_keyset_id is built by the database from profile_id and slug.
    protected: ['profile_id', 'profile_keyset_id'],
    slugKeys: (name) => ({ slug: nameSlug(name) }),
  },
  keyboard_variant: {
    type: 'keyboard_variant',
    domain: 'keyboard',
    table: 'keyboard_variants',
    label: 'Variant',
    nameKey: 'variant_name',
    formProps: (record) => ({
      isEdit: true,
      suggest: true,
      keyboard: keyboardOf(record),
    }),
    protected: ['brand_slug', 'brand_keyboard_slug', 'release_id'],
  },
  keyboard_release: {
    type: 'keyboard_release',
    domain: 'keyboard',
    table: 'keyboard_releases',
    label: 'Release',
    nameKey: 'name',
    formProps: (record) => ({
      isEdit: true,
      suggest: true,
      keyboard: keyboardOf(record),
    }),
    protected: ['brand_slug', 'brand_keyboard_slug', 'order', 'variant_specs'],
  },
  keyboard: {
    type: 'keyboard',
    domain: 'keyboard',
    table: 'keyboards',
    label: 'Keyboard',
    nameKey: 'name',
    formProps: () => ({ isEdit: true, includeBrand: false }),
    // brand_keyboard_slug is built by the database from brand_slug and slug.
    protected: ['brand_slug', 'brand_keyboard_slug'],
    slugKeys: (name) => ({ slug: nameSlug(name) }),
  },
}

export const SUGGESTION_ENTITY_TYPES = Object.keys(
  SUGGESTION_ENTITIES,
) as SuggestionEntityType[]

export const isSuggestionEntityType = (
  value: unknown,
): value is SuggestionEntityType =>
  typeof value === 'string' && value in SUGGESTION_ENTITIES

export const isProtectedSuggestionField = (
  type: SuggestionEntityType,
  key: string,
) => SYSTEM_FIELDS.includes(key) || SUGGESTION_ENTITIES[type].protected.includes(key)

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

// Form values as they are stored: calendar dates as ISO dates, trimmed
// strings, and blanks as null.
export const normalizeSuggestionValue = (value: unknown): unknown => {
  if (value && typeof value === 'object' && 'calendar' in value) {
    return String(value)
  }
  if (typeof value === 'string') return value.trim() || null
  return isBlank(value) ? null : value
}

// Columns hold plain values or lists of them; joined rows (a keyset's kits,
// a kit's category) are never suggested.
const isColumnValue = (value: unknown) =>
  value === null ||
  typeof value !== 'object' ||
  (Array.isArray(value) && value.every((item) => typeof item !== 'object'))

/** Same value once blanks are treated alike and lists compared by items. */
export const sameSuggestionValue = (a: unknown, b: unknown) => {
  const left = normalizeSuggestionValue(a)
  const right = normalizeSuggestionValue(b)

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => item === right[index])
    )
  }

  return left === right
}

/**
 * The form model with the slug a rename moves (`slugKeys`): built from a
 * changed name, the record's own otherwise.
 */
export const withSlugKeys = (
  type: SuggestionEntityType,
  record: Record<string, any>,
  model: Record<string, any>,
) => {
  const { nameKey, slugKeys } = SUGGESTION_ENTITIES[type]
  const name = normalizeSuggestionValue(model[nameKey])

  if (!slugKeys) return model

  const keys =
    typeof name === 'string' && !sameSuggestionValue(name, record[nameKey])
      ? slugKeys(name)
      : Object.fromEntries(
          Object.keys(slugKeys('')).map((key) => [key, record[key]]),
        )

  return { ...model, ...keys }
}

/** Keys that follow the name (`slugKeys`); undoing one undoes the name. */
export const isSlugKey = (type: SuggestionEntityType, key: string) =>
  key in (SUGGESTION_ENTITIES[type].slugKeys?.('') || {})

/** The columns the form model changed, with their normalized values. */
export const suggestionDiff = (
  type: SuggestionEntityType,
  record: Record<string, any>,
  model: Record<string, any>,
) =>
  Object.fromEntries(
    Object.keys(model)
      .filter(
        (key) =>
          key in record &&
          isColumnValue(record[key]) &&
          !isProtectedSuggestionField(type, key) &&
          !sameSuggestionValue(model[key], record[key]),
      )
      .map((key) => [key, normalizeSuggestionValue(model[key])]),
  )

const FIELD_LABELS: Record<string, string> = {
  img: 'Image',
  img_front: 'Front Image',
  img_back: 'Back Image',
  qty: 'Quantity',
  url: 'URL',
  msrp_price: 'Base Price',
  ic_date: 'IC Date',
  start_date: 'GB Start',
  end_date: 'GB End',
  kit_id: 'Kit',
  pcb_types: 'PCB',
  case_materials: 'Case',
  plate_materials: 'Plate',
  weight_materials: 'Weight',
  is_revision_of: 'Revision Of',
  derived_from: 'Original Design',
  finish_type: 'Finish Type',
}

const IMAGE_FIELDS = ['img', 'img_front', 'img_back', 'order_graph', 'order_history']
const DATE_FIELDS = ['ic_date', 'start_date', 'end_date']
const PRICE_FIELDS = ['price', 'msrp_price']

export const isImageSuggestionField = (key: string) =>
  IMAGE_FIELDS.includes(key)

/** `img_front` -> `Front Image`, `units_produced` -> `Units Produced`. */
export const suggestionFieldLabel = (key: string) =>
  FIELD_LABELS[key] ||
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/** A field value for tables and diffs: `Yes`, `ABS, PBT`, `$120`, `—`. */
export const formatSuggestionValue = (
  key: string,
  value: unknown,
  values: Record<string, any> = {},
) => {
  const normalized = normalizeSuggestionValue(value)

  if (normalized === null) return '—'
  if (typeof normalized === 'boolean') return normalized ? 'Yes' : 'No'
  if (Array.isArray(normalized)) return normalized.join(', ')
  if (DATE_FIELDS.includes(key)) return formatDate(String(normalized))
  if (PRICE_FIELDS.includes(key) && typeof normalized === 'number') {
    return formatPrice(normalized, values.currency || 'USD', {
      stripZeros: true,
    })
  }
  return String(normalized)
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
