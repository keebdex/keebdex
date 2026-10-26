<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #body>
      <div v-if="suggestion" class="space-y-4">
        <UAlert
          v-if="!suggestion.record"
          icon="hugeicons:alert-02"
          color="warning"
          variant="subtle"
          title="Record Not Found"
          description="The record this suggestion is about no longer exists."
        />

        <UAlert
          v-if="suggestion.review_status === 'Rejected' && suggestion.review_note"
          icon="hugeicons:cancel-circle"
          color="error"
          variant="subtle"
          title="Rejected"
          :description="suggestion.review_note"
        />

        <UAlert
          v-if="reviewing && colorRemovals"
          icon="hugeicons:alert-02"
          color="warning"
          variant="subtle"
          title="Most Colors Removed"
          :description="`This suggestion removes ${colorRemovals} of the keyset's ${suggestion.record.colors.length} colors. Leave out Colors to Remove unless that is intended.`"
        />

        <div v-if="suggestion.reason" class="text-sm">
          <p class="text-xs uppercase tracking-widest text-muted mb-1">
            Reason or Source
          </p>
          <p class="whitespace-pre-line break-words">
            {{ suggestion.reason }}
          </p>
        </div>

        <!-- Staff adjusting the values edit them in the record's own form -->
        <SharedSuggestionForm
          v-if="adjusting"
          v-model:changes="adjusted"
          :entity-type="suggestion.entity_type"
          :record="suggestion.record"
          :initial="selectedChanges"
          @update:uploading="(value) => (uploading = value)"
        />

        <div
          v-else
          class="divide-y divide-default rounded-lg border border-default"
        >
          <SharedSuggestionChange
            v-for="row in rows"
            :key="row.key"
            :field="row.field"
            :label="row.label"
            :before="row.before"
            :after="row.after"
            :before-values="row.beforeValues"
            :after-values="row.afterValues"
            :labels="row.labels"
            :class="reviewing && !selected[row.key] && 'opacity-60'"
          >
            <template v-if="reviewing" #label="{ label }">
              <UCheckbox
                v-model="selected[row.key]"
                :label="label"
                :ui="{ label: 'font-medium' }"
              />
            </template>

            <template #actions>
              <UButton
                v-if="row.stale && row.since.length"
                :label="`Changed Since · ${row.since.length}`"
                icon="hugeicons:alert-02"
                :trailing-icon="
                  expanded[row.key]
                    ? 'hugeicons:arrow-up-01'
                    : 'hugeicons:arrow-down-01'
                "
                color="warning"
                variant="subtle"
                size="xs"
                :ui="{ label: 'block' }"
                :aria-expanded="!!expanded[row.key]"
                @click="expanded[row.key] = !expanded[row.key]"
              />
              <UBadge
                v-else-if="row.stale"
                label="Changed Since"
                icon="hugeicons:alert-02"
                color="warning"
                variant="subtle"
                size="sm"
              />
            </template>

            <SharedSuggestionChangesSince
              v-if="row.stale && expanded[row.key] && row.since.length"
              :field="row.field"
              :revisions="row.since"
              :values="row.beforeValues"
            />

            <SharedSuggestionAlsoSuggested
              v-if="row.others.length"
              :field="row.field"
              :suggestions="row.others"
              :values="row.beforeValues"
              @open="(other) => emit('open', other)"
            />
          </SharedSuggestionChange>
        </div>
      </div>
    </template>

    <template v-if="reviewing" #footer>
      <div class="flex w-full flex-wrap justify-between gap-2">
        <UButton
          :label="adjusting ? 'Back to Changes' : 'Adjust Values'"
          :icon="adjusting ? 'hugeicons:arrow-left-01' : 'hugeicons:edit-01'"
          variant="ghost"
          :disabled="busy || !suggestion?.record"
          @click="adjusting = !adjusting"
        />

        <div class="flex flex-wrap gap-2">
          <UButton
            label="Reject"
            color="error"
            variant="soft"
            :disabled="busy"
            @click="emit('reject', suggestion!)"
          />
          <UButton
            :label="adjusting || allSelected ? 'Approve' : 'Approve Selected'"
            color="success"
            :loading="approving"
            :disabled="busy || !approvedCount || !suggestion?.record"
            @click="approve"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Revision } from '~/utils/revisions'
