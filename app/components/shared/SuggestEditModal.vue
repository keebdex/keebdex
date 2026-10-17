<template>
  <UModal
    v-model:open="open"
    :title="`Suggest an Edit to ${entity.label}`"
    :description="description"
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <div v-if="loading" class="flex justify-center py-10 text-dimmed">
        <UIcon :name="appConfig.ui.icons.loading" class="size-6 animate-spin" />
      </div>

      <div v-else class="space-y-4">
        <UAlert
          v-if="pending"
          icon="hugeicons:file-edit"
          color="info"
          variant="subtle"
          title="You already suggested changes"
          description="Your earlier suggestion is still waiting for review. Update it here or withdraw it."
        />

        <UFormField
          v-for="field in fields"
          :key="field.key"
          :label="field.label"
          :name="field.key"
          :help="field.help"
          :required="field.required"
          :ui="{
            label: changedKeys.has(field.key) ? 'text-primary' : undefined,
          }"
        >
          <template v-if="changedKeys.has(field.key)" #hint>
            <UButton
              label="Undo"
              size="xs"
              variant="link"
              color="neutral"
              :ui="{ label: 'block' }"
              @click="draft[field.key] = record[field.key] ?? null"
            />
          </template>

          <SharedSuggestionField
            v-model="draft[field.key]"
            :field="field"
            :upload="upload"
            :disabled="saving"
            @update:uploading="(value) => setUploading(field.key, value)"
          />
        </UFormField>

        <UFormField
          label="Reason or Source"
          name="reason"
          help="Optional. A link to the maker's, designer's, or vendor's post helps moderators verify your changes."
        >
          <UTextarea
            v-model="reason"
            :rows="2"
            autoresize
            :maxlength="SUGGESTION_REASON_MAX_LENGTH"
            :disabled="saving"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <span class="text-sm text-muted">
          {{
            changedKeys.size
              ? `${countLabel(changedKeys.size, 'field')} changed`
              : 'No changes yet'
          }}
        </span>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="pending"
            label="Withdraw"
            color="error"
            variant="soft"
            :ui="{ label: 'block' }"
            :loading="withdrawing"
            :disabled="saving"
            @click="withdraw"
          />
          <UButton
            :label="pending ? 'Update Suggestion' : 'Submit Suggestion'"
            icon="hugeicons:sent"
            :ui="{ label: 'block' }"
            :loading="saving"
            :disabled="!changedKeys.size || uploading || loading || withdrawing"
            @click="submit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { SUGGESTION_REASON_MAX_LENGTH } from '~/utils/schemas/suggestion'
import type { SuggestionEntityType } from '~/utils/suggestions'

// Lets a signed-in user suggest changes to a published record. Reopening it
// for a record with a pending suggestion of theirs loads that suggestion, so
// they update or withdraw it instead of filing another. `focus` lists that
// field first (e.g. the image, from an Add Photo button).
const props = defineProps<{
  entityType: SuggestionEntityType
  record: Record<string, any>
  focus?: string
}>()

const open = defineModel<boolean>('open', { default: false })

const appConfig = useAppConfig()
const toast = useToast()

const entity = computed(() => SUGGESTION_ENTITIES[props.entityType])
const upload = computed(() =>
  suggestionUploadTarget(props.entityType, props.record),
)

const fields = computed(() => {
  const all = entity.value.fields

  if (!props.focus) return all

  return [
    ...all.filter((field) => field.key === props.focus),
    ...all.filter((field) => field.key !== props.focus),
  ]
})

const name = computed(() => props.record[entity.value.nameKey])

const description = computed(
  () =>
    `Fix or fill in details${name.value ? ` of "${name.value}"` : ''}. A moderator reviews your changes before they go live.`,
)

const draft = ref<Record<string, any>>({})
const reason = ref('')
const pending = ref<Record<string, any> | null>(null)
const loading = ref(false)
const saving = ref(false)
const withdrawing = ref(false)
const uploadingKeys = ref(new Set<string>())

const uploading = computed(() => uploadingKeys.value.size > 0)

const setUploading = (key: string, value: boolean) => {
  const next = new Set(uploadingKeys.value)

  if (value) next.add(key)
  else next.delete(key)

  uploadingKeys.value = next
}

const changes = computed(() =>
  suggestionDiff(props.entityType, props.record, draft.value),
)
const changedKeys = computed(() => new Set(Object.keys(changes.value)))

const recordValues = () =>
  Object.fromEntries(
    entity.value.fields.map(({ key }) => [key, props.record[key] ?? null]),
  )

const load = async () => {
  draft.value = recordValues()
  reason.value = ''
  pending.value = null
  loading.value = true

  try {
    const existing = await $fetch<Record<string, any> | null>(
      '/api/suggestions/pending',
      {
        query: { entity_type: props.entityType, entity_id: props.record.id },
      },
    )

    if (existing) {
      pending.value = existing
      draft.value = { ...draft.value, ...existing.changes }
      reason.value = existing.reason || ''
    }
  } catch (error) {
    toast.add(errorToast(error))
  } finally {
    loading.value = false
  }
}

watch(
  open,
  (value) => {
    if (value) load()
  },
  { immediate: true },
)

const submit = async () => {
  if (!changedKeys.value.size || saving.value) return

  saving.value = true

  try {
    const body = { changes: changes.value, reason: reason.value }

    if (pending.value) {
      await $fetch(`/api/suggestions/${pending.value.id}`, {
        method: 'post',
        body,
      })

      toast.add(successToast('update', { entity: 'Suggestion', name: name.value }))
    } else {
      await $fetch('/api/suggestions', {
        method: 'post',
        body: {
          ...body,
          entity_type: props.entityType,
          entity_id: props.record.id,
        },
      })

      toast.add(noticeToast('suggestion_pending'))
    }

    open.value = false
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    saving.value = false
  }
}

const withdraw = async () => {
  if (!pending.value || withdrawing.value) return

  withdrawing.value = true

  try {
    await $fetch(`/api/suggestions/${pending.value.id}`, { method: 'delete' })

    toast.add(successToast('delete', { entity: 'Suggestion', name: name.value }))
    open.value = false
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    withdrawing.value = false
  }
}
</script>
