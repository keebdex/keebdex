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
      :highlight="buying && item.priority"
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
            name="hugeicons:shopping-cart-check-02"
            class="text-success text-9xl"
          />
          <UIcon
            v-else
            name="hugeicons:shopping-cart-remove-02"
            class="text-error text-9xl"
          />
        </span>
      </div>

      <template v-if="!copying" #footer>
        <UTooltip text="Priority" :delay-duration="0">
          <UButton
            v-if="buying"
            icon="hugeicons:shopping-bag-favorite"
            @click="$emit('onHighlight', item.id)"
          />
        </UTooltip>
        <UTooltip text="Remove" :delay-duration="0">
          <UButton
            icon="hugeicons:shopping-bag-remove"
            color="error"
            @click="$emit('onRemove', item)"
          />
        </UTooltip>
      </template>
    </UPageCard>
  </UPageGrid>
</template>

<script setup>
import sortBy from 'lodash.sortby'

defineEmits(['onRemove', 'onHighlight'])

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
