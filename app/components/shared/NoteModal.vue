<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #body>
      <div v-if="presets?.length" class="mb-4 space-y-2">
        <p class="text-sm text-muted">Quick replies</p>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="preset in presets"
            :key="preset"
            :label="preset"
            color="neutral"
            :variant="isPicked(preset) ? 'solid' : 'outline'"
            size="xs"
            class="text-start"
            :ui="{ label: 'whitespace-normal' }"
            :aria-pressed="isPicked(preset)"
            :disabled="loading || !fits(preset)"
            @click="togglePreset(preset)"
          />
        </div>
      </div>

      <UFormField :label="label" :help="help" :required="!optional">
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
        :disabled="!optional && !note.trim()"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { REVIEW_NOTE_MAX_LENGTH } from '~/utils/schemas/common'

// Confirms an action with a note for the person it affects, who reads it in
// their notification: rejecting submissions (note required), resolving
// feedback (`optional` comment). A required note keeps the confirm button
// disabled until it has text. `presets` are quick replies toggled in and out of
// the note (several can be combined while they fit, as a bulleted list), which
// stays editable.
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel: string
    confirmColor?: 'error' | 'success' | 'primary'
    label?: string
    help?: string
    placeholder?: string
    optional?: boolean
    loading?: boolean
    presets?: string[]
  }>(),
  {
    description: undefined,
    confirmColor: 'primary',
    label: 'Note',
    help: 'They read this note in their notification.',
    placeholder: undefined,
    optional: false,
    loading: false,
    presets: undefined,
  },
)

const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { default: false })
const note = defineModel<string>('note', { default: '' })

const isPicked = (preset: string) => note.value.includes(preset)

// Text lines that are not quick replies (typed by the moderator), without
// their bullets
const typedLines = () =>
  props.presets
    ?.reduce((text, preset) => text.replace(preset, ''), note.value)
    .split('\n')
    .map((line) => line.replace(/^\s*[•-]\s*/, '').trim())
    .filter(Boolean) ?? []

// Picked quick replies, in the order they appear in the note
const pickedPresets = () =>
  (props.presets ?? [])
    .filter(isPicked)
    .sort((a, b) => note.value.indexOf(a) - note.value.indexOf(b))

// One item reads as a sentence; several become a bulleted list
const compose = (items: string[]) =>
  items.length > 1
    ? items.map((item) => `• ${item}`).join('\n')
    : (items[0] ?? '')

const toggled = (preset: string) => {
  const picked = pickedPresets()

  return compose([
    ...typedLines(),
    ...(isPicked(preset)
      ? picked.filter((item) => item !== preset)
      : [...picked, preset]),
  ])
}

const fits = (preset: string) =>
  isPicked(preset) || toggled(preset).length <= REVIEW_NOTE_MAX_LENGTH

const togglePreset = (preset: string) => {
  note.value = toggled(preset)
}
</script>
