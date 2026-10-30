<template>
  <UPageCard
    :title="`${system} ${code}`"
    :description="hex"
    reverse
    variant="naked"
    :ui="{
      root: 'w-full',
      container: 'gap-y-2',
      title: 'text-sm font-medium w-full',
      description: 'text-xs text-muted uppercase',
    }"
  >
    <!-- e.g. Remove, beside the name: on the swatch it would be lost on
         pale colors -->
    <template v-if="$slots.action" #title>
      <div class="flex items-start justify-between gap-1">
        <span>{{ system }} {{ code }}</span>
        <slot name="action" />
      </div>
    </template>

    <div :style="{ backgroundColor: hex }" class="h-16 rounded" />
  </UPageCard>
</template>

<script setup>
defineProps({
  system: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  hex: {
    type: String,
    required: true,
  },
})
</script>
