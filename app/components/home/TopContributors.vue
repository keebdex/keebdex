<template>
  <section v-if="podium.length" class="flex flex-col gap-8">
    <HomeSectionHeader
      headline="Community"
      title="Top Contributors"
      description="The collectors who added the most to Keebdex this month."
    >
      <template #links>
        <UButton
          label="Full Leaderboard"
          to="/leaderboard?period=month"
          trailing-icon="hugeicons:arrow-right-02"
          :ui="{ label: 'block' }"
        />
      </template>
    </HomeSectionHeader>

    <div class="grid items-stretch gap-6 lg:grid-cols-2">
      <!-- Ranks 4–6 sit beside the podium; without them, the podium takes
      the row at the width it would have beside them -->
      <div
        :class="[
          'flex items-end justify-center rounded-2xl border border-default bg-elevated/30 px-4 pt-8 sm:px-8',
          !aside && 'lg:col-span-2',
        ]"
      >
        <LeaderboardPodium
          :entries="podium"
          :me-id="me?.user_id"
          class="w-full max-w-xl"
        />
      </div>

      <div v-if="aside" class="flex flex-col">
        <UPageList v-if="runnersUp.length" divide>
          <LeaderboardRow
            v-for="entry in runnersUp"
            :key="entry.user_id"
            :entry="entry"
            :highlight="entry.user_id === me?.user_id"
            compact
          />
        </UPageList>

        <!-- A hidden user's rank counts them among the visible collectors, so
        someone else holds it on the board; say so -->
        <p v-if="ownRank" class="mt-4 text-sm text-muted">
          <template v-if="leaderboardHidden">
            You're hidden from the leaderboard. You'd be
          </template>
          <template v-else>You're</template>
          <span class="font-semibold text-highlighted"
            >#{{ ownRank.rank }}</span
          >
          this month with
          <span class="font-semibold text-highlighted">
            {{ countLabel(ownRank.points, 'point') }}</span
          >.
          <ULink
            v-if="leaderboardHidden"
            to="/account/settings"
            class="underline"
          >
            Change it
          </ULink>
        </p>
      </div>
    </div>
  </section>
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
const { leaderboardHidden } = storeToRefs(useUserStore())
const me = useLeaderboardMe({ period: 'month' })

// The caller's own rank when they are not among the six shown
const ownRank = computed(() => leaderboardOwnRow(entries.value, me.value))
const aside = computed(() => runnersUp.value.length || ownRank.value)
</script>
