import { parseDate, type CalendarDate } from '@internationalized/date'
import { createKeysetSchema, keysetKitSchema } from '~/utils/schemas/keyset'
import { validateEach } from '~/utils/schemas/common'
import type { CandidatePayload, IngestCandidate } from '~/utils/ingest'

export interface InsertPreviewRow {
  column: string
  value?: unknown
  // Shown instead of the value, e.g. who verified it.
  display?: string
  // The value Keebdex has now, for updates.
  previous?: unknown
}

export interface InsertPreviewSection {
  title: string
  statement: string
  rows: InsertPreviewRow[]
  img?: string | null
}

const toCalendarDate = (value?: string | null) =>
  value ? parseDate(value) : undefined

// A CalendarDate from the form, or the ISO string it started from.
const asISODate = (value: unknown) =>
  value ? toISODate(value as CalendarDate) : null

const nullIfBlank = (value: unknown) => (isBlank(value) ? null : value)

// The "add as a new kit" choice of a thread kit, beside the listed kits' ids.
const NEW_KIT = 0

/**
 * State of the Approve wizard of a discovered keyset (`IngestApproveWizard`). A new keyset goes Profile -> Keyset -> Kits ->
 * Review and is written approved with no submitter, like the keysets the
 * crawler adds itself. A keyset Keebdex already has (`match_key`) skips the
 * profile: its form starts from what Keebdex has, with the thread's values in
 * the empty fields, and staff may change any of them. Kits are the ones read
 * from the thread: a kit Keebdex already lists is updated, the others added;
 * Keebdex's other kits are left alone. Staff pick which listed kit a thread
 * kit updates (a keyset may list several of one category), or add it as new. Every image comes from the thread
 * (`thread.images`). Review lists what approving writes, column by column.
 */
