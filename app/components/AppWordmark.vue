<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'lg',
    validator: (v) => ['sm', 'md', 'lg', 'xl', '2xl'].includes(v),
  },
  inline: {
    type: Boolean,
    default: false,
  },
})

const sizeMap = {
  sm: { text: 'text-base', bar: 'h-[3px]', barDefault: '32px', mt: 'mt-0.5' },
  md: { text: 'text-xl', bar: 'h-[5px]', barDefault: '40px', mt: 'mt-1' },
  lg: { text: 'text-3xl', bar: 'h-[6px]', barDefault: '58px', mt: 'mt-1.5' },
  xl: { text: 'text-5xl', bar: 'h-[9px]', barDefault: '96px', mt: 'mt-2' },
  '2xl': {
    text: 'text-7xl',
    bar: 'h-[12px]',
    barDefault: '128px',
    mt: 'mt-2.5',
  },
}

const keebRef = ref(null)
const barWidth = ref(0)

function measureBar() {
  if (keebRef.value) {
    barWidth.value = keebRef.value.offsetWidth
  }
}

onMounted(measureBar)
</script>

<template>
  <div :class="[props.inline ? 'inline-flex' : 'flex', 'flex-col items-start']">
    <span
      :class="[
        sizeMap[props.size].text,
        'font-dosis font-extrabold leading-none tracking-tight',
      ]"
    >
      <span ref="keebRef" class="text-slate-900 dark:text-slate-100">keeb</span
      ><span class="text-rose-500 dark:text-rose-400">dex</span>
    </span>
    <div
      :class="[
        sizeMap[props.size].bar,
        sizeMap[props.size].mt,
        'rounded-full bg-rose-500 dark:bg-rose-400 transition-[width]',
      ]"
      :style="{
        width: barWidth > 0 ? `${barWidth}px` : sizeMap[props.size].barDefault,
      }"
    />
  </div>
</template>
