<template>
  <div
    class="w-full h-full flex flex-col justify-center items-center relative p-10 lg:p-[60px] bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50"
    style="font-family: 'Reddit Sans', sans-serif"
  >
    <!-- Gradient background -->
    <div
      class="absolute top-0 left-0 right-0 bottom-0"
      :style="{
        backgroundImage: `radial-gradient(at 100% 100%, rgba(${themeColor}, 0.15), transparent)`,
      }"
    />
    <div
      class="absolute top-0 left-0 right-0 bottom-0"
      :style="{
        backgroundImage: `radial-gradient(at 0% 0%, rgba(${themeColor}, 0.1), transparent)`,
      }"
    />

    <div class="relative flex flex-col items-center text-center gap-5 lg:gap-8">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <img
          loading="lazy"
          :alt="$config.public.site.name"
          :src="`/logo-filled.png`"
          width="64"
        >

        <span
          class="text-[32px] lg:text-[42px] font-bold tracking-tight bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
        >
          {{ $config.public.site.name }}
        </span>
      </div>

      <div v-if="title" class="items-center justify-center w-full">
        <!-- Title -->
        <h1
          class="text-[48px] lg:text-[80px] font-bold m-0 leading-tight max-w-[700px] lg:max-w-[1000px]"
          style="
            display: block;
            line-clamp: 3;
            text-overflow: ellipsis;
            text-wrap: balance;
          "
        >
          {{ title }}
        </h1>
      </div>

      <!-- Description -->
      <p
        v-if="description"
        class="text-[24px] lg:text-[32px] opacity-70 max-w-[650px] lg:max-w-[900px] leading-relaxed"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup>
const { title, description, colorMode } = defineProps({
  colorMode: { type: String, required: false, default: 'light' },
  title: { type: String, required: false },
  description: { type: String, required: false },
})

const themeColor = computed(() =>
  colorMode === 'dark' ? '124, 58, 237' : '34, 197, 94',
)
</script>
