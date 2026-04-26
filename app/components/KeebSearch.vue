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
const normalizedTerm = computed(() => term.value.trim())

const { data, status } = await useAsyncData(
  'command-palette',
  async () => {
    if (normalizedTerm.value.length < SEARCH_TERM_MIN_LENGTH) {
      return []
    }

    return await $fetch('/api/search', {
      query: { query: normalizedTerm.value, theme: colorMode.value },
    })
  },
  { watch: [normalizedTerm] },
)

const groups = computed(() => routes.concat(data.value || []))
</script>
