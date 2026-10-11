<template>
  <UPageCard
    :title="colorwayTitle(item.artisan)"
    reverse
    :highlight="highlighted"
    :ui="{
      root: 'h-full flex flex-col',
      container: compact
        ? 'h-full grid grid-rows-[auto_minmax(0,1fr)] p-3 sm:p-3 gap-y-2'
        : 'h-full grid grid-rows-[auto_minmax(0,1fr)]',
      title: compact ? 'text-sm' : undefined,
      body: 'w-full',
      description: 'flex items-baseline justify-between gap-2',
      footer: compact ? 'flex flex-wrap gap-2 pt-2' : 'flex flex-wrap gap-2',
    }"
    :class="highlighted ? 'bg-success/30' : ''"
  >
    <div class="relative aspect-square overflow-hidden">
      <NuxtImg
        :loading="eager ? 'eager' : 'lazy'"
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
          :name="buying ? 'hugeicons:tick-double-02' : 'hugeicons:unavailable'"
          :class="[
            buying ? 'text-success' : 'text-error',
            compact ? 'text-6xl' : 'text-9xl',
          ]"
        />
      </span>
    </div>

    <template v-if="item.exchange && item.asking_price" #description>
      <span
        class="font-medium tracking-widest uppercase text-gray-400"
        :class="compact ? 'text-[10px]' : 'text-xs'"
      >
        {{ buying ? 'Offering' : 'Asking' }}
      </span>
      <span
        class="font-mono font-bold opacity-90"
        :class="[
          item.priority ? 'text-error' : 'text-info',
          compact ? 'text-xl' : 'text-3xl',
        ]"
      >
        {{ item.asking_price }}
      </span>
    </template>

    <template v-if="$slots.actions" #footer>
      <slot name="actions" />
    </template>
  </UPageCard>
</template>

<script setup>
const { item, buying } = defineProps({
  item: {
    type: Object,
    required: true,
  },
  buying: Boolean,
  // Smaller text and icons for the two-column editor on phones.
  compact: Boolean,
  // The export sheet is rendered offscreen, where lazy images never load.
  eager: Boolean,
})

const highlighted = computed(() => buying && !!item.priority)
</script>
