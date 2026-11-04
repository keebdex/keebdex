<template>
  <section v-if="testimonials.length" class="flex flex-col gap-8">
    <HomeSectionHeader
      headline="Shoutouts"
      title="What People Say"
      description="Collectors and makers on how they use Keebdex."
    >
      <template #links>
        <UButton
          label="All Shoutouts"
          to="/shoutouts"
          variant="ghost"
          trailing-icon="solar:arrow-right-linear"
          :ui="{ label: 'block' }"
        />
      </template>
    </HomeSectionHeader>

    <div class="flex flex-col gap-6">
      <HomeMarquee
        v-for="(row, index) in rows"
        :key="index"
        :items="row"
        :reverse="index === 1"
        item-class="w-80"
        duration="80s"
      >
        <template #default="{ item }">
          <ShoutoutCard :item="item" />
        </template>
      </HomeMarquee>
    </div>
  </section>
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
// up to three sit still (HomeMarquee).
const rows = computed(() => {
  const items = testimonials.value
  if (items.length < 6) return [items]

  const midpoint = Math.ceil(items.length / 2)
  return [items.slice(0, midpoint), items.slice(midpoint)]
})
</script>
