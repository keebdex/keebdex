<template>
  <!-- A catalog grid card (keyboard variant, keyset kit, artisan colorway):
       image, name with its price, a short description, then a footer with
       `footer-start` (Save, units) on the left and, on the right, the page's
       own actions (`footer-end`) then the record's. Clicks on the card itself
       are the page's (`@click`), or it links to `to` (a sculpt, keyboard, or
       keyset in a list). -->
  <UPageCard
    :title="title"
    :description="description || undefined"
    :to="to"
    reverse
    spotlight
    :highlight="highlight"
    :ui="cardUi"
  >
    <template #title>
      <div class="flex items-baseline justify-between gap-3">
        <span class="truncate">{{ title }}</span>
        <span
          v-if="price"
          class="shrink-0 tabular-nums"
          :class="priceStruck && 'line-through text-muted'"
        >
          {{ price }}
        </span>
      </div>
    </template>

    <div
      class="relative overflow-hidden rounded"
      :class="aspect === 'square' ? 'aspect-square' : 'aspect-video'"
    >
      <NuxtImg
        v-if="img || fallback"
        :preset="aspect === 'square' ? 'square' : 'cover'"
        loading="lazy"
        decoding="async"
        :alt="title"
        :src="img || fallback"
        class="w-full h-full object-cover"
        :class="dimmed && 'grayscale'"
      />
      <!-- No photo and no stand-in image: an icon, with Add Photo under it -->
      <div
        v-else
        class="w-full h-full bg-elevated flex flex-col items-center justify-center gap-3 text-dimmed"
      >
        <UIcon name="solar:gallery-bold-duotone" class="size-10" />
        <UButton
          v-if="suggestable"
          v-bind="addPhotoButton"
          @click.stop="emit('suggest')"
        />
      </div>

      <UButton
        v-if="!img && fallback && suggestable"
        v-bind="addPhotoButton"
        class="absolute bottom-2 right-2"
        @click.stop="emit('suggest')"
      />

      <!-- Badges over the image; the caller positions them -->
      <slot name="badges" />
    </div>

    <template
      v-if="
        $slots['footer-start'] ||
        $slots['footer-end'] ||
        editable ||
        suggestable
      "
      #footer
    >
      <div class="flex w-full flex-wrap items-center gap-2" @click.stop>
        <slot name="footer-start" />

        <!-- Ghost icon buttons on the right: the page's own (`footer-end`,
             e.g. a collection item's Edit Listing and Remove), then the
             record's Edit / History / Delete -->
        <div class="ms-auto flex items-center gap-1">
          <slot name="footer-end" />

          <SharedRecordActions
            ghost
            :editable="editable"
            :suggestable="suggestable"
            @edit="emit('edit')"
            @suggest="emit('suggest')"
            @history="emit('history')"
            @delete="emit('delete')"
          />
        </div>
      </div>
    </template>
  </UPageCard>
</template>

<script setup lang="ts">
const {
  description = '',
  to = undefined,
  price = '',
  img = '',
  fallback = '',
  aspect = 'video',
} = defineProps<{
  title: string
  description?: string | null
  to?: string
  // Already formatted
  price?: string | null
  // Cancelled: the price is shown struck through
  priceStruck?: boolean
  img?: string | null
  // Stand-in image when there is no photo; without one, an icon
  fallback?: string
  aspect?: 'video' | 'square'
  // Greyed out (a found or sold cap, an item gone from the catalog)
  dimmed?: boolean
  // Outlined in the primary color (a wishlist's top priority cap)
  highlight?: boolean
  // Passed to `SharedRecordActions`; suggesters also get Add Photo, which
  // suggests an edit like Edit does
  editable?: boolean
  suggestable?: boolean
}>()

const emit = defineEmits<{
  edit: []
  suggest: []
  history: []
  delete: []
}>()

const cardUi = {
  root: 'h-full flex flex-col',
  container: imageCardContainerClass,
  body: 'w-full',
  description: 'text-sm line-clamp-2',
}

const addPhotoButton = {
  label: 'Add Photo',
  icon: 'solar:gallery-add-bold-duotone',
  size: 'sm',
  ui: { label: 'block' },
} as const
</script>
