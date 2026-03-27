<template>
  <div
    class="w-full h-full flex items-center justify-center relative p-10 lg:p-[60px] bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 font-sans"
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
            :class="titleClass"
            class="font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
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
          <h1
            :class="titleClass"
            class="font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
          >
            {{ title }}
          </h1>
        </div>
      </div>

      <!-- ✅ CASE 2: NO TITLE LOGO -->
      <div
        v-else-if="title"
        class="flex flex-col items-center justify-center gap-8 text-center"
      >
        <!-- SITE HEADLINE -->
        <div class="flex items-center gap-4">
          <img
            src="/logo-filled.png"
            :alt="$config.public.site.name"
            class="h-[36px] lg:h-[48px] object-contain"
          >
          <span
            :class="headlineClass"
            class="font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
          >
            {{ $config.public.site.name }}
          </span>
        </div>

        <!-- TITLE -->
        <h1
          :class="titleClass"
          class="font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
        >
          {{ title }}
        </h1>
      </div>

      <!-- ✅ CASE 3: ONLY SITE -->
      <div v-else class="flex flex-col items-center gap-6 text-center">
        <img
          src="/logo-filled.png"
          :alt="$config.public.site.name"
          class="h-[72px] lg:h-[96px] object-contain"
        >
        <span
          :class="titleClass"
          class="font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
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
  title: { type: String, default: '' },
  titleLogo: { type: String, default: '' },
})

const titleClass = 'font-extrabold leading-tight text-[48px] lg:text-[72px]'
const headlineClass = 'font-extrabold leading-tight text-[24px] lg:text-[32px]'

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
