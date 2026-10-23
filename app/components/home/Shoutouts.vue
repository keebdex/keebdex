<template>
  <UPageSection
    v-if="testimonials.length"
    headline="Shoutouts"
    title="What people say"
    description="Collectors and makers on how they use Keebdex."
    :links="[
      {
        to: '/shoutouts',
        label: 'All Shoutouts',
        variant: 'ghost',
        trailingIcon: 'solar:map-arrow-right-bold-duotone',
        ui: { label: 'block' },
      },
    ]"
    :ui="{ container: 'overflow-hidden', body: 'flex flex-col gap-6' }"
  >
    <HomeMarquee
      v-for="(row, index) in rows"
      :key="index"
      :items="row"
      :reverse="index === 1"
      item-class="w-80"
      duration="80s"
      layout="center"
    >
      <template #default="{ item }">
        <ShoutoutCard :item="item" />
      </template>
    </HomeMarquee>
  </UPageSection>
</template>

<script setup>
const { isMobile } = useDevice()
const size = isMobile ? 12 : 24

const { data } = await useAsyncData(
  `home-featured-testimonials-${size}`,
  () =>
    $fetch('/api/testimonials', {
      query: { size, featured: true },
    }).catch(() => ({ data: [] })),
  {
    default: () => ({ data: [] }),
  },
)

const testimonials = computed(() => data.value?.data || [])

// Two rows scrolling in opposite directions once there are enough shoutouts;
// up to three sit still in a grid (HomeMarquee).
const rows = computed(() => {
  const items = testimonials.value
  if (items.length < 6) return [items]

  const midpoint = Math.ceil(items.length / 2)
  return [items.slice(0, midpoint), items.slice(midpoint)]
})
</script>