import type { SuggestionEntityType } from '~/utils/suggestions'

// Staff review of an edit suggestion: each suggested field with the record's
// current value and the suggested one, with a checkbox to leave it out.
// Adjust Values opens the record's own form with the selected changes, and
// approving then applies what the form holds. Fields whose current value
// changed since the suggestion was written are flagged, and reviewers can
// open the revisions that changed them; fields other Pending suggestions also
// change list those, and Review opens one. Submitters and reviewed
// suggestions get the same comparison, read-only. A keyset's colors are two
// rows, the colors to add and the colors to remove, each with its own
// checkbox, so a moderator can take the additions and leave out removals.
const props = defineProps<{
  suggestion: Record<string, any> | null
  approving?: boolean
}>()

const emit = defineEmits<{
  approve: [suggestion: Record<string, any>, changes: Record<string, unknown>]
  reject: [suggestion: Record<string, any>]
  open: [suggestion: Record<string, any>]
}>()

const open = defineModel<boolean>('open', { default: false })

const userStore = useUserStore()

const entityType = computed(
  () => props.suggestion?.entity_type as SuggestionEntityType | undefined,
)

const reviewing = computed(
  () =>
    !!props.suggestion &&
    props.suggestion.review_status === 'Pending' &&
    userStore.isEditable(props.suggestion.scope),
)

const title = computed(() =>
  entityType.value
    ? `Review ${SUGGESTION_ENTITIES[entityType.value].label} Edit`
    : 'Review Edit',
)

const description = computed(
  () =>
    [props.suggestion?.entity_name, props.suggestion?.parent_name]
      .filter(Boolean)
      .join(' · ') || undefined,
)

const selected = ref<Record<string, boolean>>({})
const adjusting = ref(false)
const adjusted = ref<Record<string, unknown>>({})
const uploading = ref(false)

// Revisions behind each Changed Since field, and the fields opened.
const changesSince = ref<Record<string, Revision[]>>({})
const expanded = ref<Record<string, boolean>>({})
// Other Pending suggestions for the record that change the same fields.
const others = ref<Record<string, any>[]>([])

const COLOR_PARTS = ['add', 'remove'] as const

// What the checkboxes select: each field, or each non-empty part of colors
// (`colors:add`, `colors:remove`).
const selectionKeys = (changes: Record<string, unknown> = {}) =>
  Object.entries(changes).flatMap(([key, value]) =>
    isColorsChange(value)
      ? COLOR_PARTS.filter((part) => value[part]?.length).map(
          (part) => `${key}:${part}`,
        )
      : [key],
  )

// The changes with only the selected fields and parts of colors.
const pickChanges = (
  changes: Record<string, unknown> = {},
  picked: Record<string, boolean>,
) =>
  Object.fromEntries(
    Object.entries(changes).flatMap(([key, value]) => {
      if (!isColorsChange(value)) return picked[key] ? [[key, value]] : []

      const part = {
        add: picked[`${key}:add`] ? value.add || [] : [],
        remove: picked[`${key}:remove`] ? value.remove || [] : [],
      }

      return part.add.length || part.remove.length ? [[key, part]] : []
    }),
  )

const isStale = (suggestion: Record<string, any>, key: string) =>
  suggestion.review_status === 'Pending' &&
  !!suggestion.record &&
  !sameSuggestionValue(suggestion.record[key], suggestion.original?.[key])

