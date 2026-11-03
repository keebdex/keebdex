<template>
  <div class="space-y-6">
    <section v-for="day in days" :key="day.value" class="space-y-2">
      <h2
        class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase"
      >
        <UIcon name="hugeicons:calendar-03" class="size-4 shrink-0" />
        {{ day.title }}
      </h2>

      <ul class="space-y-2">
        <li v-for="entry in day.entries" :key="entry.key">
          <slot :entry="entry" />
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts" generic="T extends { key: string; date: string }">
// The revision lists of History and Recent Changes: entries (newest first)
// under a heading per day (`Changes today`, `Changes yesterday`, `Changes on
// <date>`), each rendered by the default slot, usually a
// `SharedRevisionCard`.
const props = defineProps<{ entries: T[] }>()

defineSlots<{ default(props: { entry: T }): any }>()

const days = computed(() => groupRevisionsByDay(props.entries))
</script>
