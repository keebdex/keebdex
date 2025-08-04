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
        :icon="sortIcon"
        variant="soft"
        :ui="{ content: 'min-w-fit' }"
        @change="
          () => {
            emit('onSorting', sort)
          }
        "
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
const sortIcon = ref('hugeicons:sort-by-down-01')

const sortOptions = computed(() => [
  {
    label: 'Name (A-Z)',
    icon: 'hugeicons:sorting-a-z-02',
    value: 'name|asc',
    onSelect: () => {
      sortIcon.value = 'hugeicons:sorting-a-z-02'
    },
  },
  {
    label: 'Name (Z-A)',
    icon: 'hugeicons:sorting-z-a-01',
    value: 'name|desc',
    onSelect: () => {
      sortIcon.value = 'hugeicons:sorting-z-a-01'
    },
  },
  {
    label: 'Oldest First',
    icon: 'hugeicons:sort-by-up-01',
    value: 'order|asc',
    onSelect: () => {
      sortIcon.value = 'hugeicons:sort-by-up-01'
    },
  },
  {
    label: 'Newest First',
    icon: 'hugeicons:sort-by-down-01',
    value: 'order|desc',
    onSelect: () => {
      sortIcon.value = 'hugeicons:sort-by-down-01'
    },
  },
])
</script>
