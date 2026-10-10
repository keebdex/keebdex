<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #body>
      <UFormField
        label="Note to submitter"
        help="The submitter reads this note in their notification."
        required
      >
        <UTextarea
          v-model="note"
          :maxlength="REVIEW_NOTE_MAX_LENGTH"
          :rows="3"
          autoresize
          autofocus
          placeholder="e.g. The photo shows a different colorway."
          class="w-full"
          :disabled="loading"
        />

        <template #hint>
          <span class="tabular-nums">
            {{ note.length }}/{{ REVIEW_NOTE_MAX_LENGTH }}
          </span>
        </template>
      </UFormField>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" :disabled="loading" @click="close" />
      <UButton
        :label="confirmLabel"
        color="error"
        :loading="loading"
        :disabled="!note.trim()"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { REVIEW_NOTE_MAX_LENGTH } from '~/utils/schemas/common'

// Confirms a reject (one submission or all of a group's pending ones) and
// collects the note the submitter reads in their notification.
withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel?: string
    loading?: boolean
  }>(),
  {
    description: undefined,
    confirmLabel: 'Reject',
    loading: false,
  },
)

const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { default: false })
const note = defineModel<string>('note', { default: '' })
</script>
