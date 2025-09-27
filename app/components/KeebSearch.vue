<template>
  <UModal v-model:open="open">
    <template #content>
      <UCommandPalette
        v-model:search-term="term"
        :loading="status === 'pending'"
        :groups="groups"
        placeholder="Search artisans, keycap sets, and more..."
      />
    </template>
  </UModal>
</template>

<script setup>
const term = ref('')
const open = ref(false)

defineShortcuts({
  meta_shift_f: () => {
    open.value = !open.value
  },
})

const {
  data: groups,
  status,
  refresh,
} = await useAsyncData('command-palette', () =>
  $fetch('/api/search', { query: { query: term.value } }),
)

// skip refetch when term is empty
watch(term, (val) => {
  if (val) {
    refresh()
  }
})

// when modal is closed, force a refresh to reset
watch(open, async (isOpen) => {
  if (!isOpen) {
    refresh()
  }
})
</script>
