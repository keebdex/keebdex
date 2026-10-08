<template>
  <div
    class="flex flex-col-reverse gap-3 px-4 py-3.5 border-b border-accented sm:flex-row sm:items-center"
    :class="expandable ? 'sm:justify-between' : 'sm:justify-end'"
  >
    <UButton
      v-if="expandable"
      :label="allExpanded ? 'Collapse All' : 'Expand All'"
      :icon="allExpanded ? 'hugeicons:arrow-up-01' : 'hugeicons:arrow-down-01'"
      variant="ghost"
      :disabled="disabled"
      @click="emit('toggleAll')"
    />

    <USelect v-model="status" :items="statusOptions" class="w-full sm:w-52" />
  </div>
</template>

<script setup lang="ts">
// Status filter of a submission review page, plus Expand/Collapse All for
// grouped queues.
defineProps<{
  expandable?: boolean
  allExpanded?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ toggleAll: [] }>()
const status = defineModel<string>('status', { required: true })
</script>
