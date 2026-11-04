<template>
  <figure class="flex h-full flex-col gap-2">
    <div
      class="relative aspect-square overflow-hidden rounded-xl bg-elevated ring"
      :class="highlighted ? 'ring-2 ring-primary' : 'ring-default'"
    >
      <NuxtImg
        loading="lazy"
        :alt="item.artisan.name"
        :src="item.artisan.img"
        class="size-full object-cover"
        :class="{ 'opacity-50 grayscale': !item.exchange }"
      />

      <ArtisanListingMarks :item="item" :buying="buying" :compact="compact" />

      <!-- Editor actions, never in the exported image -->
      <div
        v-if="$slots.actions"
        class="absolute end-2 top-2 flex gap-1"
        @pointerdown.stop
      >
        <slot name="actions" />
      </div>
    </div>

    <figcaption class="min-w-0 px-0.5">
      <p
        class="truncate font-semibold text-highlighted"
        :class="compact ? 'text-sm' : 'text-base'"
      >
        {{ item.artisan.name }}
      </p>
      <p class="truncate text-muted" :class="compact ? 'text-xs' : 'text-sm'">
        {{ colorwayCaption(item.artisan) }}
      </p>
    </figcaption>
  </figure>
</template>

<script setup>
const { item, buying } = defineProps({
  item: {
    type: Object,
    required: true,
  },
  buying: Boolean,
  // Smaller text and badges for the two-column editor on phones.
  compact: Boolean,
})

// Top priority only means something on a list of caps wanted
const highlighted = computed(() => buying && !!item.priority)
</script>
