<template>
  <UDashboardSearch
    v-model:search-term="term"
    :groups="groups"
    :loading="status === 'pending'"
    :fuse="{
      // applies per group; server groups are already capped
      resultLimit: 48,
    }"
  />
</template>

<script setup>
const { routes } = defineProps({
  routes: {
    type: Array,
    default: () => [],
  },
})

const appConfig = useAppConfig()

const term = ref('')

const { data, status } = useGuardedSearch('/api/search', {
  key: 'keeb-search',
  term,
})

const addAvatarUi = (item) => {
  const nextItem = { ...item }

  if (nextItem.avatar) {
    const invertible = Boolean(nextItem.avatar.invertible)

    nextItem.avatar = {
      ...nextItem.avatar,
      ui: {
        root: 'bg-transparent rounded-none',
        image: invertible && 'dark:invert',
      },
    }

    delete nextItem.avatar.invertible
  }

  if (Array.isArray(nextItem.children)) {
    nextItem.children = nextItem.children.map(addAvatarUi)
  }

  return nextItem
}

// last row of a capped group, linking to the page with every result
const viewAllRow = ({ id, label, items, total, viewAllTo }) => {
  if (!viewAllTo || !total || total <= items.length) return []

  return [
    {
      id: `${id}-view-all`,
      label: `View all ${total} ${label.toLowerCase()}`,
      icon: appConfig.ui.icons.arrowRight,
      to: { path: viewAllTo, query: { q: term.value.trim() } },
    },
  ]
}

const fetchedGroups = computed(() => {
  const raw = data.value
  const groups = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : []

  return groups.map(({ total, viewAllTo, ...group }) => {
    const items = (group.items || []).map(addAvatarUi)

    return {
      ...group,
      items: items.concat(viewAllRow({ ...group, items, total, viewAllTo })),
    }
  })
})

const groups = computed(() => routes.concat(fetchedGroups.value))
</script>
