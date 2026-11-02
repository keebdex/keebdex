<template>
  <!-- Names a list's group once something is pinned: Pinned (with a pin, in
       the primary color) above Others -->
  <h2
    class="flex items-center gap-1.5"
    :class="[eyebrowClass, pinned ? 'text-primary' : 'text-muted']"
  >
    <UIcon v-if="pinned" :name="PINNED_ICON" class="size-3.5" />
    <slot />
  </h2>
</template>

<script setup lang="ts">
defineProps<{ pinned?: boolean }>()
</script>
