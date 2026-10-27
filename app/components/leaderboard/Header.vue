<template>
  <div
    class="hidden md:flex items-center gap-4 pb-2 border-b border-default text-xs font-medium uppercase tracking-wide text-muted"
  >
    <span class="w-8 shrink-0 text-center">#</span>
    <span class="flex-1">Collector</span>
    <span
      v-for="column in LEADERBOARD_COLUMNS"
      :key="column.key"
      class="w-20 shrink-0 flex items-center justify-center gap-1"
    >
      <UIcon :name="column.icon" class="size-4" />
      {{ column.label }}
    </span>
    <span class="w-16 shrink-0 text-right">Points</span>
  </div>
</template>
