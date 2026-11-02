<template>
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
  >
    <div class="min-w-0">
      <p :class="['flex items-center gap-2 text-primary', eyebrowClass]">
        <slot name="headline">{{ headline }}</slot>
      </p>
      <h2
        class="mt-2 text-2xl font-bold text-highlighted text-pretty sm:text-3xl"
      >
        {{ title }}
      </h2>
      <p v-if="description" class="mt-2 text-muted text-pretty sm:text-lg">
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.links" class="flex shrink-0 flex-wrap gap-2">
      <slot name="links" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Every home section opens with this header: a small mono headline, the
// title, a sentence, and its links on the right
defineProps<{
  headline?: string
  title: string
  description?: string
}>()
</script>
