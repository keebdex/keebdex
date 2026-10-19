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
          <div
            v-for="row in rows"
            :key="row.key"
            class="p-3 space-y-2"
            :class="reviewing && !selected[row.key] && 'opacity-60'"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <UCheckbox
                v-if="reviewing"
                v-model="selected[row.key]"
                :label="row.label"
                :ui="{ label: 'font-medium' }"
              />
              <span v-else class="text-sm font-medium">{{ row.label }}</span>

              <UBadge
                v-if="row.stale"
                label="Changed Since"
                icon="hugeicons:alert-02"
                color="warning"
                variant="subtle"
                size="sm"
              />
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="side in row.sides"
                :key="side.label"
                class="min-w-0 space-y-1"
              >
                <p class="text-xs text-muted">{{ side.label }}</p>
                <a
                  v-if="row.image && side.value"
                  :href="side.value"
                  target="_blank"
                  rel="noopener"
                >
                  <NuxtImg
                    :src="side.value"
                    :alt="row.label"
                    class="max-h-40 rounded border border-default object-contain"
                  />
                </a>
                <p v-else class="text-sm whitespace-pre-line break-words">
                  {{ formatSuggestionValue(row.key, side.value, side.values) }}
                </p>
              </div>
            </div>
          </div>
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
import type { SuggestionEntityType } from '~/utils/suggestions'

// Staff review of an edit suggestion: each suggested field with the record's
// current value and the suggested one, with a checkbox to leave it out.
// Adjust Values opens the record's own form with the selected changes, and
// approving then applies what the form holds. Fields whose current value
// changed since the suggestion was written are flagged. Submitters and
// reviewed suggestions get the same comparison, read-only.
const props = defineProps<{
  suggestion: Record<string, any> | null
  approving?: boolean
}>()

const emit = defineEmits<{
  approve: [suggestion: Record<string, any>, changes: Record<string, unknown>]
  reject: [suggestion: Record<string, any>]
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

watch(
  () => props.suggestion,
  (suggestion) => {
    selected.value = Object.fromEntries(
      Object.keys(suggestion?.changes || {}).map((key) => [key, true]),
    )
    adjusting.value = false
    adjusted.value = {}
    uploading.value = false
  },
  { immediate: true },
)

const busy = computed(() => props.approving || uploading.value)

const selectedChanges = computed(() =>
  Object.fromEntries(
    Object.entries(props.suggestion?.changes || {}).filter(
      ([key]) => selected.value[key],
    ),
  ),
)

const approvedChanges = computed(() =>
  adjusting.value ? adjusted.value : selectedChanges.value,
)
const approvedCount = computed(() => Object.keys(approvedChanges.value).length)

const allSelected = computed(() =>
  Object.keys(props.suggestion?.changes || {}).every(
    (key) => selected.value[key],
  ),
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

  return Object.keys(approved ? after : suggestion.changes || {}).map(
    (key) => ({
      key,
      label: suggestionFieldLabel(key),
      image: isImageSuggestionField(key),
      stale:
        suggestion.review_status === 'Pending' &&
        !!suggestion.record &&
        !sameSuggestionValue(suggestion.record[key], suggestion.original?.[key]),
      sides: [
        {
          label: approved ? 'Before' : 'Current',
          value: before?.[key] ?? null,
          values: beforeValues,
        },
        {
          label: approved ? 'Applied' : 'Suggested',
          value: after?.[key] ?? null,
          values: afterValues,
        },
      ],
    }),
  )
})

const approve = () => {
  if (!props.suggestion || !approvedCount.value) return

  emit('approve', props.suggestion, approvedChanges.value)
}
</script>
