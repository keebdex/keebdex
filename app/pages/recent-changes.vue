<template>
  <SharedRedirectPage v-if="!isModerator" to="/" />

  <UDashboardPanel v-else id="recent-changes">
    <template #header>
      <UDashboardNavbar title="Recent Changes" />

      <UDashboardToolbar>
        <template #left>
          <UTabs
            v-model="domain"
            :items="domainItems"
            :content="false"
            size="xs"
            aria-label="Module"
          />
        </template>

        <template #right>
          <USelect
            v-model="source"
            :items="sourceItems"
            :icon="sourceIcon"
            variant="soft"
            size="sm"
            class="w-44"
            aria-label="Changed by"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="mx-auto w-full lg:max-w-3xl space-y-6">
        <div v-if="loading && !revisions.length" class="space-y-3">
          <USkeleton v-for="i in 5" :key="i" class="h-24 w-full" />
        </div>

        <UEmpty
          v-else-if="!revisions.length"
          icon="hugeicons:time-quarter-pass"
          title="No Changes Yet"
          description="Changes to the pages you manage will be listed here as they happen."
          :actions="filtered ? showAllActions : undefined"
        />

        <template v-else>
          <SharedRecentChangesList :entries="entries" />

          <div v-if="hasMore" class="flex justify-center">
            <UButton
              label="Load Older"
              variant="soft"
              :loading="loading"
              :ui="{ label: 'block' }"
              @click="load(true)"
            />
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Revision } from '~/utils/revisions'

// Recent Changes (staff only): every revision of the pages in the caller's
// scope, newest first, with consecutive changes to one sculpt, keyset or
// keyboard grouped together (`SharedRecentChangesList`), paged by 20 groups.
// Diffs and Undo / Restore stay in each page's History slideover, which the
// entries open (`?history=1`). Filters live in the URL (`domain`, `source`).
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { isModerator } = storeToRefs(useUserStore())

const domainItems = [
  { label: 'All', value: 'all' },
  { label: 'Artisans', value: 'artisan' },
  { label: 'Keyboards', value: 'keyboard' },
  { label: 'Keysets', value: 'keyset' },
]

const sourceItems = [
  { label: 'Everyone', value: 'all', icon: 'hugeicons:user-multiple' },
  {
    label: 'Without Syncs',
    value: 'no-syncs',
    icon: 'hugeicons:user-edit-01',
  },
  { label: 'Editors', value: 'editors', icon: 'hugeicons:user-edit-01' },
  {
    label: 'Suggestions',
    value: 'suggestions',
    icon: 'hugeicons:pencil-edit-02',
  },
  { label: 'Syncs', value: 'syncs', icon: 'hugeicons:google-doc' },
]

const queryValue = (key: string, items: { value: string }[]) => {
  const value = route.query[key]

  return items.some((item) => item.value === value) ? String(value) : 'all'
}

const domain = ref(queryValue('domain', domainItems))
const source = ref(queryValue('source', sourceItems))

const sourceIcon = computed(
  () => sourceItems.find((item) => item.value === source.value)?.icon,
)

const filtered = computed(
  () => domain.value !== 'all' || source.value !== 'all',
)

const showAllActions = [
  {
    label: 'Show All Changes',
    ui: { label: 'block' },
    onClick: () => {
      domain.value = 'all'
      source.value = 'all'
    },
  },
]

const revisions = ref<Revision[]>([])
const hasMore = ref(false)
const loading = ref(false)

const entries = computed(() => groupRecentChanges(revisions.value))

const load = async (older = false) => {
  loading.value = true

  try {
    const result = await $fetch<{ data: Revision[]; hasMore: boolean }>(
      '/api/revisions',
      {
        query: {
          domain: domain.value === 'all' ? undefined : domain.value,
          source: isRevisionSourceGroup(source.value)
            ? source.value
            : undefined,
          hide_syncs: source.value === 'no-syncs' ? 1 : undefined,
          groups: 20,
          before: older ? revisions.value.at(-1)?.id : undefined,
        },
      },
    )

    revisions.value = older ? [...revisions.value, ...result.data] : result.data
    hasMore.value = result.hasMore
  } catch (error) {
    toast.add(errorToast(error))
  } finally {
    loading.value = false
  }
}

watch([domain, source], () => {
  router.replace({
    query: {
      domain: domain.value === 'all' ? undefined : domain.value,
      source: source.value === 'all' ? undefined : source.value,
    },
  })
  load()
})

// The staff profile loads after the page on a fresh visit.
watch(
  isModerator,
  (value) => {
    if (value && !revisions.value.length) load()
  },
  { immediate: true },
)
</script>
