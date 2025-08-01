<template>
  <UPageGrid
    class="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-8 gap-4"
  >
    <UPageCard
      v-for="item in wishlist"
      :key="item.artisan.id"
      :title="item.artisan.name"
      :description="item.artisan?.sculpt.name"
      orientation="vertical"
      reverse
      spotlight
      :ui="{
        root: 'h-full',
        wrapper: 'flex-1',
      }"
    >
      <div class="relative aspect-square overflow-hidden">
        <NuxtImg
          loading="lazy"
          :alt="item.artisan.name"
          :src="item.artisan.img"
          class="w-full h-full object-cover rounded"
          :class="{
            grayscale: !item.exchange,
          }"
        />
        <span
          v-if="!item.exchange"
          class="absolute inset-0 flex items-center justify-center"
        >
          <UIcon
            v-if="buying"
            name="hugeicons:shopping-basket-done-03"
            class="text-success text-9xl"
          />
          <UIcon
            v-else
            name="hugeicons:shopping-basket-remove-03"
            class="text-error text-9xl"
          />
        </span>
      </div>

      <template v-if="!copying" #footer>
        <!-- <UButton icon="hugeicons:highlighter"> Priority </UButton> -->
        <UButton color="error" @click="$emit('onRemove', item)">
          Remove
        </UButton>
      </template>
    </UPageCard>
  </UPageGrid>
</template>

<script setup>
import sortBy from 'lodash.sortby'

defineEmits(['onRemove'])

const wishlist = ref([])

const { data } = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  copying: Boolean,
  buying: Boolean,
  selling: Boolean,
})

onBeforeMount(() => {
  wishlist.value = sortBy(data, 'id')
})

watch(
  () => data,
  () => {
    wishlist.value = sortBy(data, 'id')
  },
)
</script>
