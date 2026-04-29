<template>
  <UDashboardSearch
    v-model:search-term="term"
    :groups="groups"
    :loading="status === 'pending'"
    :fuse="{
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

const colorMode = useColorMode()

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
        image: invertible && colorMode.value === 'dark' && 'invert',
      },
    }

    delete nextItem.avatar.invertible
  }

  if (Array.isArray(nextItem.children)) {
    nextItem.children = nextItem.children.map(addAvatarUi)
  }

  return nextItem
}

const fetchedGroups = computed(() => {
  const raw = data.value
  const groups = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : []

  return groups.map((group) => ({
    ...group,
    items: (group.items || []).map(addAvatarUi),
  }))
})

const groups = computed(() => routes.concat(fetchedGroups.value))
</script>
