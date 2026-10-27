<template>
  <UPageSection
    v-if="podium.length"
    title="Top Contributors"
    orientation="horizontal"
    reverse
    :ui="{ wrapper: 'max-lg:order-first' }"
    :description="
      period === 'month'
        ? 'The collectors who added the most to Keebdex this month.'
        : 'The collectors who added the most to Keebdex.'
    "
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
        {{ period === 'month' ? 'this month' : 'so far' }} with
        <span class="font-semibold text-highlighted">
          {{ countLabel(ownRank.points, 'point') }}</span
        >.
      </p>
    </template>

    <template #links>
      <UButton
        label="Full Leaderboard"
        :to="period === 'month' ? '/leaderboard?period=month' : '/leaderboard'"
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

    <!-- Opposite the guides above, so the two sections read apart; stacked
    on phones, the title comes first -->
    <LeaderboardPodium
      :entries="podium"
      :me-id="me?.user_id"
      class="w-full"
    />
  </UPageSection>
</template>

<script setup lang="ts">
import type { LeaderboardEntry } from '~/utils/leaderboard'

const { authenticated } = storeToRefs(useUserStore())
// Forwards the session cookie during SSR, so `me` is the signed-in user
const requestFetch = useRequestFetch()

// This month's board, or the all-time one while the month is still quiet:
// the podium plus the next three
const { data } = await useAsyncData(
  'home-top-contributors',
  async () => {
    const fetchBoard = (period: 'month' | 'all') =>
      requestFetch('/api/leaderboard', { query: { period } })
        .then(({ data, me }) => ({
          period,
          entries: data.slice(0, 6) as LeaderboardEntry[],
          me: me as LeaderboardEntry | null,
        }))
        .catch(() => ({ period, entries: [], me: null }))

    const month = await fetchBoard('month')
    return month.entries.length >= 3 ? month : fetchBoard('all')
  },
  {
    default: () => ({ period: 'all' as const, entries: [], me: null }),
    watch: [authenticated],
  },
)

const period = computed(() => data.value.period)
const podium = computed(() => data.value.entries.slice(0, 3))
const runnersUp = computed(() => data.value.entries.slice(3))
const me = computed(() => data.value.me)

// The caller's own rank when they are not among the six shown
const ownRank = computed(() =>
  me.value &&
  !data.value.entries.some((entry) => entry.user_id === me.value?.user_id)
    ? me.value
    : null,
)

// Start Contributing opens the submission wizard of the module picked
const submitItems = KEEB_MODULES.map((module) => ({
  label: KEEB_MODULE_LABELS[module],
  icon: KEEB_MODULE_ICONS[module],
  to: `/${module}/submissions/submit`,
}))
</script>
