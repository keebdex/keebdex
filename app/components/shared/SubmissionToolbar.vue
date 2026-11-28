<template>
  <div
    class="flex flex-col-reverse gap-3 px-4 py-3.5 border-b border-accented sm:flex-row sm:items-center"
    :class="expandable ? 'sm:justify-between' : 'sm:justify-end'"
  >
    <UButton
      v-if="expandable"
      :label="allExpanded ? 'Collapse All' : 'Expand All'"
      :icon="
        allExpanded
          ? 'solar:alt-arrow-up-linear'
          : 'solar:alt-arrow-down-linear'
      "
      variant="ghost"
      :disabled="disabled"
      @click="emit('toggleAll')"
    />

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <slot />
      <USelect
        v-model="status"
        :items="options || statusOptions"
        class="w-full sm:w-52"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Status filter of a submission review page (`options`, review statuses by
// default) with any other filters in the default slot, plus Expand/Collapse
// All for grouped queues.
defineProps<{
  options?: { label: string; value: string }[]
  expandable?: boolean
  allExpanded?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ toggleAll: [] }>()
const status = defineModel<string>('status', { required: true })
</script>
