import type { Ref } from 'vue'
import { makerSchema } from '~/utils/schemas/artisan'
import { keysetProfileSchema } from '~/utils/schemas/keyset'
import { brandSchema } from '~/utils/schemas/keyboard'
import { entitySelectionSchema } from '~/utils/schemas/common'
import type { KeebModule } from '~/utils/keeb-modules'

type Option = { label?: string; value?: string; type?: string }

// Per module: the owner's label, where its options and record come from,
// where it is saved, and its key column (the slug in its form).
const OWNERS = {
  artisan: {
    label: 'Maker',
    list: '/api/makers',
    options: (rows: any[]): Option[] =>
      rows.map((row) => ({ label: row.name, value: row.maker_id })),
    detail: async (key: string) => $fetch<any>(`/api/makers/${key}`),
    save: (key: string) => `/api/makers/${key}`,
    keyField: 'maker_id',
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
    options: (data: any): Option[] => groupedProfileItems(data?.groupedProfiles),
    detail: async (key: string) =>
      (
        await $fetch<any>('/api/keysets', {
          query: { profile_id: key, size: 1 },
        })
      )?.profile,
    save: (key: string) => `/api/profiles/${key}`,
    keyField: 'profile_id',
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
    keyField: 'slug',
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
 * before the rest. `onNew` runs when a new owner is picked, so the next step
 * (which has nothing to pick under it) can switch to new as well.
 */
export const useSubmissionOwner = (
  domain: KeebModule,
  selected: Ref<{ id: string }>,
  onNew?: () => void,
) => {
  const config = OWNERS[domain]

  const ownerMode = ref<'existing' | 'new'>('existing')
  const draft = ref<Record<string, any>>(config.draft())
  const reviewStatus = ref<string | null>(null)

  const isNew = computed(() => ownerMode.value === 'new')
  // The key a new owner gets, shown in the stepper and used once created.
  const draftKey = computed(() =>
    urlSlugify(String(draft.value[config.keyField] || '').trim() || draft.value.name || ''),
  )
  // Under review, the pages below still point at the current key until
  // `rename()` moves them.
  const key = computed(() =>
    isNew.value && !reviewStatus.value ? draftKey.value : selected.value.id,
  )
  // Review: the slug was changed in the form (only possible while under
  // review; a published owner keeps its slug).
  const renaming = computed(
    () => !!reviewStatus.value && draftKey.value !== selected.value.id,
  )

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

  if (onNew) {
    watch(isNew, (value) => {
      if (value) onNew()
    })
  }

  /** The owner step's props for `SharedSubmissionEntityStep`. */
  const stepProps = computed(() => ({
    label: config.label,
    tabs: options.value.length > 0,
    options: options.value,
    loading: status.value === 'pending',
    underReview: !!reviewStatus.value,
    name: label.value,
  }))

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

      Object.assign(draft.value, pickKeys(record, config.fields), {
        [config.keyField]: ownerKey,
      })
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

  /**
   * Review: moves an owner under review to the slug in its form, after the
   * pages below were saved under the current one (they follow through the
   * on update cascade). Returns the key it ends up with.
   */
  const rename = async () => {
    if (!renaming.value) return selected.value.id

    await $fetch(config.save(selected.value.id), {
      method: 'post',
      body: { [config.keyField]: draftKey.value },
    })

    return draftKey.value
  }

  return {
    ownerMode,
    draft,
    draftKey,
    key,
    isNew,
    renaming,
    reviewStatus,
    options,
    status,
    optionLabel: label,
    stepProps,
    canAdvance,
    validate,
    ensure,
    load,
    save,
    rename,
  }
}
