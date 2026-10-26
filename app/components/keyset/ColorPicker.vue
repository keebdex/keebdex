<template>
  <UInputMenu
    ref="inputMenu"
    v-model="selected"
    v-model:search-term="term"
    multiple
    by="id"
    :items="colorOptions"
    :loading="status === 'pending'"
    ignore-filter
    icon="hugeicons:paint-board"
    placeholder="Which color are you looking for?"
    label-key="code"
    class="w-full"
  >
    <template #item="{ item }">
      <UUser :name="`${item.system} ${item.code}`" :description="item.name">
        <template #avatar>
          <UAvatar :style="{ backgroundColor: item.hex }" />
        </template>
      </UUser>
    </template>

    <template #tags-item-text="{ item }">
      {{ colorLabel(item) }}
    </template>

    <template #content-bottom>
      <div
        v-if="status === 'pending' && colorOptions.length"
        class="px-3 py-2 text-center text-xs text-muted"
      >
        Loading more colors...
      </div>
    </template>
  </UInputMenu>
</template>

<script setup>
import { useInfiniteScroll } from '@vueuse/core'

// A keyset's colors as color ids (`v-model`), picked by searching the color
// list as you type; shared by the keyset color form and the keyset form
// (suggestions). Tags show the selected colors by code, loaded by id.
const model = defineModel({ type: Array, default: () => [] })

const inputMenu = ref()
const term = ref('')
const page = ref(1)
const size = ref(20)
const colorOptions = ref([])

const { details, remember } = useKeysetColorDetails(() => model.value)

const colorLabel = (color) =>
  color.system ? `${color.system} ${color.code}` : `Color ${color.id}`

const selected = computed({
  get: () => model.value.map((id) => details.value[id] || { id }),
  set: (colors) => {
    remember(colors.filter((color) => color.code))
    model.value = [...new Set(colors.map((color) => color.id))].sort(
      (a, b) => a - b,
    )
  },
})

const { data, status, shouldSearch, normalizedTerm } = useAdvancedSearch(
  '/api/colors',
  {
    key: 'keyset-color-picker-search',
    term,
    minLength: 2,
    pagination: {
      page,
      size,
    },
  },
)

const hasMore = computed(() => {
  const count = data.value?.count || 0
  return colorOptions.value.length < count
})

watch(normalizedTerm, () => {
  page.value = 1
  colorOptions.value = []
})

watch(
  () => data.value?.data || [],
  (items) => {
    if (!shouldSearch.value || page.value === 1) {
      colorOptions.value = items
      return
    }

    const seen = new Set(colorOptions.value.map((item) => item.id))
    const nextItems = items.filter((item) => !seen.has(item.id))

    colorOptions.value = colorOptions.value.concat(nextItems)
  },
  { immediate: true },
)

useInfiniteScroll(
  () => inputMenu.value?.viewportRef,
  () => {
    if (!hasMore.value || status.value === 'pending' || !shouldSearch.value) {
      return
    }

    page.value += 1
  },
  {
    distance: 16,
    canLoadMore: () =>
      Boolean(inputMenu.value?.viewportRef) &&
      hasMore.value &&
      status.value !== 'pending' &&
      shouldSearch.value,
  },
)
</script>
