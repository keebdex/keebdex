<template>
  <UPageHeader :title="brand.name">
    <template v-if="brand.bio" #description>
      <SharedPageHeaderDescription :description="brand.bio" />
    </template>

    <template #links>
      <UButton
        v-for="link in links"
        :key="link.label"
        :target="link.to?.startsWith('http') ? '_blank' : undefined"
        :disabled="!link.to"
        v-bind="link"
      />
    </template>
  </UPageHeader>
</template>

<script setup>
const props = defineProps({
  brand: {
    type: Object,
    default: () => ({}),
  },
})

const links = computed(() => {
  const brand = props.brand || {}
  const items = []

  if (brand.website) {
    items.push({
      label: 'Website',
      icon: 'hugeicons:globe-02',
      to: brand.website,
      target: '_blank',
    })
  }

  if (brand.instagram) {
    items.push({
      label: 'Instagram',
      icon: 'hugeicons:instagram',
      to: brand.instagram,
      target: '_blank',
    })
  }

  if (brand.discord) {
    items.push({
      label: 'Discord',
      icon: 'hugeicons:discord',
      to: brand.discord,
      target: '_blank',
    })
  }

  return items
})
</script>
