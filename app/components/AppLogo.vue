<template>
  <!-- Icon mark — shown when sidebar is collapsed -->
  <div
    v-if="props.collapsed"
    class="flex w-9 h-9 shrink-0 flex-col items-start justify-center gap-[3px] rounded-xl bg-rose-500 px-[7px] py-[5px]"
  >
    <span class="font-dosis text-[14px] font-extrabold leading-none text-white">
      kd
    </span>
    <div class="h-[3px] w-[22px] rounded-full bg-white" />
  </div>

  <!-- Wordmark — shown when sidebar is expanded -->
  <div v-else class="flex flex-col items-start">
    <span class="font-dosis text-xl font-extrabold leading-none tracking-tight">
      <span ref="keebRef" class="text-slate-900 dark:text-slate-100">keeb</span
      ><span class="text-rose-500">dex</span>
    </span>
    <div
      class="mt-1 h-[5px] rounded-full bg-rose-500 transition-[width]"
      :style="{ width: barWidth > 0 ? `${barWidth}px` : '40px' }"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
})

const keebRef = ref(null)
const barWidth = ref(0)

function measureBar() {
  if (keebRef.value) {
    barWidth.value = keebRef.value.offsetWidth
  }
}

onMounted(measureBar)
</script>
