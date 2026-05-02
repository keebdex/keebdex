<template>
  <UDashboardPanel id="shoutouts">
    <template #header>
      <UDashboardNavbar title="Community Shoutouts" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="space-y-6 mx-auto w-full lg:max-w-6xl">
        <template #header>
          <div class="space-y-2">
            <h1 class="text-xl font-semibold text-highlighted">
              What Collectors Are Saying
            </h1>
            <p class="text-toned">
              Browse all approved community testimonials and stories from
              collectors.
            </p>
          </div>
        </template>

        <div class="px-4">
          <UInput
            v-model="term"
            icon="hugeicons:search-01"
            placeholder="Search shoutouts"
            class="w-full"
          />
        </div>

        <div
          v-if="status === 'pending'"
          class="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <USkeleton v-for="index in 6" :key="index" class="h-52 w-full" />
        </div>

        <div
          v-else-if="testimonials.length"
          class="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <TestimonialCard
            v-for="testimonial in testimonials"
            :key="testimonial.id"
            :item="testimonial"
            class="w-full"
          />
        </div>

        <UAlert
          v-else
          color="neutral"
          variant="subtle"
          icon="hugeicons:quote-up-circle"
          title="No shoutouts found"
          description="No testimonials match your search yet."
          class="mx-4"
        />

        <div
          class="border-t border-default pt-4 mt-auto px-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-toned text-sm text-center sm:text-left">
            Showing {{ paginationMeta.from }} to {{ paginationMeta.to }} of
            <span class="font-semibold text-highlighted">{{
              paginationMeta.total
            }}</span>
          </p>

          <UPagination
            v-if="data.count > size"
            :page="page"
            :items-per-page="size"
            :total="data.count"
            :ui="{
              list: 'justify-center sm:justify-end',
            }"
            @update:page="setPage"
          />
        </div>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const { page, size, setPage, resetPage } = usePagination(12)
const term = ref('')

const { data, status } = useAdvancedSearch('/api/testimonials/all', {
  key: 'public-shoutouts',
  term,
  minLength: 0,
  pagination: {
    page,
    size,
  },
})

const testimonials = computed(() => data.value?.data || [])

const paginationMeta = computed(() => {
  const total = data.value?.count || 0
  const visibleOnPage = testimonials.value.length

  if (!total || !visibleOnPage) {
    return {
      total,
      from: 0,
      to: 0,
    }
  }

  const from = (page.value - 1) * size + 1
  const to = from + visibleOnPage - 1

  return {
    total,
    from,
    to,
  }
})

watch(term, resetPage)

useSeoMeta({
  title: 'Shoutouts',
})
</script>
