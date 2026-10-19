<template>
  <UModal
    v-model:open="open"
    :title="`Edit ${entity.label}`"
    description="A moderator reviews your changes before they go live."
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
          title="Waiting for Review"
          description="Your earlier changes are still waiting for review. Update them here or withdraw them."
        />

        <SharedSuggestionForm
          v-model:changes="changes"
          :entity-type="entityType"
          :record="record"
          :initial="pending?.changes"
          :form-props="formProps"
          @update:uploading="(value) => (uploading = value)"
        />

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
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          v-if="pending"
          label="Withdraw"
          color="error"
          variant="soft"
          :loading="withdrawing"
          :disabled="saving"
          @click="withdraw"
        />
        <UButton
          label="Submit for Review"
          :loading="saving"
          :disabled="!changeCount || uploading || loading || withdrawing"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { SUGGESTION_REASON_MAX_LENGTH } from '~/utils/schemas/suggestion'
import type { SuggestionEntityType } from '~/utils/suggestions'

// Edit for signed-in users who cannot edit a page themselves: the record's
// own form, sent as a suggestion that a moderator reviews. Reopening it for a
// record with a pending suggestion of theirs loads that suggestion, so they
// update or withdraw it instead of filing another.
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

const changes = ref<Record<string, unknown>>({})
const changeCount = computed(() => Object.keys(changes.value).length)
const reason = ref('')
const pending = ref<Record<string, any> | null>(null)
const loading = ref(false)
const saving = ref(false)
const withdrawing = ref(false)
const uploading = ref(false)

const load = async () => {
  changes.value = {}
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
