<template>
  <div
    class="w-full h-full flex items-center justify-center relative p-10 lg:p-[60px] bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50"
    style="font-family: 'Dosis', sans-serif"
  >
    <!-- Background -->
    <div class="absolute inset-0" :style="bgBottomRight" />
    <div class="absolute inset-0" :style="bgTopLeft" />

    <!-- Main -->
    <div
      class="relative w-full h-full flex flex-col items-center justify-between gap-0"
    >
      <!-- Headline & Title Center -->
      <div
        class="flex-1 flex flex-col items-center justify-center gap-2 text-center w-full"
      >
        <!-- Headline & Title -->
        <div class="flex flex-col items-center gap-2">
          <!-- Optional Headline -->
          <div v-if="headline" class="flex items-center gap-4">
            <img
              v-if="headlineLogo"
              :src="headlineLogo"
              :alt="headline"
              class="h-[36px] lg:h-[48px] w-auto object-contain"
            >
            <span
              :class="headlineClass"
              class="font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
            >
              {{ headline }}
            </span>
          </div>

          <!-- Title -->
          <div class="flex items-center justify-center gap-12">
            <img
              :src="titleLogo"
              :alt="title"
              class="h-[96px] lg:h-[120px] w-auto object-contain"
            >
            <h1
              :class="titleClass"
              class="font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
            >
              {{ title }}
            </h1>
          </div>
        </div>
      </div>

      <!-- Site Footer -->
      <div class="flex flex-col items-start">
        <span
          :class="headlineClass"
          class="font-extrabold tracking-tight leading-none"
        >
          <span class="text-slate-900 dark:text-slate-100">keeb</span
          ><span class="text-rose-500 dark:text-rose-400">dex</span>
        </span>
        <div
          class="rounded-full bg-rose-500 dark:bg-rose-400 mt-1"
          style="height: 4px; width: 55px"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const { title, titleLogo, headline, headlineLogo } = defineProps({
  title: { type: String, default: '' },
  titleLogo: { type: String, default: '' },
  headline: { type: String, default: '' },
  headlineLogo: { type: String, default: '' },
})

const titleClass = 'font-extrabold leading-tight text-[56px] lg:text-[88px]'
const headlineClass = 'font-extrabold leading-tight text-[24px] lg:text-[32px]'

const themeColor = computed(() => '34, 197, 94')

const bgBottomRight = computed(() => ({
  backgroundImage: `radial-gradient(circle at 100% 100%, rgba(${themeColor.value}, 0.15), transparent)`,
}))

const bgTopLeft = computed(() => ({
  backgroundImage: `radial-gradient(circle at 0% 0%, rgba(${themeColor.value}, 0.1), transparent)`,
}))
</script>
