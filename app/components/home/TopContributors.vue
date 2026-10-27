<template>
  <UPageSection
    v-if="podium.length"
    title="Top Contributors"
    orientation="horizontal"
    reverse
    description="The collectors who added the most to Keebdex this month."
  >
    <template v-if="runnersUp.length || ownRank" #body>
      <UPageList v-if="runnersUp.length" divide>
        <LeaderboardRow
          v-for="entry in runnersUp"
          :key="entry.user_id"
          :entry="entry"
          :highlight="entry.user_id === me?.user_id"
          compact
        />
      </UPageList>

      <p v-if="ownRank" class="mt-4 text-sm text-muted">
        You're
        <span class="font-semibold text-highlighted">#{{ ownRank.rank }}</span>
        this month with
        <span class="font-semibold text-highlighted">
          {{ countLabel(ownRank.points, 'point') }}</span
        >.
      </p>
    </template>

    <template #links>
      <UButton
        label="Full Leaderboard"
        to="/leaderboard?period=month"
        trailing-icon="hugeicons:arrow-right-02"
        :ui="{ label: 'block' }"
      />
      <UDropdownMenu :items="submitItems">
        <UButton
          label="Start Contributing"
          icon="hugeicons:add-circle"
          color="primary"
          variant="ghost"
          :ui="{ label: 'block' }"
        />
      </UDropdownMenu>
    </template>

    <!-- Opposite the guides above, so the two sections read apart -->
    <LeaderboardPodium
      :entries="podium"
      :me-id="me?.user_id"
      class="w-full"
    />
  </UPageSection>
</template>

<script setup lang="ts">
// This month's podium plus the next three; the section hides while nobody
// has contributed this month
const { data: entries } = await useAsyncData(
  'home-top-contributors',
  () =>
    $fetch('/api/leaderboard', { query: { period: 'month' } })
      .then((board) => board.slice(0, 6))
      .catch(() => []),
  { default: () => [] },
)

const podium = computed(() => entries.value.slice(0, 3))
const runnersUp = computed(() => entries.value.slice(3))
const me = useLeaderboardMe({ period: 'month' })

// The caller's own rank when they are not among the six shown
const ownRank = computed(() => leaderboardOwnRow(entries.value, me.value))

// Start Contributing opens the submission wizard of the module picked
const submitItems = KEEB_MODULES.map((module) => ({
  label: KEEB_MODULE_LABELS[module],
  icon: KEEB_MODULE_ICONS[module],
  to: `/${module}/submissions/submit`,
}))
</script>
