<template>
  <UDashboardPanel id="artisan-search">
    <template #header>
      <UDashboardNavbar title="Search Colorways" />

      <!-- the input sits on the right so it is not mistaken for the sidebar search -->
      <UDashboardToolbar
        :ui="{
          root: 'flex-wrap gap-y-2 py-2',
          left: 'flex-wrap gap-x-4 gap-y-2',
          right: 'w-full sm:w-auto order-first sm:order-none',
        }"
      >
        <template #left>
          <span v-if="total" class="text-sm text-muted">
            {{ countLabel(total, 'colorway') }}
          </span>

          <UTooltip
            text="Only names containing the term as whole words, e.g. Blue but not Blueberry."
            :delay-duration="0"
          >
            <USwitch v-model="exact" label="Exact Match" size="sm" />
          </UTooltip>

          <USwitch v-model="grouped" label="Group by Maker" size="sm" />
        </template>

        <template #right>
          <UInput
            v-model="input"
            :icon="appConfig.ui.icons.search"
            :loading="pending"
            placeholder="Colorway name…"
            autofocus
            class="w-full sm:w-80"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageCTA
        v-if="emptyState"
        :title="emptyState.title"
        :description="emptyState.description"
      />

      <div
        v-else
        class="flex flex-col gap-8 transition-opacity"
        :class="{ 'opacity-50 pointer-events-none': pending }"
      >
        <section v-for="group in groups" :key="group.key">
          <ULink
            v-if="group.maker"
            :to="`/artisan/maker/${group.maker.id}`"
            class="flex items-center gap-2 mb-4 w-fit font-semibold text-highlighted hover:text-primary"
          >
            <UAvatar
              :src="`${imgUrl}/logo/${group.maker.id}.png`"
              :alt="group.maker.name"
              size="sm"
              :ui="{
                root: 'bg-transparent rounded-none',
                image: group.maker.invertible_logo ? 'dark:invert' : '',
              }"
            />
            {{ group.maker.name }}
            <UBadge :label="group.items.length" size="sm" />
          </ULink>

          <UPageGrid :class="squareGridClass">
            <UPageCard
              v-for="colorway in group.items"
              :key="colorway.id"
              :title="colorway.name"
              :description="
                grouped
                  ? colorway.sculpt.name
                  : `${colorway.maker.name} ${colorway.sculpt.name}`
              "
              :to="`/artisan/maker/${colorway.maker_id}/${colorway.sculpt_id}?cid=${colorway.colorway_id}`"
              reverse
              spotlight
              :ui="{
                root: 'h-full',
                container: 'h-full grid grid-rows-[auto_minmax(0,1fr)]',
                // keep the footer buttons above the card's link overlay
                footer: 'relative z-10',
              }"
            >
              <div class="aspect-square overflow-hidden relative">
                <NuxtImg
                  loading="lazy"
                  :alt="colorway.name"
                  :src="colorway.img"
                  class="w-full h-full object-cover rounded"
                />
              </div>

              <template v-if="authenticated" #footer>
                <SharedSaveToCollection :item="colorway" @on-select="saveTo" />
              </template>
            </UPageCard>
          </UPageGrid>
        </section>

        <UPagination
          v-if="total > size"
          :page="page"
          :items-per-page="size"
          :total="total"
          class="border-t border-default pt-4 mt-auto"
          :ui="{
            list: 'justify-center',
          }"
          @update:page="setPage"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { watchDebounced } from '@vueuse/core'

const appConfig = useAppConfig()
const route = useRoute()
const router = useRouter()

const {
  public: { imgUrl },
} = useRuntimeConfig()

const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)

const { addItem } = useCollectionItem()

const { page, size, setPage } = usePagination(72)

const term = computed(() => String(route.query.q || '').trim())
const input = ref(term.value)

// updates the URL without adding history entries; options that change the
// results start again from the first page
const setQuery = (patch, { resetPage = true } = {}) => {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      ...patch,
      ...(resetPage ? { page: undefined } : {}),
    },
  })
}

// search as the user types; skip syncing back the term this page just wrote
// so a slow route update cannot overwrite newer keystrokes
let lastTerm = term.value

watchDebounced(
  input,
  (value) => {
    lastTerm = value.trim()

    if (lastTerm !== term.value) setQuery({ q: lastTerm || undefined })
  },
  { debounce: 400 },
)

watch(term, (value) => {
  if (value !== lastTerm) {
    lastTerm = value
    input.value = value
  }
})

const exact = computed({
  get: () => route.query.exact === '1',
  set: (value) => setQuery({ exact: value ? '1' : undefined }),
})

const grouped = computed({
  get: () => route.query.group === 'maker',
  set: (value) =>
    setQuery({ group: value ? 'maker' : undefined }, { resetPage: false }),
})

const { data, status } = await useAsyncData(
  'artisan-colorway-search',
  () => {
    if (term.value.length < SEARCH_TERM_MIN_LENGTH) {
      return Promise.resolve({ data: [], total: 0 })
    }

    return $fetch('/api/search/colorways', {
      query: {
        q: term.value,
        page: page.value,
        size,
        exact: exact.value ? 1 : undefined,
      },
    })
  },
  {
    default: () => ({ data: [], total: 0 }),
    watch: [term, page, exact],
  },
)

const pending = computed(() => status.value === 'pending')
const total = computed(() => data.value?.total || 0)

const emptyState = computed(() => {
  if (term.value.length < SEARCH_TERM_MIN_LENGTH) {
    return {
      title: 'Search Colorways',
      description: `Type at least ${SEARCH_TERM_MIN_LENGTH} characters of a colorway name. Results update as you type.`,
    }
  }

  if (status.value === 'success' && !total.value) {
    return {
      title: 'No Colorways Found',
      description: `No colorway names match “${term.value}”.`,
    }
  }

  return null
})

// results already come ordered by maker, so grouping keeps that order
const groups = computed(() => {
  const colorways = data.value?.data || []

  if (!grouped.value) return [{ key: 'all', items: colorways }]

  return colorways.reduce((acc, colorway) => {
    const last = acc[acc.length - 1]

    if (last?.key === colorway.maker_id) {
      last.items.push(colorway)
    } else {
      acc.push({
        key: colorway.maker_id,
        maker: colorway.maker,
        items: [colorway],
      })
    }

    return acc
  }, [])
})

const saveTo = (collection, colorway) => {
  addItem(collection, { artisan_item_id: colorway.id }, colorway.name)
}

useSeoMeta({
  title: () =>
    term.value ? `"${term.value}" – Search Colorways` : 'Search Colorways',
})
</script>
