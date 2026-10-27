<template>
  <div class="grid grid-cols-3 items-end gap-2 sm:gap-6">
    <div
      v-for="place in places"
      :key="place.entry.user_id"
      class="row-start-1 flex flex-col items-center text-center min-w-0"
      :class="place.column"
    >
      <UIcon
        v-if="place.first"
        name="hugeicons:crown"
        class="size-7 sm:size-9 text-amber-500 mb-1"
      />

      <div class="relative">
        <UAvatar
          :src="place.entry.avatar || undefined"
          :alt="place.entry.name || undefined"
          icon="hugeicons:user-circle-02"
          referrerpolicy="no-referrer"
          :class="[
            'ring-4 ring-offset-2 ring-offset-(--ui-bg)',
            place.medal?.ring,
            place.first ? 'size-20 sm:size-28 text-4xl' : 'size-14 sm:size-20 text-2xl',
          ]"
        />
        <span
          class="absolute -bottom-2 -right-2 flex size-8 sm:size-9 items-center justify-center rounded-full bg-default ring ring-default"
        >
          <UIcon
            name="hugeicons:champion"
            :class="['size-5 sm:size-6', place.medal?.text]"
          />
        </span>
      </div>

      <p
        class="mt-4 w-full truncate font-semibold"
        :class="place.first && 'sm:text-lg'"
      >
        {{ place.entry.name || 'Anonymous Collector' }}
        <UBadge
          v-if="place.entry.user_id === meId"
          label="You"
          size="sm"
          class="align-middle"
        />
      </p>
      <p class="text-sm text-muted tabular-nums">
        {{ formatNumber(place.entry.points) }} points
      </p>

      <div
        class="mt-3 w-full rounded-t-lg border-t-4 bg-linear-to-b flex justify-center pt-2 sm:pt-3"
        :class="[place.medal?.step, place.height]"
      >
        <span
          class="text-2xl sm:text-4xl font-bold tabular-nums"
          :class="place.medal?.text"
        >
          {{ place.entry.rank }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LeaderboardEntry } from '~/utils/leaderboard'

const { entries, meId = '' } = defineProps<{
  // The first three of the board
  entries: LeaderboardEntry[]
  meId?: string
}>()

// Second, first, third from left to right, the first on the tallest step
const layout = [
  { index: 1, column: 'col-start-1', height: 'h-20 sm:h-28' },
  { index: 0, column: 'col-start-2', height: 'h-28 sm:h-40' },
  { index: 2, column: 'col-start-3', height: 'h-14 sm:h-20' },
]

const places = computed(() =>
  layout.flatMap(({ index, column, height }) => {
    const entry = entries[index]
    if (!entry) return []

    return [
      {
        entry,
        column,
        height,
        first: index === 0,
        medal: leaderboardMedal(entry.rank),
      },
    ]
  }),
)
</script>
