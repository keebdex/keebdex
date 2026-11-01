<template>
  <div class="relative flex flex-1 items-center justify-center py-8">
    <!-- A faded outline of the image the list becomes -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 flex flex-col gap-6 overflow-hidden opacity-50 mask-b-from-30%"
    >
      <div class="flex items-center justify-between">
        <USkeleton class="h-10 w-40" />
        <!-- Its contacts, on wide screens only (a wrapper, since the
        skeleton's class merge drops responsive display classes) -->
        <div class="hidden sm:block">
          <USkeleton class="h-6 w-56" />
        </div>
      </div>
      <USkeleton class="h-8 w-48" />
      <div class="grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-5">
        <USkeleton
          v-for="cell in 15"
          :key="cell"
          class="aspect-square rounded-xl"
        />
      </div>
    </div>

    <UCard
      class="relative w-full max-w-md shadow-lg"
      :ui="{ body: 'flex flex-col gap-5' }"
    >
      <div>
        <h2 class="text-lg font-semibold text-highlighted">
          Start Your Wishlist Image
        </h2>
        <p class="mt-1 text-sm text-muted text-pretty">
          Pick what the list is for and the collection to build it from. You can
          fine-tune the titles, layout, and contacts in the settings.
        </p>
      </div>

      <UTabs
        :model-value="config.type"
        :items="WISHLIST_TYPE_ITEMS"
        :content="false"
        size="sm"
        aria-label="List type"
        :ui="{ trigger: 'flex-1' }"
        @update:model-value="setType"
      />

      <UFormField
        v-if="choices.length"
        :label="config.type === 'trading' ? 'Want Collection' : 'Collection'"
      >
        <USelect
          v-model="config.buying.collection"
          :items="choices"
          label-key="name"
          value-key="id"
          placeholder="Pick a Collection"
          class="w-full"
        />
      </UFormField>

      <!-- Nothing fits this type yet: the list starts in My Collection -->
      <div
        v-else
        class="flex flex-col items-start gap-3 rounded-md bg-elevated/50 p-3 text-sm text-muted"
      >
        {{ noneText }}
        <UButton
          label="Go to My Collection"
          to="/collection"
          trailing-icon="hugeicons:arrow-right-02"
          size="sm"
          :ui="{ label: 'block' }"
        />
      </div>
    </UCard>
  </div>
</template>

<script setup>
const config = useTradingConfig()
const { collectionItems, setType } = useWishlistPicker()

const choices = computed(() => collectionItems(config.value.type))

const noneText = computed(() =>
  config.value.type === 'selling'
    ? 'You have no artisan collection to sell from yet. Create a For Sale or Trade collection first.'
    : 'You have no artisan collection to build a wishlist from yet. Create a Wishlist first.',
)
</script>
