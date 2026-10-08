<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButton
      label="Approve All"
      size="xs"
      color="success"
      icon="hugeicons:checkmark-circle-02"
      :loading="running === 'approve'"
      :disabled="disabled"
      @click="emit('approve')"
    />
    <UButton
      label="Reject All"
      size="xs"
      color="error"
      icon="hugeicons:cancel-circle"
      :loading="running === 'reject'"
      :disabled="disabled"
      @click="emit('reject')"
    />
  </div>
</template>

<script setup lang="ts">
// Approve All / Reject All for a group's Pending leaves in a review table.
defineProps<{
  // The bulk action currently running for this group, if any.
  running?: 'approve' | 'reject' | null
  disabled?: boolean
}>()

const emit = defineEmits<{ approve: []; reject: [] }>()
</script>
