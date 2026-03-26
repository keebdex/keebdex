<template>
  <div
    class="w-full h-full flex items-center justify-center relative p-10 lg:p-[60px] bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50"
    style="font-family: 'Reddit Sans', sans-serif"
  >
    <!-- Background -->
    <div class="absolute inset-0" :style="bgBottomRight" />
    <div class="absolute inset-0" :style="bgTopLeft" />

    <!-- Main -->
    <div class="relative w-full flex items-center justify-center">
      <!-- ✅ CASE 1: TITLE LOGO -->
      <div
        v-if="titleLogo"
        class="flex items-center justify-center gap-16 w-full max-w-[1200px]"
      >
        <!-- LEFT -->
        <div
          class="w-1/2 flex flex-col items-center justify-center gap-6 text-center"
        >
          <img
            src="/logo-filled.png"
            :alt="$config.public.site.name"
            class="h-[96px] lg:h-[120px] object-contain"
          >
          <span
            :class="bigTextClass"
            class="font-bold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
          >
            {{ $config.public.site.name }}
          </span>
        </div>

        <!-- DIVIDER -->
        <div class="flex items-center">
          <div class="w-px h-[140px]" :style="dividerStyle" />
        </div>

        <!-- RIGHT -->
        <div
          class="w-1/2 flex flex-col items-center justify-center gap-6 text-center"
        >
          <img
            :src="titleLogo"
            alt="title logo"
            class="h-[96px] lg:h-[120px] object-contain"
          >
          <h1 :class="bigTextClass">{{ title }}</h1>
        </div>
      </div>

      <!-- ✅ CASE 2: NO TITLE LOGO -->
      <div v-else-if="title" class="flex items-center justify-center gap-10">
        <!-- SITE -->
        <div class="flex flex-col items-center gap-4 text-center">
          <img
            src="/logo-filled.png"
            :alt="$config.public.site.name"
            class="h-[64px] lg:h-[80px] object-contain"
          >
          <span
            :class="smallTextClass"
            class="font-bold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
          >
            {{ $config.public.site.name }}
          </span>
        </div>

        <!-- DIVIDER (between, not centered) -->
        <div class="flex items-center">
          <div class="w-px h-[100px]" :style="dividerStyle" />
        </div>

        <!-- TITLE -->
        <div class="flex flex-col items-center gap-4 text-center max-w-[600px]">
          <h1 :class="smallTextClass">
            {{ title }}
          </h1>
        </div>
      </div>

      <!-- ✅ CASE 3: ONLY SITE -->
      <div v-else class="flex flex-col items-center gap-6 text-center">
        <img
          src="/logo-filled.png"
          :alt="$config.public.site.name"
          class="h-[72px] lg:h-[96px] object-contain"
        >
        <span
          :class="smallTextClass"
          class="font-bold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
        >
          {{ $config.public.site.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const { title, colorMode, titleLogo } = defineProps({
  colorMode: { type: String, default: 'light' },
  title: String,
  titleLogo: { type: String, default: '' },
})

const bigTextClass =
  'font-bold leading-tight text-[48px] lg:text-[72px] text-cyan-500 dark:text-cyan-300'
const smallTextClass =
  'font-bold leading-tight text-[36px] lg:text-[56px] text-cyan-500 dark:text-cyan-300'

const themeColor = computed(() =>
  colorMode === 'dark' ? '124, 58, 237' : '34, 197, 94',
)

const bgBottomRight = computed(() => ({
  backgroundImage: `radial-gradient(circle at 100% 100%, rgba(${themeColor.value}, 0.15), transparent)`,
}))

const bgTopLeft = computed(() => ({
  backgroundImage: `radial-gradient(circle at 0% 0%, rgba(${themeColor.value}, 0.1), transparent)`,
}))

const dividerStyle = computed(() => {
  const color =
    colorMode === 'dark' ? 'rgba(115,115,115,0.6)' : 'rgba(163,163,163,0.6)'

  return {
    backgroundImage: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
  }
})
</script>
