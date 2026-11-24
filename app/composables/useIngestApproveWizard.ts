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

/**
 * State of the Approve wizard of a forum review candidate
 * (`IngestApproveWizard`). A new keyset goes Profile -> Keyset -> Kits ->
 * Review and is written approved with no submitter, like the keysets the
 * crawler adds itself. A keyset Keebdex already has (`match_key`) skips the
 * profile: its form starts from what Keebdex has, with the thread's values in
 * the empty fields, and staff may change any of them. Kits are the ones read
 * from the thread: a kit Keebdex already lists is updated, the others added;
 * Keebdex's other kits are left alone. Every image comes from the thread
 * (`thread.images`). Review lists what approving writes, column by column.
 */
export const useIngestApproveWizard = (candidate: IngestCandidate) => {
  const toast = useToast()
  const { user } = storeToRefs(useUserStore())
  const { manufacturers } = useKeysetProfiles()

  const extracted = candidate.payload.keyset
  const current = candidate.match_key ? candidate.current : null
  const matched = !!current

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

  // Columns a matched keyset's update changes.
  const keysetChanges = () => {
    const body = keysetBody()

    return KEYSET_INSERT_COLUMNS.filter(
      (column) => column !== 'profile_keyset_id',
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

  const listedKits = Object.fromEntries(
    (current?.kits || []).map((kit) => [kit.kit_id, kit]),
  ) as Record<string, Record<string, any>>
  const isListed = (kit: Record<string, any>) => !!listedKits[kit.kit_id]
  const kitImages = (kit: Record<string, any>) =>
    imagesWith(listedKits[kit.kit_id]?.img)

  const {
    items: kits,
    create: createKit,
    add: addKit,
    remove: removeKit,
    toPayload,
  } = useRepeatableItems<Record<string, any>>(() => ({
    kit_id: '',
    name: '',
    img: '',
    price: null,
    qty: null,
    description: '',
    cancelled: false,
  }))

  // A kit Keebdex lists starts from its values, the thread's in the empty
  // ones.
  kits.value = candidate.payload.kits.map((kit) => {
    const listed = listedKits[kit.kit_id] || {}

    return createKit(
      Object.fromEntries(
        KIT_INSERT_COLUMNS.filter((column) => column !== 'profile_keyset_id')
          .map((column) => [
            column,
            isBlank(listed[column]) ? kit[column] : listed[column],
          ])
          .filter(([, value]) => value !== undefined),
      ),
    )
  })

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

      const ids = kits.value.map((kit) => kit.kit_id)

      if (ids.some((id) => !id)) return fail('Pick the kit of every card.')
      if (new Set(ids).size !== ids.length) {
        return fail('Each kit can be added only once.')
      }
      if (matched && !ids.length && !keysetChanges().length) {
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
      const listed = listedKits[kit.kit_id]

      return listed
        ? {
            title: kit.name || kit.kit_id,
            statement: `update keyset_kits where kit_id = '${kit.kit_id}'`,
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

  const payload = (): CandidatePayload => ({
    keyset: matched
      ? Object.fromEntries(
          keysetChanges().map(({ column, value }) => [column, value]),
        )
      : keysetBody(),
    // The kit form keeps a page key of its own route; the server sets it.
    kits: kits.value.map((kit) => {
      const { profile_keyset_id: _key, ...fields } = toPayload(kit)
      return fields
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
    addKit,
    removeKit,
    sections,
    payload,
  }
}
