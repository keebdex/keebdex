<template>
  <draggable
    :list="data"
    item-key="id"
    group="group"
    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 4xl:grid-cols-9 gap-4"
  >
    <template #item="{ element: item }">
      <div class="cursor-move">
        <UPageCard
          :title="item.artisan.name"
          :description="item.artisan?.sculpt.name"
          orientation="vertical"
          reverse
          :highlight="buying && item.priority"
          :ui="{
            root: 'h-full',
            wrapper: 'flex-1',
          }"
          variant="soft"
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
                name="hugeicons:shopping-bag-check"
                class="text-success text-9xl"
              />
              <UIcon
                v-else
                name="hugeicons:unavailable"
                class="text-error text-9xl"
              />
            </span>
          </div>

          <template v-if="!copying" #footer>
            <UTooltip text="Priority" :delay-duration="0">
              <UButton
                v-if="buying"
                :disabled="!item.exchange"
                icon="hugeicons:shopping-bag-favorite"
                :color="item.priority ? 'success' : 'neutral'"
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
      </div>
    </template>
  </draggable>
</template>

<script setup>
import draggable from 'vuedraggable'

defineEmits(['onRemove', 'onHighlight'])

const { data } = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  copying: Boolean,
  buying: Boolean,
  selling: Boolean,
})
</script>
