<template>
  <div
    class="bg-zinc-50 dark:bg-zinc-950 w-full h-screen p-6 flex items-start gap-6 overflow-hidden"
  >
    <LayoutSider />
    <div
      class="flex flex-col justify-between flex-1 mx-auto max-w-screen-2xl h-full overflow-y-auto pb-0.5"
    >
      <NuxtPage />

      <LayoutFooter />
    </div>
  </div>
</template>
