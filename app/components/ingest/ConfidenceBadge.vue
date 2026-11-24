<template>
  <UBadge
    v-if="missing"
    label="Missing"
    variant="subtle"
    color="error"
    icon="solar:danger-triangle-line-duotone"
  />
  <UBadge
    v-else-if="value !== undefined"
    :label="`${Math.round(value * 100)}%`"
    variant="subtle"
    :color="value < LOW_CONFIDENCE ? 'warning' : 'success'"
    class="tabular-nums"
  />
  <span v-else class="text-dimmed">-</span>
</template>

<script setup lang="ts">
// How sure the extractor is of a field: a required field it could not read,
// or its confidence (warning below LOW_CONFIDENCE).
defineProps<{ value?: number; missing?: boolean }>()
</script>
