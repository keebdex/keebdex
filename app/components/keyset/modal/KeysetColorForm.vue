<template>
  <UForm :schema="schema" :state="color" class="space-y-4" @submit="onSubmit">
    <UFormField name="name" required>
      <UInputMenu
        ref="inputMenu"
        v-model="selectedColors"
        v-model:search-term="term"
        multiple
        :items="colorOptions"
        :loading="status === 'pending'"
        ignore-filter
        icon="hugeicons:paint-board"
        placeholder="Which color are you looking for?"
        label-key="code"
        class="w-full"
      >
        <template #item="{ item }">
          <UUser :name="`${item.system} ${item.code}`" :description="item.name">
            <template #avatar>
              <UAvatar :style="{ backgroundColor: item.hex }" />
            </template>
          </UUser>
        </template>

        <template #tags-item-text="{ item }">
          {{ item.system }} {{ item.code }}
        </template>

        <template #content-bottom>
          <div
            v-if="status === 'pending' && colorOptions.length"
            class="px-3 py-2 text-center text-xs text-muted"
          >
            Loading more colors...
          </div>
        </template>
      </UInputMenu>
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { useInfiniteScroll } from '@vueuse/core'
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const route = useRoute()
const toast = useToast()

const inputMenu = ref()
const term = ref('')
const page = ref(1)
const size = ref(20)
const colorOptions = ref([])
const selectedColors = ref([])

const { data, status, shouldSearch, normalizedTerm } = useAdvancedSearch(
  '/api/colors',
  {
    key: 'keyset-color-form-search',
    term,
    minLength: 2,
    pagination: {
      page,
      size,
    },
  },
)

const hasMore = computed(() => {
  const count = data.value?.count || 0
  return colorOptions.value.length < count
})

watch(normalizedTerm, () => {
  page.value = 1
  colorOptions.value = []
})

watch(
  () => data.value?.data || [],
  (items) => {
    if (!shouldSearch.value || page.value === 1) {
      colorOptions.value = items
      return
    }

    const seen = new Set(colorOptions.value.map((item) => item.id))
    const nextItems = items.filter((item) => !seen.has(item.id))

    colorOptions.value = colorOptions.value.concat(nextItems)
  },
  { immediate: true },
)

useInfiniteScroll(
  () => inputMenu.value?.viewportRef,
  () => {
    if (!hasMore.value || status.value === 'pending' || !shouldSearch.value) {
      return
    }

    page.value += 1
  },
  {
    distance: 16,
    canLoadMore: () =>
      Boolean(inputMenu.value?.viewportRef) &&
      hasMore.value &&
      status.value !== 'pending' &&
      shouldSearch.value,
  },
)

const color = computed(() => {
  return {
    profile_keyset_id: `${route.params.profile}/${route.params.keyset}`,
    color_ids: selectedColors.value.map((c) => c.id),
  }
})

const schema = z.object({
  profile_keyset_id: z.string(),
  color_ids: z.number().array().min(1),
})

const onSubmit = async () => {
  await $fetch(`/api/keysets/${color.value.profile_keyset_id}/colors`, {
    method: 'post',
    body: color.value,
  })
    .then(() => {
      toast.add(handleSuccess('save', 'Colors'))

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
