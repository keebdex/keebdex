<template>
  <div class="flex flex-wrap items-center gap-2">
    <template v-if="moderatable">
      <UButton
        label="Approve All"
        size="xs"
        color="success"
        icon="solar:check-circle-bold-duotone"
        :loading="running === 'approve'"
        :disabled="disabled"
        @click="emit('approve')"
      />
      <UButton
        label="Reject All"
        size="xs"
        color="error"
        icon="solar:close-circle-bold-duotone"
        :loading="running === 'reject'"
        :disabled="disabled"
        @click="emit('reject')"
      />
    </template>

    <UButton
      v-if="deletable"
      label="Delete All"
      size="xs"
      color="error"
      variant="soft"
      icon="solar:trash-bin-minimalistic-bold-duotone"
      :loading="running === 'delete'"
      :disabled="disabled"
      @click="emit('delete')"
    />
  </div>
</template>

<script setup lang="ts">
// Bulk actions for a group in a review table: Approve All / Reject All for its
// Pending leaves and Delete All for its Rejected ones.
defineProps<{
  // The bulk action currently running for this group, if any.
  running?: 'approve' | 'reject' | 'delete' | null
  disabled?: boolean
  // Show Approve All / Reject All (moderators with Pending leaves).
  moderatable?: boolean
  // Show Delete All (Rejected leaves the user may delete).
  deletable?: boolean
}>()

const emit = defineEmits<{ approve: []; reject: []; delete: [] }>()
</script>
