<template>
  <UPageGrid>
    <UPageCard
      v-for="{ artisan, exchange } in wishlist"
      :key="artisan.id"
      :title="artisan.name"
      :description="artisan?.sculpt.name"
      orientation="vertical"
      reverse
      spotlight
      :ui="{
        root: 'h-full overflow-hidden',
        wrapper: 'flex-1',
      }"
    >
      <div class="aspect-square overflow-hidden">
        <NuxtImg
          loading="lazy"
          :alt="artisan.name"
          :src="artisan.img"
          class="w-full h-full object-cover rounded"
        />
      </div>

      <UIcon
        v-if="!exchange"
        class="absolute inset-0 !flex items-center justify-center !text-[80px]"
        :name="
          buying
            ? 'hugeicons:shopping-basket-done-03'
            : 'hugeicons:shopping-basket-remove-03'
        "
      />

      <template #footer>
        <UButton @click="$emit('onRemove', element)"> Remove </UButton>
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
