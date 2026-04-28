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
  term,
  theme: colorMode.value,
})

const groups = computed(() => routes.concat(data.value || []))
</script>
