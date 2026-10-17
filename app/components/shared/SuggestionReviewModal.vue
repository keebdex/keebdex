<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
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

        <div class="divide-y divide-default rounded-lg border border-default">
          <div
            v-for="row in rows"
            :key="row.field.key"
            class="p-3 space-y-2"
            :class="reviewing && !selected[row.field.key] && 'opacity-60'"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <UCheckbox
                v-if="reviewing"
                v-model="selected[row.field.key]"
                :label="row.field.label"
                :ui="{ label: 'font-medium' }"
              />
              <span v-else class="text-sm font-medium">
                {{ row.field.label }}
              </span>

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
              <div class="min-w-0 space-y-1">
                <p class="text-xs text-muted">
                  {{ suggestion.review_status === 'Approved' ? 'Before' : 'Current' }}
                </p>
                <SuggestionValue
                  :field="row.field"
                  :value="row.current"
                  :values="currentValues"
                />
              </div>

              <div class="min-w-0 space-y-1">
                <p class="text-xs text-muted">
                  {{ suggestion.review_status === 'Approved' ? 'Applied' : 'Suggested' }}
                </p>
                <SharedSuggestionField
                  v-if="reviewing"
                  v-model="draft[row.field.key]"
                  :field="row.field"
                  :upload="upload"
                  :disabled="busy || !selected[row.field.key]"
                  @update:uploading="(value) => setUploading(row.field.key, value)"
                />
                <SuggestionValue
                  v-else
                  :field="row.field"
                  :value="row.suggested"
                  :values="suggestedValues"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="reviewing" #footer>
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          label="Reject"
          color="error"
          variant="soft"
          icon="hugeicons:cancel-circle"
          :ui="{ label: 'block' }"
          :disabled="busy"
          @click="emit('reject', suggestion!)"
        />
        <UButton
          :label="allSelected ? 'Approve' : 'Approve Selected'"
          color="success"
          icon="hugeicons:checkmark-circle-02"
          :ui="{ label: 'block' }"
          :loading="approving"
          :disabled="busy || !selectedKeys.length || !suggestion?.record"
          @click="approve"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SuggestionEntityType, SuggestionField } from '~/utils/suggestions'

// Staff review of an edit suggestion: each suggested field with the record's
// current value and the suggested one, which staff can leave out (checkbox)
// or adjust before approving. Fields whose current value changed since the
// suggestion was written are flagged. Submitters and reviewed suggestions get
// the same comparison, read-only.
const props = defineProps<{
  suggestion: Record<string, any> | null
  approving?: boolean
}>()

const emit = defineEmits<{
  approve: [suggestion: Record<string, any>, changes: Record<string, any>]
  reject: [suggestion: Record<string, any>]
}>()

const open = defineModel<boolean>('open', { default: false })

const userStore = useUserStore()

const entityType = computed(
  () => props.suggestion?.entity_type as SuggestionEntityType | undefined,
)
const entity = computed(() =>
  entityType.value ? SUGGESTION_ENTITIES[entityType.value] : null,
)

const reviewing = computed(
  () =>
    !!props.suggestion &&
    props.suggestion.review_status === 'Pending' &&
    userStore.isEditable(props.suggestion.scope),
)

const title = computed(() =>
  entity.value ? `${entity.value.label} Edit Suggestion` : 'Edit Suggestion',
)

const description = computed(() => {
  const suggestion = props.suggestion

  if (!suggestion) return undefined

  return [suggestion.entity_name, suggestion.parent_name]
    .filter(Boolean)
    .join(' · ')
})

// What staff will apply: the suggested values, editable.
const draft = ref<Record<string, any>>({})
const selected = ref<Record<string, boolean>>({})
const uploadingKeys = ref(new Set<string>())

watch(
  () => props.suggestion,
  (suggestion) => {
    const changes = suggestion?.changes || {}

    draft.value = { ...changes }
    selected.value = Object.fromEntries(
      Object.keys(changes).map((key) => [key, true]),
    )
    uploadingKeys.value = new Set()
  },
  { immediate: true },
)

const setUploading = (key: string, value: boolean) => {
  const next = new Set(uploadingKeys.value)

  if (value) next.add(key)
  else next.delete(key)

  uploadingKeys.value = next
}

const busy = computed(() => props.approving || uploadingKeys.value.size > 0)

const upload = computed(() =>
  entityType.value
    ? suggestionUploadTarget(entityType.value, props.suggestion?.record || {})
    : { category: 'artisan' as const, assignment: 'artisan' },
)

// Approved suggestions compare what was there before with what was applied.
const shown = computed(() => {
  const suggestion = props.suggestion

  if (!suggestion) return { keys: [], current: {}, suggested: {} }

  const approved = suggestion.review_status === 'Approved'
  const suggested = approved
    ? suggestion.applied || suggestion.changes
    : suggestion.changes

  return {
    keys: Object.keys(suggestion.changes || {}),
    current: approved ? suggestion.original : suggestion.record || suggestion.original,
    suggested: suggested || {},
  }
})

const currentValues = computed(() => ({
  ...(props.suggestion?.record || {}),
  ...shown.value.current,
}))
const suggestedValues = computed(() => ({
  ...currentValues.value,
  ...shown.value.suggested,
}))

const rows = computed(() => {
  const suggestion = props.suggestion
  const type = entityType.value

  if (!suggestion || !type) return []

  return shown.value.keys
    .map((key) => suggestionField(type, key))
    .filter((field): field is SuggestionField => !!field)
    .map((field) => ({
      field,
      current: shown.value.current?.[field.key] ?? null,
      suggested: shown.value.suggested?.[field.key] ?? null,
      stale:
        suggestion.review_status === 'Pending' &&
        !!suggestion.record &&
        !sameSuggestionValue(
          suggestion.record[field.key],
          suggestion.original?.[field.key],
        ),
    }))
})

const selectedKeys = computed(() =>
  rows.value
    .map((row) => row.field.key)
    .filter((key) => selected.value[key]),
)

const allSelected = computed(
  () => selectedKeys.value.length === rows.value.length,
)

const approve = () => {
  if (!props.suggestion) return

  emit(
    'approve',
    props.suggestion,
    Object.fromEntries(selectedKeys.value.map((key) => [key, draft.value[key]])),
  )
}

// One value, read-only: images as thumbnails, links as links, the rest as
// formatted text.
const SuggestionValue = defineComponent({
  props: {
    field: { type: Object as PropType<SuggestionField>, required: true },
    value: { type: null, default: null },
    values: { type: Object, default: () => ({}) },
  },
  setup(valueProps) {
    return () => {
      const { field, value, values } = valueProps

      if (field.type === 'image' && value) {
        return h('a', { href: value, target: '_blank', rel: 'noopener' }, [
          h('img', {
            src: value,
            alt: field.label,
            class: 'max-h-40 rounded border border-default object-contain',
          }),
        ])
      }

      if (field.type === 'url' && value) {
        return h(
          'a',
          {
            href: value,
            target: '_blank',
            rel: 'noopener',
            class: 'text-sm text-primary break-all',
          },
          value,
        )
      }

      return h(
        'p',
        { class: 'text-sm whitespace-pre-line break-words' },
        formatSuggestionValue(field, value, values),
      )
    }
  },
})
</script>
