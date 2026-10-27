<template>
  <UDashboardPanel id="leaderboard">
    <template #header>
      <UDashboardNavbar title="Leaderboard">
        <template #right>
          <LeaderboardPointsGuide />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UTabs
            v-model="period"
            :items="periodItems"
            :content="false"
            size="xs"
            aria-label="Period"
          />
        </template>

        <template #right>
          <UTabs
            v-model="module"
            :items="moduleItems"
            :content="false"
            size="xs"
            aria-label="Module"
            :ui="{ label: 'max-sm:sr-only' }"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Kept narrow, so names and points stay close on wide screens -->
      <UPage class="w-full max-w-4xl mx-auto">
        <template v-if="status === 'pending' && !entries.length">
          <div class="mt-4 grid grid-cols-3 items-end gap-2 sm:gap-6">
            <div
              v-for="height in ['h-36 sm:h-52', 'h-48 sm:h-72', 'h-28 sm:h-44']"
              :key="height"
              class="flex flex-col items-center gap-3"
            >
              <USkeleton class="size-14 sm:size-20 rounded-full" />
              <USkeleton class="w-full rounded-t-lg rounded-b-none" :class="height" />
            </div>
          </div>

          <UPageList divide class="mt-8">
            <div
              v-for="index in 6"
              :key="index"
              class="flex items-center gap-4 py-3"
            >
              <USkeleton class="size-8 rounded-full" />
              <USkeleton class="size-10 rounded-full" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-40" />
                <USkeleton class="h-3 w-56 max-w-full" />
              </div>
              <USkeleton class="h-5 w-12" />
            </div>
          </UPageList>
        </template>

        <UEmpty
          v-else-if="!entries.length"
          icon="hugeicons:champion"
          title="No Contributions Yet"
          :description="
            period === 'month'
              ? 'Nobody has had a contribution approved this month. Yours could be the first.'
              : 'Nobody has had a contribution approved yet. Yours could be the first.'
          "
          :actions="[
            {
              label: 'Submit to Keebdex',
              icon: 'hugeicons:arrow-right-02',
              to: `/${module === 'all' ? 'artisan' : module}/submissions/submit`,
              ui: { label: 'block' },
            },
          ]"
        />

        <template v-else>
          <LeaderboardPodium
            :entries="entries.slice(0, 3)"
            :me-id="userStore.user?.uid"
            class="mt-4"
          />

          <div v-if="rows.length" class="mt-8">
            <LeaderboardHeader />
            <UPageList divide>
              <template v-for="row in rows" :key="row.entry.user_id">
                <div
                  v-if="row.gap"
                  class="flex justify-center py-1 text-muted"
                  aria-hidden="true"
                >
                  <UIcon name="hugeicons:more-horizontal" class="size-5" />
                </div>

                <div v-if="row.mine">
                  <LeaderboardRow :entry="row.entry" highlight />
                  <p
                    v-if="userStore.leaderboardHidden"
                    class="pb-3 pl-11 sm:pl-12 text-sm text-muted"
                  >
                    You are hidden from the leaderboard, so only you see this
                    rank.
                    <ULink to="/account/settings" class="underline">
                      Change it
                    </ULink>
                  </p>
                </div>

                <LeaderboardRow v-else :entry="row.entry" />
              </template>
            </UPageList>
          </div>
        </template>
      </UPage>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { LeaderboardPeriod } from '~/utils/leaderboard'

useSeoMeta({
  title: 'Leaderboard',
  description:
    'The collectors who add the most keyboards, keysets, and artisans to Keebdex.',
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)

const periodItems = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'month' },
]

const moduleItems = [
  // Icons only on phones, so both tab groups fit the toolbar
  { label: 'All', icon: 'hugeicons:infinity-01', value: 'all' },
  ...KEEB_MODULES.map((value) => ({
    label: KEEB_MODULE_LABELS[value],
    icon: KEEB_MODULE_ICONS[value],
    value,
  })),
]

// Both kept in the URL
const queryValue = (key: string, value: string, fallback: string) =>
  router.replace({
    path: route.path,
    query: { ...route.query, [key]: value === fallback ? undefined : value },
  })

const period = computed<LeaderboardPeriod>({
  get: () => (isLeaderboardPeriod(route.query.period) ? route.query.period : 'all'),
  set: (value) => queryValue('period', value, 'all'),
})

const module = computed<KeebModule | 'all'>({
  get: () => (isKeebModule(route.query.module) ? route.query.module : 'all'),
  set: (value) => queryValue('module', value, 'all'),
})

// useFetch forwards the session cookie during SSR, so `me` is filled there too
const { data, status } = await useFetch('/api/leaderboard', {
  query: computed(() => ({
    period: period.value,
    module: module.value === 'all' ? undefined : module.value,
  })),
  watch: [authenticated],
})

const entries = computed(() => data.value?.data || [])
const me = computed(() => data.value?.me || null)

// The board below the podium, with the caller's own row in rank order when
// they are not on it (outside the top, or hidden): after everyone sharing
// their rank, and after a gap when ranks are skipped to reach them.
const rows = computed(() => {
  const rows = entries.value.slice(3).map((entry) => ({
    entry,
    mine: entry.user_id === me.value?.user_id,
    gap: false,
  }))
  const own = me.value

  if (!own || entries.value.some((entry) => entry.user_id === own.user_id)) {
    return rows
  }

  const index = rows.findIndex((row) => row.entry.rank > own.rank)
  const at = index === -1 ? rows.length : index
  const previous = rows[at - 1]?.entry ?? entries.value.at(-1)

  rows.splice(at, 0, {
    entry: own,
    mine: true,
    gap: index === -1 && !!previous && own.rank > previous.rank + 1,
  })

  return rows
})
</script>
