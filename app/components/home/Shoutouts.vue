<template>
  <HomeSection
    v-if="testimonials.length"
    title="What people say"
    :links="[
      {
        to: '/shoutouts',
        label: 'All Shoutouts',
        variant: 'ghost',
        trailingIcon: 'solar:map-arrow-right-bold-duotone',
      },
    ]"
  >
    <UMarquee
      v-for="(row, index) in rows"
      :key="index"
      pause-on-hover
      :reverse="index === 1"
      :repeat="isMobile ? 2 : 4"
      class="py-3 [--duration:28s] [--gap:--spacing(8)]"
    >
      <ShoutoutCard
        v-for="item in row"
        :key="item.id"
        :item="item"
        class="w-[320px] shrink-0"
      />
    </UMarquee>
  </HomeSection>
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

// Two rows scrolling in opposite directions once there are enough shoutouts.
const rows = computed(() => {
  const items = testimonials.value
  if (items.length < 6) return [items]

  const midpoint = Math.ceil(items.length / 2)
  return [items.slice(0, midpoint), items.slice(midpoint)]
})
</script>
