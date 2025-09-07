<template>
  <UPageHeader :title="sculpt.name">
    <template v-if="sculpt.story" #description>
      <PageHeaderDescription :description="sculpt.story" />
    </template>

    <template #links>
      <UButton
        v-for="link in links"
        :key="link.label"
        :target="link.to?.startsWith('http') ? '_blank' : undefined"
        v-bind="link"
      />

      <USelect
        v-model="sort"
        :items="sortOptions"
        :icon="sortIconMap[sort]"
        variant="soft"
        :ui="{ content: 'min-w-fit' }"
        @change="emit('onSorting', sort)"
      />
    </template>
  </UPageHeader>
</template>

<script setup>
const emit = defineEmits(['onSorting'])

const { sculpt } = defineProps({
  sculpt: {
    type: Object,
    default: () => ({}),
  },
})

const links = sculpt.href
  ? [
      {
        label: 'Website',
        icon: 'hugeicons:globe-02',
        to: sculpt.href,
        target: '_blank',
      },
    ]
  : []

const sort = ref('order|desc')
const sortIconMap = {
  'name|asc': 'hugeicons:sorting-a-z-02',
  'name|desc': 'hugeicons:sorting-z-a-01',
  'order|asc': 'hugeicons:sorting-1-9',
  'order|desc': 'hugeicons:sorting-9-1',
}

const sortOptions = computed(() => [
  {
    label: 'Name (A-Z)',
    icon: 'hugeicons:sorting-a-z-02',
    value: 'name|asc',
  },
  {
    label: 'Name (Z-A)',
    icon: 'hugeicons:sorting-z-a-01',
    value: 'name|desc',
  },
  {
    label: 'Oldest First',
    icon: 'hugeicons:sorting-1-9',
    value: 'order|asc',
  },
  {
    label: 'Newest First',
    icon: 'hugeicons:sorting-9-1',
    value: 'order|desc',
  },
])
</script>
