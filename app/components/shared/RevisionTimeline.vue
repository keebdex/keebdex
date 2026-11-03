<template>
  <UTimeline :items="days" size="xs" :ui="TIMELINE_UI">
    <template #title="{ item }">
      <h2>{{ item.title }}</h2>
    </template>

    <template #description="{ item }">
      <div class="rounded-md border border-default divide-y divide-default">
        <div
          v-for="entry in item.entries"
          :key="entry.key"
          class="relative px-4 py-3 transition-colors hover:bg-elevated/50"
        >
          <slot :entry="entry" />
        </div>
      </div>
    </template>
  </UTimeline>
</template>

<script setup lang="ts" generic="T extends { key: string; date: string }">
// The revision timelines (Recent Changes, History) in the style of GitHub's
// commit history, built on `UTimeline`: one item per day (`Changes today`,
// `Changes yesterday`, `Changes on <date>`) with a commit icon as its marker
// and a bordered box of rows, one per entry, rendered by the default slot.
// Entries come newest first and sit in the day of their `date`. No item is
// selected, so the markers and line stay neutral.
const props = defineProps<{ entries: T[] }>()

defineSlots<{ default(props: { entry: T }): any }>()

const TIMELINE_UI = {
  item: 'gap-3',
  wrapper: 'min-w-0 flex-1 pb-6 group-last:pb-0',
  title: 'text-sm/6 font-normal text-muted',
}

const days = computed(() =>
  groupRevisionsByDay(props.entries).map((day) => ({
    ...day,
    icon: 'hugeicons:git-commit',
  })),
)
</script>
