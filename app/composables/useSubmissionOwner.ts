import type { Ref } from 'vue'
import { makerSchema } from '~/utils/schemas/artisan'
import { keysetProfileSchema } from '~/utils/schemas/keyset'
import { brandSchema } from '~/utils/schemas/keyboard'
import { entitySelectionSchema } from '~/utils/schemas/common'
import type { KeebModule } from '~/utils/keeb-modules'

type Option = { label?: string; value?: string; type?: string }

// Per module: the owner's label, where its options and record come from,
// where it is saved, and how its key is built from the form.
const OWNERS = {
  artisan: {
    label: 'Maker',
    list: '/api/makers',
    options: (rows: any[]): Option[] =>
      rows.map((row) => ({ label: row.name, value: row.maker_id })),
    detail: async (key: string) => $fetch<any>(`/api/makers/${key}`),
    save: (key: string) => `/api/makers/${key}`,
    keyOf: (draft: Record<string, any>) =>
      String(draft.maker_id || '').trim() || urlSlugify(draft.name || ''),
    fields: [
      'name',
      'country_origin',
      'founded',
      'website',
      'instagram',
      'discord',
      'artisancollector',
      'bio',
    ],
    schema: makerSchema,
    draft: () => ({ name: '', document_ids: [] }),
  },
  keyset: {
    label: 'Profile',
    list: '/api/keysets/profiles',
    // Grouped by keycap profile, like the catalog.
    options: (data: any): Option[] =>
      Object.entries(
        (data?.groupedProfiles || {}) as Record<string, Record<string, string>>,
      )
        .map(([label, profiles]) => [
          { type: 'label', label },
          ...Object.entries(profiles).map(([value, name]) => ({
            label: name,
            value,
          })),
          { type: 'separator' },
        ])
        .flat()
        .slice(0, -1),
    detail: async (key: string) =>
      (
        await $fetch<any>('/api/keysets', {
          query: { profile_id: key, size: 1 },
        })
      )?.profile,
    save: (key: string) => `/api/profiles/${key}`,
    keyOf: (draft: Record<string, any>) => urlSlugify(draft.name || ''),
    fields: ['name', 'profile', 'manufacturer', 'manufacturer_id', 'description'],
    schema: keysetProfileSchema,
    draft: () => ({ name: '', profile: null }),
  },
  keyboard: {
    label: 'Brand',
    list: '/api/keyboards/brands',
    options: (rows: any[]): Option[] =>
      rows.map((row) => ({ label: row.name, value: row.slug })),
    detail: async (key: string) => $fetch<any>(`/api/keyboards/brands/${key}`),
    save: (key: string) => `/api/keyboards/brands/${key}`,
    keyOf: (draft: Record<string, any>) =>
      String(draft.slug || '').trim() || urlSlugify(draft.name || ''),
    fields: ['name', 'country_origin', 'website', 'instagram', 'discord', 'bio'],
    schema: brandSchema,
    draft: () => ({ name: '' }),
  },
} satisfies Record<KeebModule, unknown>

/**
 * The first step of a submission wizard: the maker, profile, or brand. In
 * create mode it is an existing one (`selected.id`, picked from the published
 * ones plus the caller's own proposals) or a new one (`draft`, the module's
 * own form), created first on submit by `ensure()`, Pending for everyone but
 * its staff. In review mode it is locked once published, and while still
 * under review (`reviewStatus`) its form is shown again and `save()` writes it
 * before the rest.
 */
export const useSubmissionOwner = (
  domain: KeebModule,
  selected: Ref<{ id: string }>,
) => {
  const config = OWNERS[domain]

  const ownerMode = ref<'existing' | 'new'>('existing')
  const draft = ref<Record<string, any>>(config.draft())
  const reviewStatus = ref<string | null>(null)

  const isNew = computed(() => ownerMode.value === 'new')
  // The key a new owner gets, shown in the stepper and used once created.
  const draftKey = computed(() => config.keyOf(draft.value))
  const key = computed(() => (isNew.value ? draftKey.value : selected.value.id))

  const { data, status } = useAsyncData<any>(
    `submission-owners-${domain}`,
    () => $fetch(config.list, { query: { own: 1 } }),
    { default: () => null },
  )

  const options = computed(() => (data.value ? config.options(data.value) : []))
  const label = computed(() =>
    isNew.value
      ? draft.value.name
      : options.value.find((option) => option.value === selected.value.id)
          ?.label,
  )

  const canAdvance = computed(() =>
    isNew.value ? !!draft.value.name?.trim() : !!selected.value.id,
  )

  const validate = () =>
    isNew.value
      ? config.schema.safeParse(draft.value)
      : entitySelectionSchema.safeParse(selected.value)

  const payload = () => pickKeys(draft.value, config.fields)

  /** The owner's key, creating the proposed owner first. */
  const ensure = async () => {
    if (!isNew.value) return selected.value.id

    const ownerKey = draftKey.value

    await $fetch(config.save(ownerKey), { method: 'post', body: payload() })

    return ownerKey
  }

  /** Review: shows an owner still under review as its form. */
  const load = async (ownerKey: string, ownerStatus?: string | null) => {
    selected.value = { id: ownerKey }

    if (!['Pending', 'Rejected'].includes(ownerStatus || '')) return

    try {
      const record = await config.detail(ownerKey)

      Object.assign(draft.value, pickKeys(record, config.fields))
      reviewStatus.value = ownerStatus!
      ownerMode.value = 'new'
    } catch {
      // Falls back to the locked select.
    }
  }

  /** Review: saves an owner still under review, before the rest. */
  const save = async () => {
    if (!reviewStatus.value) return

    await $fetch(config.save(selected.value.id), {
      method: 'post',
      body: payload(),
    })
  }

  return {
    label: config.label,
    ownerMode,
    draft,
    draftKey,
    key,
    isNew,
    reviewStatus,
    options,
    status,
    optionLabel: label,
    canAdvance,
    validate,
    ensure,
    load,
    save,
  }
}
