<template>
  <div class="flex flex-wrap items-center gap-2">
    <template v-if="candidate.state === 'new'">
      <UButton
        label="Approve"
        size="xs"
        color="success"
        icon="solar:check-circle-line-duotone"
        @click="emit('approve')"
      />
      <UButton
        label="Dismiss"
        size="xs"
        color="error"
        icon="solar:close-circle-line-duotone"
        @click="emit('dismiss')"
      />
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
import type { IngestCandidate } from '~/utils/ingest'

// Row actions of the Discovered keysets table: Approve (the approve wizard) and
// Dismiss while the candidate waits, Restore once dismissed, and a link to
// the forum thread.
defineProps<{ candidate: IngestCandidate; restoring?: boolean }>()

const emit = defineEmits<{ approve: []; dismiss: []; restore: [] }>()
</script>
