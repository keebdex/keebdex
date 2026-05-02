<template>
  <UDashboardPanel id="shoutouts">
    <template #body>
      <UPageSection
        icon="solar:chat-round-like-bold-duotone"
        headline="What Collectors Are Saying"
        title="Shoutouts"
      >
        <div
          v-if="status === 'pending'"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <USkeleton v-for="index in 6" :key="index" class="h-52 w-full" />
        </div>

        <template v-else-if="testimonials.length">
          <UPageColumns>
            <ShoutoutCard
              v-for="testimonial in testimonials"
              :key="testimonial.id"
              :item="testimonial"
              class="mb-4 break-inside-avoid-column"
            />
          </UPageColumns>

          <div ref="loadMoreAnchor" class="h-1 w-full" />

          <div v-if="loadingMore" class="flex justify-center pt-2">
            <UIcon
              name="hugeicons:loading-03"
              class="size-5 animate-spin text-muted"
            />
          </div>
        </template>
      </UPageSection>
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { useInfiniteScroll } from '@vueuse/core'

const toast = useToast()

const PAGE_SIZE = 24

const page = ref(1)
const total = ref(0)
const status = ref('pending')
const loadingMore = ref(false)
const testimonials = ref([])
const loadMoreAnchor = ref(null)

const hasMore = computed(() => testimonials.value.length < total.value)

const mergeTestimonials = (items, nextPage) => {
  if (nextPage === 1) {
    testimonials.value = items
    return
  }

  const seenIds = new Set(
    testimonials.value.map((testimonial) => testimonial.id),
  )
  const nextItems = items.filter((testimonial) => !seenIds.has(testimonial.id))

  testimonials.value = testimonials.value.concat(nextItems)
}

const loadPage = async (nextPage = 1) => {
  if (nextPage === 1) {
    status.value = 'pending'
  } else {
    loadingMore.value = true
  }

  try {
    const result = await $fetch('/api/testimonials/all', {
      query: {
        page: nextPage,
        size: PAGE_SIZE,
      },
    })

    total.value = result.count || 0
    page.value = nextPage
    mergeTestimonials(result.data || [], nextPage)
    status.value = 'success'
  } catch (error) {
    if (nextPage === 1) {
      testimonials.value = []
      total.value = 0
      status.value = 'error'
    }

    toast.add(handleError(error))
  } finally {
    loadingMore.value = false
  }
}

await loadPage(1)

useInfiniteScroll(
  loadMoreAnchor,
  () => {
    if (!hasMore.value || loadingMore.value || status.value === 'pending') {
      return
    }

    loadPage(page.value + 1)
  },
  {
    distance: 200,
    canLoadMore: () => hasMore.value && !loadingMore.value,
  },
)

useSeoMeta({
  title: 'Shoutouts',
})
</script>
