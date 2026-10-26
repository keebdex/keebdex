import { formatDate } from '~/utils/date'
import { formatPrice } from '~/utils'
import { urlSlugify } from '~/utils/slug'
import type { KeebModule } from '~/utils/keeb-modules'

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
  | 'artisan_maker'
  | 'keyset_kit'
  | 'keyset'
  | 'keyset_profile'
  | 'keyboard_variant'
  | 'keyboard_release'
  | 'keyboard'
  | 'keyboard_brand'

/**
 * Records that are a page themselves (maker, sculpt, profile, keyset, brand,
 * keyboard) rather than a child of one.
 */
export const PAGE_ENTITY_TYPES: SuggestionEntityType[] = [
  'artisan_maker',
  'artisan_sculpt',
  'keyset_profile',
  'keyset',
  'keyboard_brand',
  'keyboard',
]

/** Pages above the sculpt, keyset, and keyboard pages, each its own key. */
export const OWNER_ENTITY_TYPES: SuggestionEntityType[] = [
  'artisan_maker',
  'keyset_profile',
  'keyboard_brand',
]

export interface SuggestionEntity {
  type: SuggestionEntityType
  domain: KeebModule
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

const nameSlug = (name: string) => urlSlugify(name)

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
  artisan_maker: {
    type: 'artisan_maker',
    domain: 'artisan',
    table: 'artisan_makers',
    label: 'Maker',
    nameKey: 'name',
    formProps: () => ({ isEdit: true, suggest: true }),
    // maker_id is the maker's page key and staff assignment; the rest are
    // the Google Doc settings and flags staff set.
    protected: [
      'maker_id',
      'verified',
      'deleted',
      'document_ids',
      'contributors',
      'disable_google_sync',
      'invertible_logo',
    ],
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
  keyset_profile: {
    type: 'keyset_profile',
    domain: 'keyset',
    table: 'keyset_profiles',
    label: 'Profile',
    nameKey: 'name',
    formProps: () => ({}),
    protected: ['profile_id'],
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
  keyboard_brand: {
    type: 'keyboard_brand',
    domain: 'keyboard',
    table: 'keyboard_brands',
    label: 'Brand',
    nameKey: 'name',
    formProps: () => ({ isEdit: true }),
    // slug is the brand's page key and staff assignment.
    protected: ['slug', 'invertible_logo'],
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

/**
 * Fields that are not columns of the record: a keyset's colors, rows of
 * `keyset_colors`. The record and its form hold them as color ids sorted
 * ascending; a suggestion holds the colors to add and remove
 * (`ColorsChange`), never the whole list, so approving it never drops colors
 * added since.
 */
export const isVirtualSuggestionField = (type: SuggestionEntityType, key: string) =>
  type === 'keyset' && key === 'colors'

export interface ColorsChange {
  add: number[]
  remove: number[]
}

const colorCount = (count: number) =>
  `${count} ${count === 1 ? 'color' : 'colors'}`

/** Ids without duplicates, sorted ascending, as color lists are compared. */
export const sortedIds = (ids: number[]) =>
  [...new Set(ids)].sort((a, b) => a - b)

export const isColorsChange = (value: unknown): value is ColorsChange =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  ('add' in value || 'remove' in value)

/** The colors to add and remove to go from `current` to `next`. */
export const colorsChange = (current: number[], next: number[]): ColorsChange => ({
  add: sortedIds(next.filter((id) => !current.includes(id))),
  remove: sortedIds(current.filter((id) => !next.includes(id))),
})

/** `current` with a change applied, as approving it would leave the keyset. */
export const colorsAfter = (current: number[], change: Partial<ColorsChange>) =>
  sortedIds([
    ...current.filter((id) => !change.remove?.includes(id)),
    ...(change.add || []),
  ])

const colorIdOf = (color: unknown) =>
  color && typeof color === 'object'
    ? Number((color as { color_id?: number; id?: number }).color_id ?? (color as { id?: number }).id)
    : Number(color)

/**
 * The record as suggestions compare it: a keyset's colors (rows of
 * `keyset_colors`, as the keyset page loads them) as sorted color ids.
 */
export const suggestionRecord = (
  type: SuggestionEntityType,
  record: Record<string, any>,
) =>
  type === 'keyset' && Array.isArray(record.colors)
    ? { ...record, colors: sortedIds(record.colors.map(colorIdOf)) }
    : record

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

/**
 * The columns the form model changed, with their normalized values; a
 * keyset's colors as the colors to add and remove.
 */
export const suggestionDiff = (
  type: SuggestionEntityType,
  record: Record<string, any>,
  model: Record<string, any>,
) =>
  Object.fromEntries(
    Object.keys(model).flatMap((key) => {
      if (isVirtualSuggestionField(type, key)) {
        const change = colorsChange(record[key] || [], model[key] || [])

        return change.add.length || change.remove.length ? [[key, change]] : []
      }

      return key in record &&
        isColumnValue(record[key]) &&
        !isProtectedSuggestionField(type, key) &&
        !sameSuggestionValue(model[key], record[key])
        ? [[key, normalizeSuggestionValue(model[key])]]
        : []
    }),
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
  'colors:add': 'Colors to Add',
  'colors:remove': 'Colors to Remove',
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
  if (isColorsChange(value)) {
    return [
      value.add?.length && `Add ${colorCount(value.add.length)}`,
      value.remove?.length && `Remove ${colorCount(value.remove.length)}`,
    ]
      .filter(Boolean)
      .join(', ')
  }

  if (key === 'colors' && Array.isArray(value)) {
    return value.length ? colorCount(value.length) : '—'
  }

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
