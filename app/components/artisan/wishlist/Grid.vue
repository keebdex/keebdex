<template>
  <draggable
    v-if="editable"
    :list="data"
    item-key="id"
    :group="buying ? 'wishlist-want' : 'wishlist-have'"
    class="grid"
    :class="compact ? 'gap-3' : 'gap-4'"
    :style="gridStyle"
    :delay="200"
    :delay-on-touch-only="true"
    :touch-start-threshold="5"
  >
    <template #item="{ element: item }">
      <div class="cursor-move">
        <ArtisanWishlistItem :item="item" :buying="buying" :compact="compact">
          <template #actions>
            <UTooltip text="Priority" :delay-duration="0">
              <UButton
                v-if="buying && item.exchange"
                icon="hugeicons:shopping-bag-favorite"
                :color="item.priority ? 'success' : 'neutral'"
                :size="compact ? 'sm' : 'md'"
                @click="$emit('onHighlight', item.id)"
              />
            </UTooltip>

            <UTooltip text="Remove" :delay-duration="0">
              <UButton
                icon="hugeicons:shopping-bag-remove"
                color="error"
                :size="compact ? 'sm' : 'md'"
                @click="$emit('onRemove', item)"
              />
            </UTooltip>
          </template>
        </ArtisanWishlistItem>
      </div>
    </template>
  </draggable>

  <div v-else class="grid gap-4" :style="gridStyle">
    <ArtisanWishlistItem
      v-for="item in data"
      :key="item.id"
      :item="item"
      :buying="buying"
    />
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'

defineEmits(['onRemove', 'onHighlight'])

const tradingCfg = useTradingConfig()

const { data, editable, compact } = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  // Drag-and-drop editor with actions; otherwise a static grid for export.
  editable: Boolean,
  // Two columns on phones; the exported image keeps the configured columns.
  compact: Boolean,
  // Want items (priority flag, "found" mark); each section drags on its own.
  buying: Boolean,
})

const gridColumns = computed(() => {
  if (compact) return 2

  return wishlistColumns(data.length, tradingCfg.value.columns)
})

const gridStyle = computed(() => {
  const columns = gridColumns.value
  const style = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  }

  if (compact) return style

  const width = wishlistGridWidth(columns)

  // The editor shrinks with the window; the export keeps its full width.
  return { ...style, width: editable ? `min(100%, ${width})` : width }
})
</script>
