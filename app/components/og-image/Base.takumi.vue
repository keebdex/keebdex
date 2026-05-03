<template>
  <div
    class="w-full h-full flex items-center justify-center relative p-10 lg:p-[60px] bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50"
    style="font-family: 'Dosis', sans-serif"
  >
    <!-- Background -->
    <div class="absolute inset-0" :style="bgBottomRight" />
    <div class="absolute inset-0" :style="bgTopLeft" />

    <!-- Main -->
    <div class="relative w-full h-full flex items-center justify-center">
      <!-- ✅ CASE 2: NO TITLE LOGO -->
      <div
        v-if="title"
        class="flex flex-col items-center justify-center gap-8 text-center flex-1 w-full"
      >
        <!-- SITE HEADLINE -->
        <div class="flex flex-col items-start">
          <span
            :class="headlineClass"
            class="font-extrabold tracking-tight leading-none"
          >
            <span class="text-slate-900 dark:text-slate-100">keeb</span
            ><span class="text-teal-500 dark:text-teal-400">dex</span>
          </span>
          <div
            class="rounded-full bg-teal-500 dark:bg-teal-400 mt-1"
            style="height: 4px; width: 55px"
          />
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
      <div
        v-else
        class="flex flex-col items-center gap-6 text-center flex-1 w-full justify-center"
      >
        <div class="flex flex-col items-start">
          <span
            :class="titleClass"
            class="font-extrabold tracking-tight leading-none"
          >
            <span class="text-slate-900 dark:text-slate-100">keeb</span
            ><span class="text-teal-500 dark:text-teal-400">dex</span>
          </span>
          <div
            class="rounded-full bg-teal-500 dark:bg-teal-400 mt-2"
            style="height: 8px; width: 96px"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { title } = defineProps({
  title: { type: String, default: '' },
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
