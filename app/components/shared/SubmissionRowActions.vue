<template>
  <div class="flex flex-wrap items-center gap-2">
    <template v-if="userStore.isModerator">
      <UButton
        v-if="status !== 'Approved'"
        label="Approve"
        size="xs"
        color="success"
        icon="hugeicons:checkmark-circle-02"
        :loading="loading"
        :disabled="disabled"
        @click="emit('approve')"
      />
      <UButton
        v-if="status !== 'Rejected'"
        label="Reject"
        size="xs"
        color="error"
        icon="hugeicons:cancel-circle"
        :loading="loading"
        :disabled="disabled"
        @click="emit('reject')"
      />
    </template>

    <UButton
      v-if="canEdit"
      label="Edit"
      size="xs"
      variant="soft"
      icon="hugeicons:file-edit"
      :disabled="disabled"
      @click="emit('edit')"
    />

    <UButton
      v-if="canDelete"
      label="Delete"
      size="xs"
      color="error"
      variant="soft"
      icon="hugeicons:delete-02"
      :disabled="disabled"
      @click="emit('delete')"
    />
  </div>
</template>

<script setup lang="ts">
// Per-row actions of a submission review table: moderator-only Approve/Reject
// (each hidden when the row already has that status), Edit and Delete.
defineProps<{
  status?: string | null
  loading?: boolean
  disabled?: boolean
  canEdit?: boolean
  canDelete?: boolean
}>()

const emit = defineEmits<{
  approve: []
  reject: []
  edit: []
  delete: []
}>()

const userStore = useUserStore()
</script>
