<template>
  <div
    class="bg-zinc-50 dark:bg-zinc-950 w-full h-screen p-6 flex items-start gap-6 overflow-hidden"
  >
    <LayoutSider />
    <div
      class="flex flex-col justify-between flex-1 h-full overflow-y-auto pb-0.5"
    >
      <NuxtPage class="mx-auto max-w-screen-2xl w-full" />

      <LayoutFooter />
    </div>
  </div>
</template>
