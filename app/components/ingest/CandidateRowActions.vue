<template>
  <div class="flex flex-wrap items-center gap-2">
    <template v-if="candidate.state === 'new'">
      <UButton
        label="Review"
        size="xs"
        color="primary"
        icon="solar:checklist-minimalistic-line-duotone"
        :loading="reviewing"
        @click="emit('review')"
      />
      <UFieldGroup size="xs">
        <UTooltip :text="defaultReason ? `Dismiss: ${defaultReason}` : 'Dismiss'">
          <UButton
            label="Dismiss"
            color="error"
            icon="solar:close-circle-line-duotone"
            :loading="dismissing"
            @click="emit('dismiss', defaultReason)"
          />
        </UTooltip>
        <UDropdownMenu :items="dismissItems" :disabled="dismissing">
          <UButton
            color="error"
            icon="solar:alt-arrow-down-linear"
            aria-label="Dismiss with a reason"
          />
        </UDropdownMenu>
      </UFieldGroup>
    </template>

    <UButton
      v-else-if="candidate.state === 'dismissed'"
      label="Restore"
      size="xs"
      icon="solar:undo-left-line-duotone"
      :loading="restoring"
      @click="emit('restore')"
    />

    <UTooltip text="Open Thread">
      <UButton
        :to="candidate.thread.url"
        target="_blank"
        rel="noopener noreferrer"
        size="xs"
        variant="ghost"
        icon="solar:arrow-right-up-linear"
        aria-label="Open Thread"
      />
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import type { DismissReason, IngestCandidate } from '~/utils/ingest'

// Row actions of the Discovered keysets table: Review (opens the approve wizard)
// and Dismiss with fixed reasons while the candidate waits, Restore once
// dismissed, and a link to the forum thread.
const props = defineProps<{
  candidate: IngestCandidate
  reviewing?: boolean
  dismissing?: boolean
  restoring?: boolean
}>()

const emit = defineEmits<{
  review: []
  dismiss: [note: DismissReason | null]
  restore: []
}>()

// A matched candidate is most often a keyset Keebdex already lists, so the
// main button dismisses it with that reason; the menu offers the others.
const defaultReason = computed<DismissReason | null>(() =>
  props.candidate.match_key ? 'Already on Keebdex' : null,
)

const dismissItems = computed(() => [
  ...DISMISS_REASONS.map((reason) => ({
    label: reason,
    onSelect: () => emit('dismiss', reason),
  })),
  { label: 'No reason', onSelect: () => emit('dismiss', null) },
])
</script>
