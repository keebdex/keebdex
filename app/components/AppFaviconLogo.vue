<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl', '2xl'].includes(v),
  },
  variant: {
    type: String,
    default: 'auto',
    validator: (v) => ['auto', 'light', 'dark'].includes(v),
  },
  framed: {
    type: Boolean,
    default: false,
  },
})

const sizeMap = {
  sm: {
    frame: 'w-9 h-9 rounded-xl px-[7px] py-[5px] gap-[3px]',
    text: 'text-[18px]',
    bar: 'h-[3px]',
  },
  md: {
    frame: 'w-14 h-14 rounded-2xl px-3 py-2 gap-1',
    text: 'text-[28px]',
    bar: 'h-1',
  },
  lg: {
    frame: 'w-20 h-20 rounded-[1.75rem] px-4 py-3 gap-1.5',
    text: 'text-[38px]',
    bar: 'h-[5px]',
  },
  xl: {
    frame: 'w-28 h-28 rounded-[2rem] px-6 py-4 gap-2',
    text: 'text-[56px]',
    bar: 'h-[7px]',
  },
  '2xl': {
    frame: 'w-36 h-36 rounded-[2.5rem] px-8 py-6 gap-3',
    text: 'text-[72px]',
    bar: 'h-[9px]',
  },
}

const frameClass = computed(() => {
  if (props.variant === 'light') {
    return 'bg-teal-500'
  }

  if (props.variant === 'dark') {
    return 'bg-slate-900'
  }

  return 'bg-teal-500 dark:bg-slate-900'
})

const textClass = computed(() => {
  if (props.variant === 'light') {
    return 'text-white'
  }

  if (props.variant === 'dark') {
    return 'text-teal-400'
  }

  return 'text-white dark:text-teal-400'
})

const barClass = computed(() => {
  if (props.variant === 'light') {
    return 'bg-white'
  }

  if (props.variant === 'dark') {
    return 'bg-teal-400'
  }

  return 'bg-white dark:bg-teal-400'
})
</script>

<template>
  <div
    :class="[
      'shrink-0 flex flex-col items-center justify-center',
      props.framed ? [sizeMap[props.size].frame, frameClass] : 'gap-1',
    ]"
  >
    <span
      :class="[
        'font-dosis font-extrabold leading-none lowercase',
        sizeMap[props.size].text,
        textClass,
      ]"
    >
      kd
      <div
        :class="['w-full rounded-full', sizeMap[props.size].bar, barClass]"
      />
    </span>
  </div>
</template>
