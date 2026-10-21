<template>
  <UModal
    v-model:open="open"
    :title="reviewing ? 'Review Your Changes' : `Edit ${entity.label}`"
    :description="description"
  >
    <template #body>
      <div v-if="loading" class="flex justify-center py-10 text-dimmed">
        <UIcon :name="appConfig.ui.icons.loading" class="size-6 animate-spin" />
      </div>

      <div v-else class="space-y-4">
        <UAlert
          v-if="pending && !reviewing"
          icon="hugeicons:file-edit"
          color="info"
          variant="subtle"
          title="Waiting for Review"
          description="Your earlier changes are still waiting for review. Update them here or withdraw them."
        />

        <!-- Kept mounted while reviewing, so going back keeps the edits -->
        <div v-show="!reviewing">
          <SharedSuggestionForm
            ref="form"
            v-model:changes="changes"
            :entity-type="entityType"
            :record="record"
            :initial="pending?.changes"
            :form-props="formProps"
            @update:uploading="(value) => (uploading = value)"
          />
        </div>

        <template v-if="reviewing">
          <div class="divide-y divide-default rounded-lg border border-default">
            <SharedSuggestionChange
              v-for="key in changedKeys"
              :key="key"
              :field="key"
              :before="record[key]"
              :after="changes[key]"
              :before-values="record"
              :after-values="{ ...record, ...changes }"
            >
              <template #actions>
                <UButton
                  label="Undo"
                  icon="hugeicons:undo-02"
                  size="xs"
                  variant="ghost"
                  :ui="{ label: 'block' }"
                  :disabled="saving"
                  @click="form?.reset(key)"
                />
              </template>
            </SharedSuggestionChange>
          </div>

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
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton
          v-if="reviewing"
          label="Back to Edit"
          icon="hugeicons:arrow-left-01"
          variant="ghost"
          :ui="{ label: 'block' }"
          :disabled="saving"
          @click="reviewing = false"
        />
        <span v-else class="text-sm text-muted">
          {{
            changeCount
              ? `${countLabel(changeCount, 'change')}`
              : 'No changes yet'
          }}
        </span>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="pending && !reviewing"
            label="Withdraw"
            color="error"
            variant="soft"
            :loading="withdrawing"
            :disabled="saving"
            @click="withdraw"
          />
          <UButton
            v-if="reviewing"
            label="Submit for Review"
            :loading="saving"
            :disabled="!changeCount || uploading || withdrawing"
            @click="submit"
          />
          <UButton
            v-else
            label="Review Changes"
            :disabled="!changeCount || uploading || loading || withdrawing"
            @click="reviewing = true"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { SUGGESTION_REASON_MAX_LENGTH } from '~/utils/schemas/suggestion'
import type { SuggestionEntityType } from '~/utils/suggestions'

// Edit for signed-in users who cannot edit a page themselves: the record's
// own form, sent as a suggestion that a moderator reviews. The footer counts
// the changes, and Review Changes shows each one (current and new value,
// Undo) before Submit for Review. Reopening it for a record
// with a pending suggestion of theirs loads that suggestion, so they update
// or withdraw it instead of filing another.
const props = defineProps<{
  entityType: SuggestionEntityType
  record: Record<string, any>
  formProps?: Record<string, unknown>
}>()

const open = defineModel<boolean>('open', { default: false })

const appConfig = useAppConfig()
const toast = useToast()

const entity = computed(() => SUGGESTION_ENTITIES[props.entityType])
const name = computed(() => props.record[entity.value.nameKey])

const form = useTemplateRef('form')
const changes = ref<Record<string, unknown>>({})
const changedKeys = computed(() => Object.keys(changes.value))
const changeCount = computed(() => changedKeys.value.length)
const reviewing = ref(false)

const description = computed(() => {
  if (!reviewing.value) {
    return 'A moderator reviews your changes before they go live.'
  }

  const subject = name.value
    ? `"${name.value}"`
    : `this ${entity.value.label.toLowerCase()}`

  return `${countLabel(changeCount.value, 'change')} to ${subject}. A moderator reviews them before they go live.`
})

// Undoing the last change on the review step goes back to the form.
watch(changeCount, (count) => {
  if (!count) reviewing.value = false
})
const reason = ref('')
const pending = ref<Record<string, any> | null>(null)
const loading = ref(false)
const saving = ref(false)
const withdrawing = ref(false)
const uploading = ref(false)

const load = async () => {
  changes.value = {}
  reviewing.value = false
  reason.value = ''
  pending.value = null
  uploading.value = false
  loading.value = true

  try {
    const existing = await $fetch<Record<string, any> | null>(
      '/api/suggestions/pending',
      {
        query: { entity_type: props.entityType, entity_id: props.record.id },
      },
    )

    pending.value = existing || null
    reason.value = existing?.reason || ''
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
  if (!changeCount.value || saving.value) return

  saving.value = true

  try {
    const body = { changes: changes.value, reason: reason.value }

    if (pending.value) {
      await $fetch(`/api/suggestions/${pending.value.id}`, {
        method: 'post',
        body,
      })

      toast.add(
        successToast('update', { entity: 'Suggestion', name: name.value }),
      )
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

    toast.add(
      successToast('delete', { entity: 'Suggestion', name: name.value }),
    )
    open.value = false
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    withdrawing.value = false
  }
}
</script>
