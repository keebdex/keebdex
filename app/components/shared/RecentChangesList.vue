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
          <button
            type="button"
            :aria-current="isSelected(entry) || undefined"
            :class="[
              'relative w-full overflow-hidden rounded-lg border px-4 py-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-primary',
              isSelected(entry)
                ? 'border-primary/60 bg-primary/5'
                : 'border-default bg-default hover:bg-elevated/50',
            ]"
            @click="emit('select', entry)"
          >
            <span
              v-if="isSelected(entry)"
              class="absolute inset-y-0 start-0 w-1 bg-primary"
              aria-hidden="true"
            />

            <span class="flex items-center gap-3">
              <UTooltip :text="KEEB_MODULE_LABELS[entry.domain]">
                <UAvatar
                  :icon="KEEB_MODULE_ICONS[entry.domain]"
                  role="img"
                  :aria-label="KEEB_MODULE_LABELS[entry.domain]"
                  :ui="{ icon: isSelected(entry) ? 'text-primary' : undefined }"
                  class="shrink-0"
                />
              </UTooltip>

              <span
                :class="[
                  'min-w-0 flex-1 truncate font-semibold',
                  isSelected(entry) ? 'text-primary' : 'text-highlighted',
                ]"
              >
                {{ entry.name }}
              </span>

              <UIcon
                name="hugeicons:arrow-right-01"
                :class="[
                  'size-4 shrink-0',
                  isSelected(entry) ? 'text-primary' : 'text-dimmed',
                ]"
              />
            </span>

            <span
              class="mt-3 flex items-center justify-between gap-2 border-t border-default pt-2.5 text-xs text-muted"
            >
              <span class="min-w-0 truncate">
                <SharedRevisionAuthors :revisions="entry.revisions" />
                ·
                <time :datetime="entry.date" :title="formatDateTime(entry.date)">
                  {{ formatTimeAgo(entry.date) }}
                </time>
              </span>

              <UBadge
                :label="countLabel(entry.revisions.length, 'change')"
                color="primary"
                variant="subtle"
                size="sm"
                class="shrink-0 rounded-full"
              />
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { RecentChangesEntry } from '~/utils/revisions'

// The list side of Recent Changes: entries by day, each a card for a run of
// changes to a page (`groupRecentChanges`) with its module as an icon
// avatar (named by its tooltip, as History names record kinds), its name, who
// changed it, when, and how many changes. Selecting a card opens it in
// `SharedRecentChangesDetail`; the selected one is outlined in the primary
// color.
const props = defineProps<{
  entries: RecentChangesEntry[]
  selected?: RecentChangesEntry | null
}>()

const emit = defineEmits<{ select: [entry: RecentChangesEntry] }>()

const days = computed(() => groupRevisionsByDay(props.entries))

const isSelected = (entry: RecentChangesEntry) =>
  props.selected?.key === entry.key
</script>
