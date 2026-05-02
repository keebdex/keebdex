<template>
  <UPageSection
    v-if="testimonials.length"
    :ui="{
      root: 'rounded-2xl border border-default bg-elevated/30 p-3 sm:p-4',
      container: '!py-8 !gap-6 overflow-hidden',
    }"
  >
    <UPageHeader
      title="What people say"
      :ui="{
        root: 'flex-1 pb-4',
        title:
          'text-base sm:text-md font-semibold uppercase tracking-[0.24em] text-dimmed',
      }"
      :links="[
        {
          to: '/shoutouts',
          label: 'All Shoutouts',
          variant: 'ghost',
          trailingIcon: 'solar:map-arrow-right-bold-duotone',
        },
      ]"
    />

    <UMarquee
      pause-on-hover
      :repeat="$device.isMobile ? 2 : 4"
      class="py-3 [--duration:28s] [--gap:--spacing(8)]"
    >
      <ShoutoutCard
        v-for="item in firstRow"
        :key="item.id"
        :item="item"
        class="w-[320px] shrink-0"
      />
    </UMarquee>

    <UMarquee
      v-if="secondRow.length"
      pause-on-hover
      reverse
      :repeat="$device.isMobile ? 2 : 4"
      class="py-3 [--duration:28s] [--gap:--spacing(8)]"
    >
      <ShoutoutCard
        v-for="item in secondRow"
        :key="item.id"
        :item="item"
        class="w-[320px] shrink-0"
      />
    </UMarquee>
  </UPageSection>
</template>

<script setup>
const { isMobile } = useDevice()
const size = computed(() => (isMobile ? 12 : 24))

const { data } = await useAsyncData(
  () => `home-featured-testimonials-${size.value}`,
  () =>
    $fetch('/api/testimonials', {
      query: { size: size.value },
    }).catch(() => []),
  {
    watch: [size],
    default: () => [],
  },
)

const testimonials = computed(() => data.value || [])
const useTwoRows = computed(() => testimonials.value.length >= 6)

const firstRow = computed(() => {
  if (!useTwoRows.value) {
    return testimonials.value
  }

  const midpoint = Math.ceil(testimonials.value.length / 2)
  return testimonials.value.slice(0, midpoint)
})

const secondRow = computed(() => {
  if (!useTwoRows.value) {
    return []
  }

  const midpoint = Math.ceil(testimonials.value.length / 2)
  return testimonials.value.slice(midpoint)
})
</script>
