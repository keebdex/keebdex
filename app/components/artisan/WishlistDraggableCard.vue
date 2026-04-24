<template>
  <draggable
    :list="data"
    item-key="id"
    group="group"
    class="grid gap-4"
    :style="gridStyle"
  >
    <template #item="{ element: item }">
      <div class="cursor-move">
        <UPageCard
          :title="colorwayTitle(item.artisan)"
          reverse
          :highlight="buying && item.priority"
          :ui="{
            root: 'h-full flex flex-col',
            container: 'h-full grid grid-rows-[auto_minmax(0,1fr)]',
            body: `flex items-center justify-between w-full gap-4 ${item.exchange && item.asking_price ? 'divide-x divide-default' : ''}`,
            footer: 'flex flex-wrap gap-2',
          }"
          :class="
            buying && item.priority && tradingCfg.highlight_filled
              ? 'bg-success/30'
              : ''
          "
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
                name="hugeicons:tick-double-02"
                class="text-success text-9xl"
              />
              <UIcon
                v-else
                name="hugeicons:unavailable"
                class="text-error text-9xl"
              />
            </span>
          </div>

          <template #body>
            <UUser
              :name="colorwayTitle(item.artisan)"
              size="xl"
              class="flex-1"
              :ui="{
                name: 'font-bold',
              }"
            />

            <span
              v-if="item.exchange"
              class="text-4xl font-bold"
              :class="{
                'text-error': item.priority,
              }"
            >
              {{ item.asking_price }}
            </span>
          </template>

          <template v-if="!copying" #footer>
            <UTooltip text="Priority" :delay-duration="0">
              <UButton
                v-if="buying && item.exchange"
                label="Priority"
                icon="hugeicons:shopping-bag-favorite"
                :color="item.priority ? 'success' : 'neutral'"
                @click="$emit('onHighlight', item.id)"
              />
            </UTooltip>

            <UTooltip text="Remove" :delay-duration="0">
              <UButton
                label="Remove"
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

const tradingCfg = useState('trading-config')

const { data } = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  copying: Boolean,
  buying: Boolean,
  selling: Boolean,
})

const gridColumns = computed(() => {
  const configuredColumns = Math.max(1, tradingCfg.value.columns || 1)
  const itemCount = data.length

  if (itemCount > 0 && itemCount < configuredColumns) {
    return itemCount
  }

  return configuredColumns
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridColumns.value}, minmax(0, 1fr))`,
  width: `min(100%, calc(${gridColumns.value} * var(--wishlist-card-width) + ${Math.max(gridColumns.value - 1, 0)} * var(--wishlist-grid-gap)))`,
}))
</script>
