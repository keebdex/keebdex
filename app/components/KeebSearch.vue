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
  routes: Array,
})

const colorMode = useColorMode()

const term = ref('')

const { data, status } = await useAsyncData(
  'command-palette',
  () =>
    $fetch('/api/search', {
      query: { query: term.value, theme: colorMode.value },
    }),
  { watch: [term] },
)

const groups = computed(() => routes.concat(data.value))
</script>