watch(
  () => props.suggestion,
  (suggestion) => {
    selected.value = Object.fromEntries(
      selectionKeys(suggestion?.changes).map((key) => [key, true]),
    )
    adjusting.value = false
    adjusted.value = {}
    uploading.value = false
    changesSince.value = {}
    expanded.value = {}
    others.value = []
  },
  { immediate: true },
)

// Loaded once per suggestion, for reviewers only (both are staff-only).
// Without the revisions a field keeps its plain Changed Since badge.
const loadChangesSince = async (suggestion: Record<string, any>) => {
  const stale = Object.keys(suggestion.changes || {}).some((key) =>
    isStale(suggestion, key),
  )

  if (!stale) return

  try {
    const { data } = await $fetch<{ data: Record<string, Revision[]> }>(
      `/api/suggestions/${suggestion.id}/changes-since`,
    )

    if (props.suggestion?.id === suggestion.id) changesSince.value = data
  } catch (error) {
    console.error('fetch changes since suggestion error', error)
  }
}

const loadOthers = async (suggestion: Record<string, any>) => {
  try {
    const { data } = await $fetch<{ data: Record<string, any>[] }>(
      `/api/suggestions/${suggestion.id}/overlapping`,
    )

    if (props.suggestion?.id === suggestion.id) others.value = data
  } catch (error) {
    console.error('fetch overlapping suggestions error', error)
  }
}

watch(
  [() => props.suggestion, open, reviewing],
  ([suggestion, isOpen, canReview]) => {
    if (!suggestion || !isOpen || !canReview) return

    loadChangesSince(suggestion)
    loadOthers(suggestion)
  },
  { immediate: true },
)

// How many colors a keyset suggestion removes, when that is at least half
// of them (two or more): worth a second look before approving.
const colorRemovals = computed(() => {
  const removed = props.suggestion?.changes?.colors?.remove?.length || 0
  const current = props.suggestion?.record?.colors?.length || 0

  return removed >= 2 && removed * 2 >= current ? removed : 0
})

const busy = computed(() => props.approving || uploading.value)

const selectedChanges = computed(() =>
  pickChanges(props.suggestion?.changes, selected.value),
)

const approvedChanges = computed(() =>
  adjusting.value ? adjusted.value : selectedChanges.value,
)
const approvedCount = computed(() => Object.keys(approvedChanges.value).length)

const allSelected = computed(() =>
  selectionKeys(props.suggestion?.changes).every((key) => selected.value[key]),
)

// Approved suggestions compare what was there before with what was applied.
const rows = computed(() => {
  const suggestion = props.suggestion

  if (!suggestion) return []

  const approved = suggestion.review_status === 'Approved'
  const before = approved
    ? suggestion.original
    : suggestion.record || suggestion.original
  const after = approved
    ? suggestion.applied || suggestion.changes
    : suggestion.changes
  const beforeValues = { ...(suggestion.record || {}), ...before }
  const afterValues = { ...beforeValues, ...after }

  const shown = (approved ? after : suggestion.changes) || {}
  const labels = (
    approved ? ['Before', 'Applied'] : ['Current', 'Suggested']
  ) as [string, string]

  return selectionKeys(shown).map((key) => {
    const [field, part] = key.split(':') as [
      string,
      (typeof COLOR_PARTS)[number] | undefined,
    ]
    const value = after?.[field] ?? null

    return {
      key,
      field,
      label: part ? suggestionFieldLabel(key) : undefined,
      before: before?.[field] ?? null,
      // One part of a colors change, the other left empty.
      after: part ? { add: [], remove: [], [part]: value[part] } : value,
      beforeValues,
      afterValues,
      labels,
      stale: isStale(suggestion, field),
      since: changesSince.value[field] || [],
      others: others.value.filter((other) => other.overlap?.includes(field)),
    }
  })
})

const approve = () => {
  if (!props.suggestion || !approvedCount.value) return

  emit('approve', props.suggestion, approvedChanges.value)
}
</script>
