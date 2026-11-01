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

      <!-- Found or sold: stamped across the photo -->
      <span
        v-if="!item.exchange"
        class="absolute inset-0 flex items-center justify-center"
      >
        <span
          class="-rotate-12 rounded-md border-2 bg-default/80 font-mono font-bold uppercase tracking-widest"
          :class="[
            buying ? 'border-success text-success' : 'border-error text-error',
            compact ? 'px-2 py-0.5 text-sm' : 'px-4 py-1 text-2xl',
          ]"
        >
          {{ buying ? 'Found' : 'Sold' }}
        </span>
      </span>

      <!-- Only the star on phones, beside the editor's actions -->
      <UBadge
        v-if="highlighted"
        :label="compact ? undefined : 'Top Priority'"
        :aria-label="compact ? 'Top Priority' : undefined"
        icon="hugeicons:star"
        color="primary"
        variant="solid"
        :size="compact ? 'sm' : 'md'"
        class="absolute start-2 top-2"
      />

      <span
        v-if="item.exchange && item.asking_price"
        class="absolute bottom-2 end-2 flex items-baseline gap-1 rounded-md bg-default/90 font-mono ring ring-default"
        :class="compact ? 'px-1 py-px' : 'px-2 py-0.5'"
      >
        <span
          class="uppercase tracking-wider text-muted"
          :class="compact ? 'text-[9px]' : 'text-[10px]'"
        >
          {{ buying ? 'Offer' : 'Ask' }}
        </span>
        <span
          class="font-bold text-highlighted"
          :class="compact ? 'text-xs' : 'text-base'"
        >
          {{ item.asking_price }}
        </span>
      </span>

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
