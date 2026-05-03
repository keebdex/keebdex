<template>
  <!-- Icon mark — shown when sidebar is collapsed -->
  <div
    v-if="props.collapsed"
    class="flex w-9 h-9 shrink-0 flex-col items-start justify-center gap-[3px] rounded-xl bg-teal-500 dark:bg-teal-400 px-[7px] py-[5px]"
  >
    <span class="font-dosis text-[14px] font-extrabold leading-none text-white">
      kd
      <div class="h-[3px] w-full rounded-full bg-white" />
    </span>
  </div>

  <!-- Wordmark — shown when sidebar is expanded -->
  <AppWordmark v-else />
</template>

<script setup>
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
})
</script>
