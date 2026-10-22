<template>
  <UChangelogVersions :indicator-motion="false" :ui="TIMELINE_UI">
    <UChangelogVersion
      v-for="day in days"
      :key="day.key"
      :title="day.heading"
      :as="{ root: 'section', title: 'h2' }"
      :ui="DAY_UI"
    >
      <!-- A commit-style marker on the line for each day -->
      <template #indicator>
        <span
          class="flex size-6 items-center justify-center rounded-full bg-default ring ring-default"
        >
          <UIcon name="hugeicons:git-commit" class="size-4" />
        </span>
      </template>

      <template #body>
        <div class="rounded-md border border-default divide-y divide-default">
          <div
            v-for="entry in day.entries"
            :key="entry.key"
            class="relative px-4 py-3 transition-colors hover:bg-elevated/50"
          >
            <slot :entry="entry" />
          </div>
        </div>
      </template>
    </UChangelogVersion>
  </UChangelogVersions>
</template>

<script setup lang="ts" generic="T extends { key: string; date: string }">
// The revision timelines (Recent Changes, History) in the style of GitHub's
// commit history, built on `UChangelogVersions`: one version per day
// (`Changes today`, `Changes yesterday`, `Changes on <date>`) with a commit
// marker on the line and a bordered box of rows, one per entry, rendered by
// the default slot. Entries come newest first and sit in the day of their
// `date`.
const props = defineProps<{ entries: T[] }>()

defineSlots<{ default(props: { entry: T }): any }>()

// The line runs through the markers at every width (by default it shows on
// large screens only, beside a date column).
const TIMELINE_UI = {
  container: 'gap-y-6 sm:gap-y-6 lg:gap-y-6',
  indicator: 'block inset-y-3 h-auto start-3 ms-0 lg:start-3 lg:ms-0',
}

const DAY_UI = {
  root: 'flex items-start gap-3',
  indicator: 'static flex w-auto shrink-0 justify-start',
  container: 'min-w-0 flex-1 max-w-none mx-0',
  header: 'mb-3',
  title: 'text-sm/6 font-normal text-muted',
}

const dayHeading = (date: string) => {
  const days = daysAgo(date)

  if (days === 0) return 'Changes today'
  if (days === 1) return 'Changes yesterday'

  return `Changes on ${formatDate(date)}`
}

const days = computed(() => {
  const result: { key: string; heading: string; entries: T[] }[] = []

  for (const entry of props.entries) {
    const key = String(startOfDay(entry.date).getTime())
    const last = result.at(-1)

    if (last?.key === key) last.entries.push(entry)
    else result.push({ key, heading: dayHeading(entry.date), entries: [entry] })
  }

  return result
})
</script>
