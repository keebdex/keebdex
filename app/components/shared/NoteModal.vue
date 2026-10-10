<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #body>
      <UFormField :label="label" :help="help" required>
        <UTextarea
          v-model="note"
          :maxlength="REVIEW_NOTE_MAX_LENGTH"
          :rows="3"
          autoresize
          autofocus
          :placeholder="placeholder"
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
        :color="confirmColor"
        :loading="loading"
        :disabled="!note.trim()"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { REVIEW_NOTE_MAX_LENGTH } from '~/utils/schemas/common'

// Confirms an action that needs a note for the person it affects, who reads
// it in their notification: rejecting submissions, resolving feedback with a
// comment. The confirm button stays disabled until the note has text.
withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel: string
    confirmColor?: 'error' | 'success' | 'primary'
    label?: string
    help?: string
    placeholder?: string
    loading?: boolean
  }>(),
  {
    description: undefined,
    confirmColor: 'primary',
    label: 'Note',
    help: 'They read this note in their notification.',
    placeholder: undefined,
    loading: false,
  },
)

const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { default: false })
const note = defineModel<string>('note', { default: '' })
</script>
