<template>
  <UModal v-model:open="open">
    <UDashboardSearchButton :collapsed="collapsed" />

    <template #content>
      <UCommandPalette
        v-model:search-term="term"
        :loading="status === 'pending'"
        :groups="groups"
        placeholder="Type to search artisans, keycap sets, or go to a section..."
      />
    </template>
  </UModal>
</template>

<script setup>
const { collapsed, routes } = defineProps({
  collapsed: Boolean,
  routes: Array,
})

const colorMode = useColorMode()

const term = ref('')
const open = ref(false)

defineShortcuts({
  meta_k: () => {
    open.value = !open.value
  },
})

const { data, status, refresh } = await useAsyncData(
  'command-palette',
  () =>
    $fetch('/api/search', {
      query: { query: term.value, theme: colorMode.value },
    }),
  { watch: [term] },
)

const groups = computed(() => routes.concat(data.value))

watch(status, (val) => {
  if (val === 'success') {
    groups.value = data.value
  }
})

// // skip refetch when term is empty
// watch(term, (val) => {
//   if (val) {
//     refresh()
//   }
// })

// // when modal is closed, force a refresh to reset
// watch(open, async (isOpen) => {
//   if (!isOpen) {
//     refresh()
//   }
// })
</script>
