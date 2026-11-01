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
  description: 'mt-3 text-default',
}

const dayHeading = (date: string) => {
  const days = daysAgo(date)

  if (days === 0) return 'Changes today'
  if (days === 1) return 'Changes yesterday'

  return `Changes on ${formatDate(date)}`
}

const days = computed(() => {
  const result: {
    value: string
    title: string
    icon: string
    entries: T[]
  }[] = []

  for (const entry of props.entries) {
    const value = String(startOfDay(entry.date).getTime())
    const last = result.at(-1)

    if (last?.value === value) last.entries.push(entry)
    else {
      result.push({
        value,
        title: dayHeading(entry.date),
        icon: 'hugeicons:git-commit',
        entries: [entry],
      })
    }
  }

  return result
})
</script>
