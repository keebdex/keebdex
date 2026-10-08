<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #footer="{ close }">
      <UButton label="Cancel" :disabled="loading" @click="close" />
      <UButton
        :label="confirmLabel"
        :color="confirmColor"
        :loading="loading"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel?: string
    confirmColor?: 'error' | 'success' | 'primary'
    loading?: boolean
  }>(),
  {
    description: undefined,
    confirmLabel: 'Delete',
    confirmColor: 'error',
    loading: false,
  },
)

const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { default: false })
</script>
