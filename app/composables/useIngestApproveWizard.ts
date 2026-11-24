import { parseDate, type CalendarDate } from '@internationalized/date'
import { createKeysetSchema, keysetKitSchema } from '~/utils/schemas/keyset'
import { validateEach } from '~/utils/schemas/common'
import type { CandidatePayload, IngestCandidate } from '~/utils/ingest'

export interface InsertPreviewRow {
  column: string
  value?: unknown
  // Shown instead of the value, e.g. who verified it.
  display?: string
}

export interface InsertPreviewSection {
  title: string
  statement: string
  rows: InsertPreviewRow[]
  img?: string | null
}

const toCalendarDate = (value?: string | null) =>
  value ? parseDate(value) : undefined

const asISODate = (value: unknown) =>
  value ? toISODate(value as CalendarDate) : null

const nullIfBlank = (value: unknown) => (isBlank(value) ? null : value)

/**
 * State of the Approve wizard of a forum review candidate
 * (`IngestApproveWizard`). A new keyset goes Profile -> Keyset -> Kits ->
 * Review and is written approved with no submitter, like the keysets the
 * crawler adds itself. A keyset Keebdex already has (`match_key`) skips the
 * profile: Keyset picks which of its empty fields to fill and Kits which kits
 * to add. Every image comes from the thread (`thread.images`). Review lists
 * what approving writes, column by column.
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

  // New keyset ------------------------------------------------------------

  const profileId = ref<string>(extracted.profile_id || '')

  const keyset = ref<Record<string, any>>({
    name: extracted.name || '',
    designer: extracted.designer || '',
    sculpt: extracted.sculpt || '',
    url: extracted.url || '',
    img: extracted.img || '',
    description: extracted.description || '',
    status: extracted.status || DEFAULT_KEYSET_STATUS,
    review_status: 'Approved',
    ic_date: toCalendarDate(extracted.ic_date),
  })

  const dateRange = ref({
    start: toCalendarDate(extracted.start_date),
    end: toCalendarDate(extracted.end_date),
  })

  const slug = computed(() => urlSlugify(String(keyset.value.name || '')))
  const pageKey = computed(() =>
    matched ? candidate.match_key! : `${profileId.value}/${slug.value}`,
  )

  // The keysets row of a new keyset, as the form holds it.
  const keysetBody = () => {
    const { ic_date, review_status: _status, ...fields } = keyset.value

    return {
      ...fields,
      profile_id: profileId.value,
      slug: slug.value,
      ic_date: asISODate(ic_date),
      start_date: asISODate(dateRange.value.start),
      end_date: asISODate(dateRange.value.end),
    }
  }

  // Matched keyset: the empty fields to fill ------------------------------

  const fill = candidateFill(candidate)
  const fillValues = ref<Record<string, any>>({ ...fill.fields })
  const pickedFields = ref<Record<string, boolean>>(
    Object.fromEntries(Object.keys(fill.fields).map((field) => [field, true])),
  )
  // Keebdex has no cover yet: staff pick it from the thread like a new one.
  const needsCover = matched && isBlank(current!.keyset.img)
  if (needsCover) fillValues.value.img ??= extracted.img || ''

  const fillRows = computed(() =>
    CANDIDATE_KEYSET_FIELDS.filter(
      (field) =>
        field !== 'img' &&
        (field in fill.fields || !isBlank(current?.keyset[field])),
    ).map((field) => ({
      field,
      current: current?.keyset[field],
      forum: fill.fields[field],
      fillable: field in fill.fields,
    })),
  )

  const filledFields = () =>
    Object.fromEntries(
      Object.entries(fillValues.value).filter(
        ([field, value]) =>
          !isBlank(value) && (field === 'img' || pickedFields.value[field]),
      ),
    )

  // Kits ------------------------------------------------------------------

  const listedKits = new Set(current?.kits.map((kit) => kit.kit_id) || [])

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

  kits.value = (matched ? fill.kits : candidate.payload.kits).map((kit) =>
    createKit({ ...kit, name: kit.name || '', img: kit.img || '' }),
  )
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
      if (matched) {
        return !needsCover || fillValues.value.img
          ? true
          : fail('Pick a cover image from the thread.')
      }

      const result = createKeysetSchema(manufacturers).safeParse(keysetBody())

      if (!result.success) return fail(result.error.issues[0]!.message)

      return keyset.value.img
        ? true
        : fail('Pick a cover image from the thread.')
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
      if (ids.some((id) => listedKits.has(id))) {
        return fail('Keebdex already lists one of these kits.')
      }
      if (matched && !ids.length && !Object.keys(filledFields()).length) {
        return fail('Nothing to fill: pick a field or add a kit, or dismiss.')
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
    kits.value.map((kit) => ({
      title: kit.name || kit.kit_id,
      statement: 'insert into keyset_kits',
      img: kit.img,
      rows: [
        ...KIT_INSERT_COLUMNS.map((column) => ({
          column,
          value:
            column === 'profile_keyset_id'
              ? pageKey.value
              : column === 'cancelled'
                ? !!kit.cancelled
                : nullIfBlank(kit[column]),
        })),
        ...moderationRows(),
      ],
    }))

  const sections = computed<InsertPreviewSection[]>(() => {
    const keysetSection: InsertPreviewSection = matched
      ? {
          title: candidate.match_key!,
          statement: `update keysets where profile_keyset_id = '${candidate.match_key}'`,
          img: fillValues.value.img || current!.keyset.img,
          rows: Object.entries(filledFields()).map(([column, value]) => ({
            column,
            value,
          })),
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
                  : nullIfBlank((keysetBody() as Record<string, any>)[column]),
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
    keyset: matched ? filledFields() : keysetBody(),
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
    fillRows,
    fillValues,
    pickedFields,
    needsCover,
    kits,
    addKit,
    removeKit,
    sections,
    payload,
  }
}
