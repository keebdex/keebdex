<template>
  <div
    class="flex items-center gap-3 sm:gap-4 py-3"
    :class="highlight && 'bg-elevated/50 -mx-3 px-3 rounded-md'"
  >
    <div class="w-8 shrink-0 flex justify-center">
      <UIcon
        v-if="medal"
        name="hugeicons:champion"
        :class="['size-6', medal.text]"
        :aria-label="`Rank ${entry.rank}`"
      />
      <span v-else class="text-sm font-medium text-muted tabular-nums">
        {{ entry.rank }}
      </span>
    </div>

    <UUser
      :name="entry.name || 'Anonymous Collector'"
      :description="compact ? undefined : summary"
      :avatar="{
        src: entry.avatar || undefined,
        alt: entry.name || undefined,
        icon: 'hugeicons:user-circle-02',
      }"
      class="flex-1 min-w-0"
      :ui="{ name: 'truncate', description: 'truncate md:hidden' }"
    />

    <!-- From md the counts get their own columns, under LeaderboardHeader -->
    <template v-if="!compact">
      <span
        v-for="column in LEADERBOARD_COLUMNS"
      :key="column.key"
      class="hidden md:block w-20 shrink-0 text-center text-sm tabular-nums"
      :class="entry[column.key] ? 'text-default' : 'text-dimmed'"
    >
        {{ formatNumber(entry[column.key]) }}
      </span>
    </template>

    <div class="w-16 shrink-0 text-right">
      <p class="font-semibold tabular-nums">{{ formatNumber(entry.points) }}</p>
      <p class="text-xs text-muted" :class="!compact && 'md:hidden'">points</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LeaderboardEntry } from '~/utils/leaderboard'

const { entry } = defineProps<{
  entry: LeaderboardEntry
  highlight?: boolean
  // Rank, avatar, name, and points only, e.g. beside the home page podium
  compact?: boolean
}>()

const medal = computed(() => leaderboardMedal(entry.rank))

const summary = computed(() =>
  [
    entry.pages && countLabel(entry.pages, 'page'),
    entry.items && countLabel(entry.items, 'item'),
    entry.suggestions && countLabel(entry.suggestions, 'edit'),
  ]
    .filter(Boolean)
    .join(' · '),
)
</script>
