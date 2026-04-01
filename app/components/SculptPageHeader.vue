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

const appConfig = useAppConfig()

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
  'name|asc': appConfig.ui.icons.sortAlphaAsc,
  'name|desc': appConfig.ui.icons.sortAlphaDesc,
  'order|asc': appConfig.ui.icons.sortNumberAsc,
  'order|desc': appConfig.ui.icons.sortNumberDesc,
}

const sortOptions = computed(() => [
  {
    label: 'Name (A-Z)',
    icon: appConfig.ui.icons.sortAlphaAsc,
    value: 'name|asc',
  },
  {
    label: 'Name (Z-A)',
    icon: appConfig.ui.icons.sortAlphaDesc,
    value: 'name|desc',
  },
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
])
</script>
