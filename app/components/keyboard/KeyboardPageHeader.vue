<template>
  <UPageHeader :title="keyboard.name">
    <template v-if="keyboard.description" #description>
      <SharedPageHeaderDescription :description="keyboard.description" />
    </template>

    <template #links>
      <div class="flex items-center gap-2">
        <UButton
          v-if="keyboard.parent_slug"
          :to="`/keyboard/brand/${keyboard.parent_slug}`"
          :label="`${keyboard.parent.brand.name} ${keyboard.parent.name}`"
          icon="hugeicons:share-knowledge"
        />

        <USelect
          v-model="sort"
          :items="sortOptions"
          :icon="sortIconMap[sort]"
          variant="soft"
          :ui="{ content: 'min-w-fit' }"
          @change="emit('onSorting', sort)"
        />
      </div>
    </template>
  </UPageHeader>
</template>

<script setup>
const emit = defineEmits(['onSorting'])
const appConfig = useAppConfig()

defineProps({
  brand: {
    type: Object,
    default: () => ({}),
  },
  keyboard: {
    type: Object,
    default: () => ({}),
  },
  releases: {
    type: Array,
    default: () => [],
  },
  totalVariants: {
    type: Number,
    default: 0,
  },
})

const sort = ref('order|desc')

const sortOptions = [
  {
    label: 'Oldest First',
    icon: appConfig.ui.icons.sortNumberAsc,
    value: 'order|asc',
  },
  {
    label: 'Newest First',
    icon: appConfig.ui.icons.sortNumberDesc,
    value: 'order|desc',
  },
]

const sortIconMap = sortOptions.reduce((acc, option) => {
  acc[option.value] = option.icon
  return acc
}, {})
</script>
