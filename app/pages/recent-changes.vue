<template>
  <SharedRedirectPage v-if="!isModerator" to="/" />

  <div v-else class="flex min-h-0 flex-1 *:min-h-0">
    <UDashboardPanel
      id="recent-changes"
      :default-size="28"
      :min-size="22"
      :max-size="36"
      resizable
      :class="revisionId ? 'max-lg:hidden' : undefined"
    >
      <template #header>
        <UDashboardNavbar title="Recent Changes">
          <template #right>
            <USelect
              v-model="source"
              :items="sourceItems"
              :icon="sourceIcon"
              variant="soft"
              size="sm"
              class="w-40"
              aria-label="Changed by"
            />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <UTabs
            v-model="domain"
            :items="domainItems"
            :content="false"
            size="xs"
            aria-label="Module"
          />
        </UDashboardToolbar>
      </template>

      <template #body>
        <p class="text-sm text-muted">
          Every change to the pages you manage, newest first. Select an entry
          to review what changed and revert it.
        </p>

        <div v-if="loading && !revisions.length" class="space-y-3">
          <USkeleton v-for="i in 5" :key="i" class="h-28 w-full" />
        </div>

        <UEmpty
          v-else-if="!revisions.length"
          icon="hugeicons:time-quarter-pass"
          title="No Changes Yet"
          description="Changes to the pages you manage will be listed here as they happen."
          :actions="filtered ? showAllActions : undefined"
        />

        <template v-else>
          <SharedRecentChangesList
            :entries="entries"
            :selected="selectedEntry"
            @select="(entry) => (revisionId = entry.revisions[0]!.id)"
          />

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
      </template>
    </UDashboardPanel>

    <SharedRecentChangesDetail
      v-if="revisionId"
      :entry="selectedEntry"
      :revision-id="revisionId"
      @select="(id) => (revisionId = id)"
      @close="revisionId = null"
      @reverted="load()"
    />

    <div v-else class="hidden flex-1 items-center justify-center p-6 lg:flex">
      <UEmpty
        icon="hugeicons:git-compare"
        title="No Change Selected"
        description="Select an entry to see what changed, field by field, and undo or restore it."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Revision } from '~/utils/revisions'

// Recent Changes (staff only), as a list and a detail side by side: every
// revision of the pages in the caller's scope, newest first, with
// consecutive changes to one page grouped into an entry
// (`SharedRecentChangesList`, paged by 20 groups), and the selected revision
// with its diff and Undo / Restore (`SharedRecentChangesDetail`). On phones
// the detail replaces the list, with a back button. Filters (`domain`,
// `source`) and the selected revision (`rev`) live in the URL.
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { isModerator } = storeToRefs(useUserStore())

useSeoMeta({ title: 'Recent Changes' })

const domainItems = [
  { label: 'All', value: 'all' },
  ...KEEB_MODULES.map((value) => ({
    label: `${KEEB_MODULE_LABELS[value]}s`,
    value,
  })),
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

const queryRevision = () => {
  const id = Number(route.query.rev)

  return Number.isInteger(id) && id > 0 ? id : null
}

const domain = ref(queryValue('domain', domainItems))
const source = ref(queryValue('source', sourceItems))
const revisionId = ref(queryRevision())

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

const selectedEntry = computed(
  () =>
    entries.value.find((entry) =>
      entry.revisions.some((revision) => revision.id === revisionId.value),
    ) || null,
)

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

watch([domain, source, revisionId], () => {
  router.replace({
    query: {
      domain: domain.value === 'all' ? undefined : domain.value,
      source: source.value === 'all' ? undefined : source.value,
      rev: revisionId.value || undefined,
    },
  })
})

watch([domain, source], () => load())

// The staff profile loads after the page on a fresh visit.
watch(
  isModerator,
  (value) => {
    if (value && !revisions.value.length) load()
  },
  { immediate: true },
)
</script>