export const useIngestApproveWizard = (candidate: IngestCandidate) => {
  const toast = useToast()
  const { user } = storeToRefs(useUserStore())
  const { manufacturers } = useKeysetProfiles()

  const { kits: kitCategories } = useKeysetKits()

  const extracted = candidate.payload.keyset
  // A candidate with a `match_key` always updates that keyset; the approve
  // modal does not open the wizard when it could not be read (`current`).
  const matched = !!candidate.match_key
  const current = matched ? candidate.current : null

  const steps = matched
    ? ['keyset', 'kits', 'review']
    : ['profile', 'keyset', 'kits', 'review']
  const active = ref(0)
  const step = computed(() => steps[active.value])
  const isLast = computed(() => active.value === steps.length - 1)

  // Keyset ------------------------------------------------------------------

  // What Keebdex has, else what the thread says.
  const start = (field: string) =>
    current && !isBlank(current.keyset[field])
      ? current.keyset[field]
      : extracted[field]

  const profileId = ref<string>(
    (matched ? current!.keyset.profile_id : extracted.profile_id) || '',
  )

  const keyset = ref<Record<string, any>>({
    name: start('name') || '',
    designer: start('designer') || '',
    sculpt: start('sculpt') || '',
    url: start('url') || '',
    img: start('img') || '',
    description: start('description') || '',
    order_graph: start('order_graph') || '',
    order_history: start('order_history') || '',
    status: start('status') || DEFAULT_KEYSET_STATUS,
    review_status: matched ? current!.keyset.review_status : 'Approved',
    // An ISO string: KeysetForm parses it into a date when it mounts.
    ic_date: start('ic_date') || undefined,
  })

  const dateRange = ref({
    start: toCalendarDate(start('start_date')),
    end: toCalendarDate(start('end_date')),
  })

  const slug = computed(() => urlSlugify(String(keyset.value.name || '')))
  const pageKey = computed(() => `${profileId.value}/${slug.value}`)

  // The keysets row as the form holds it (review status is not the form's
  // to set here: a new keyset is approved, a matched one keeps its own).
  const keysetBody = () => {
    const { ic_date, review_status: _status, ...fields } = keyset.value

    return {
      ...fields,
      profile_id: profileId.value,
      slug: slug.value,
      ic_date: asISODate(ic_date),
      start_date: asISODate(dateRange.value.start),
      end_date: asISODate(dateRange.value.end),
    } as Record<string, any>
  }

  // Matched keyset: the fields where the thread says something else, to
  // check before changing them.
  const differences = computed(() =>
    current
      ? CANDIDATE_KEYSET_FIELDS.filter(
          (field) =>
            !isBlank(extracted[field]) &&
            String(extracted[field]) !== String(current.keyset[field] ?? ''),
        ).map((field) => ({
          field,
          current: current.keyset[field],
          forum: extracted[field],
        }))
      : [],
  )

  // The thread's images, plus the image Keebdex has now so it can be kept.
  const imagesWith = (src?: string | null) =>
    [...new Set([src, ...candidate.thread.images].filter(Boolean))] as string[]
  const coverImages = imagesWith(current?.keyset.img)

  // Columns a matched keyset's update changes. Its profile stays, and its
  // slug (its page key, which the triggers move) changes only with its name:
  // older slugs were not all made with `urlSlugify`.
  const keysetChanges = () => {
    const body = keysetBody()
    const renamed =
      String(body.name ?? '') !== String(current!.keyset.name ?? '')

    return KEYSET_INSERT_COLUMNS.filter(
      (column) =>
        !['profile_keyset_id', 'profile_id'].includes(column) &&
        (column !== 'slug' || renamed),
    )
      .filter(
        (column) =>
          String(nullIfBlank(body[column]) ?? '') !==
          String(nullIfBlank(current!.keyset[column]) ?? ''),
      )
      .map((column) => ({
        column,
        value: nullIfBlank(body[column]),
        previous: nullIfBlank(current!.keyset[column]),
      }))
  }

  // Kits ------------------------------------------------------------------

  // Keebdex's kits by row id: several may share a category (`kit_id`), and
  // older ones have none.
  const listedKits = Object.fromEntries(
    (current?.kits || []).map((kit) => [kit.id, kit]),
  ) as Record<number, Record<string, any>>

  const categoryName = (slug?: string | null) =>
    kitCategories.value.find((category) => category.slug === slug)?.name

  const listedKitItems = computed(() => [
    { label: 'Add as a new kit', value: NEW_KIT },
    ...Object.values(listedKits).map((kit) => ({
      label: kit.name || categoryName(kit.kit_id) || kit.kit_id || 'Kit',
      value: kit.id as number,
    })),
  ])

  const listedOf = (kit: Record<string, any>) =>
    kit.id ? listedKits[kit.id] : undefined
  const isListed = (kit: Record<string, any>) => !!listedOf(kit)
  const kitImages = (kit: Record<string, any>) => imagesWith(listedOf(kit)?.img)

  const {
    items: kits,
    create: createKit,
    add: addKit,
    remove: removeKit,
    toPayload,
  } = useRepeatableItems<Record<string, any>>(
    () => ({
      id: null,
      kit_id: '',
      name: '',
      img: '',
      price: null,
      qty: null,
      description: '',
      cancelled: false,
    }),
    // A matched keyset may only update its own fields.
    { min: matched ? 0 : 1 },
  )

  // The thread's kit of each card, to start again from when staff pick
  // another listed kit for it.
  const threadKits = new Map<number, Record<string, any>>()

  // A kit Keebdex lists starts from its values, the thread's in the empty
  // ones.
  const merge = (kit: Record<string, any>, listed: Record<string, any> = {}) =>
    Object.fromEntries(
      KIT_INSERT_COLUMNS.filter((column) => column !== 'profile_keyset_id')
        .map((column) => [
          column,
          isBlank(listed[column]) ? kit[column] : listed[column],
        ])
        .filter(([, value]) => value !== undefined),
    )

  // A thread kit updates the one listed kit of its category not yet taken;
  // with several (or none) staff pick it, else it is added.
  const taken = new Set<number>()
  const listedMatch = (kit: Record<string, any>) => {
    const options = Object.values(listedKits).filter(
      (listed) =>
        listed.kit_id && listed.kit_id === kit.kit_id && !taken.has(listed.id),
    )

    return options.length === 1 ? options[0] : undefined
  }

  kits.value = candidate.payload.kits.map((kit) => {
    const listed = listedMatch(kit)

    if (listed) taken.add(listed.id)

    const item = createKit({ ...merge(kit, listed), id: listed?.id ?? null })
    threadKits.set(item._key, kit)

    return item
  })

  const kitTarget = (index: number) => kits.value[index]?.id ?? NEW_KIT

  // Starts the card again from its thread kit (what staff typed, for a card
  // they added) and the listed kit it now updates.
  const setKitTarget = (index: number, id: number) => {
    const item = kits.value[index]

    if (!item) return

    const listed = id === NEW_KIT ? undefined : listedKits[id]
    const previous = listedOf(item) || {}
    const source =
      threadKits.get(item._key) ||
      Object.fromEntries(
        KIT_INSERT_COLUMNS.map((column) => [
          column,
          previous[column] === item[column] ? null : item[column],
        ]),
      )
    const fields = Object.fromEntries(
      KIT_INSERT_COLUMNS.filter((column) => column !== 'profile_keyset_id').map(
        (column) => [
          column,
          (isBlank(listed?.[column]) ? source[column] : listed![column]) ??
            (column === 'cancelled' ? false : null),
        ],
      ),
    )

    kits.value[index] = { ...item, ...fields, id: listed ? id : null }
  }

  if (!matched && !kits.value.length) {
    kits.value = [createKit({ kit_id: 'base', img: extracted.img || '' })]
  }

  // Validation ------------------------------------------------------------

  const fail = (message: string) => {
    toast.add(validationToast(message))
    return false
  }

  const validators: Record<string, () => boolean> = {
    profile: () =>
      manufacturers.value[profileId.value]
        ? true
        : fail('Select the profile of this keyset.'),
    keyset: () => {
      const result = createKeysetSchema(manufacturers).safeParse(keysetBody())

      if (!result.success) return fail(result.error.issues[0]!.message)

      return keyset.value.img ? true : fail('Pick a cover image.')
    },
    kits: () => {
      if (!matched && !kits.value.length) return fail('Add at least one kit.')

      const result = validateEach(keysetKitSchema, kits.value)

      if (!result.success) {
        return fail(result.error?.issues[0]?.message || 'Check the kits.')
      }

      if (kits.value.some((kit) => !kit.kit_id)) {
        return fail('Pick the kit of every card.')
      }

      // Kits of one category differ by name ("Black Base", "Beige Base").
      const names = kits.value.map(
        (kit) => `${kit.kit_id}:${String(kit.name || '').toLowerCase()}`,
      )
      if (new Set(names).size !== names.length) {
        return fail('Each kit can be added only once.')
      }

      const targets = kits.value.map((kit) => kit.id).filter(Boolean)
      if (new Set(targets).size !== targets.length) {
        return fail('Each listed kit can be updated by one card only.')
      }

      if (matched && !kits.value.length && !keysetChanges().length) {
        return fail(
          'Nothing changes: edit the keyset or add a kit, or dismiss.',
        )
      }

      return true
    },
  }

  const next = () => {
    if (validators[step.value!]?.() === false) return
    active.value = Math.min(active.value + 1, steps.length - 1)
  }

  const back = () => {
    active.value = Math.max(active.value - 1, 0)
  }

  // What approving writes ---------------------------------------------------

  const reviewer = computed(() => user.value?.name || 'You')

  const moderationRows = (): InsertPreviewRow[] => [
    { column: 'review_status', value: 'Approved' },
    { column: 'verified_by', display: reviewer.value },
    { column: 'verified_at', display: 'When you approve' },
    { column: 'submitted_by', value: null },
  ]

  const kitSections = (): InsertPreviewSection[] =>
    kits.value.map((kit) => {
      const value = (column: string) =>
        column === 'profile_keyset_id'
          ? pageKey.value
          : column === 'cancelled'
            ? !!kit.cancelled
            : nullIfBlank(kit[column])
      const listed = listedOf(kit)

      return listed
        ? {
            title: kit.name || kit.kit_id,
            statement: `update keyset_kits where id = ${listed.id}`,
            img: kit.img,
            rows: KIT_INSERT_COLUMNS.filter(
              (column) =>
                column !== 'profile_keyset_id' &&
                String(value(column) ?? '') !==
                  String(
                    nullIfBlank(listed[column]) ??
                      (column === 'cancelled' ? false : ''),
                  ),
            ).map((column) => ({
              column,
              value: value(column),
              previous: nullIfBlank(listed[column]),
            })),
          }
        : {
            title: kit.name || kit.kit_id,
            statement: 'insert into keyset_kits',
            img: kit.img,
            rows: [
              ...KIT_INSERT_COLUMNS.map((column) => ({
                column,
                value: value(column),
              })),
              ...moderationRows(),
            ],
          }
    })

  const sections = computed<InsertPreviewSection[]>(() => {
    const keysetSection: InsertPreviewSection = matched
      ? {
          title: candidate.match_key!,
          statement: `update keysets where profile_keyset_id = '${candidate.match_key}'`,
          img: keyset.value.img,
          rows: keysetChanges(),
        }
      : {
          title: [manufacturers.value[profileId.value], keyset.value.name]
            .filter(Boolean)
            .join(' '),
          statement: 'insert into keysets',
          img: keyset.value.img,
          rows: [
            ...KEYSET_INSERT_COLUMNS.map((column) => ({
              column,
              value:
                column === 'profile_keyset_id'
                  ? pageKey.value
                  : nullIfBlank(keysetBody()[column]),
            })),
            ...moderationRows(),
          ],
        }

    return [
      keysetSection,
      ...kitSections(),
      {
        title: `Candidate #${candidate.id}`,
        statement: 'update ingest.candidates',
        rows: [
          { column: 'state', value: 'promoted' },
          { column: 'promoted_kind', value: 'keyset' },
          {
            column: 'promoted_id',
            display: matched
              ? `id of ${candidate.match_key}`
              : 'id of the new keyset',
          },
          { column: 'reviewed_by', display: reviewer.value },
          { column: 'reviewed_at', display: 'When you approve' },
        ],
      },
    ]
  })

  // Blank fields are sent as null, as the Review step shows them.
  const nullBlanks = (fields: Record<string, any>) =>
    Object.fromEntries(
      Object.entries(fields).map(([column, value]) => [
        column,
        nullIfBlank(value),
      ]),
    )

  const payload = (): CandidatePayload => ({
    keyset: matched
      ? Object.fromEntries(
          keysetChanges().map(({ column, value }) => [column, value]),
        )
      : nullBlanks(keysetBody()),
    // The kit form keeps a page key of its own route; the server sets it.
    // `id` is the listed kit a card updates; new kits have none.
    kits: kits.value.map((kit) => {
      const { profile_keyset_id: _key, id, ...fields } = toPayload(kit)
      const row = { ...nullBlanks(fields), cancelled: !!fields.cancelled }

      return id ? { id, ...row } : row
    }),
  })

  return {
    matched,
    current,
    steps,
    active,
    step,
    isLast,
    next,
    back,
    profileId,
    keyset,
    dateRange,
    pageKey,
    differences,
    coverImages,
    kits,
    isListed,
    kitImages,
    listedKitItems,
    kitTarget,
    setKitTarget,
    addKit,
    removeKit,
    sections,
    payload,
  }
}
