<template>
  <!-- Keysets as cards (a profile's catalog, the group buy tabs): the cover,
       the name, its dates and phase, and Save; then the pagination -->
  <div class="space-y-6">
    <UPageGrid v-if="keysets.length">
      <SharedCatalogCard
        v-for="keyset in keysets"
        :key="keyset.id"
        :title="
          keyset.profile ? `${keyset.profile.name} ${keyset.name}` : keyset.name
        "
        :description="cardDescription(keyset)"
        :img="keyset.img"
        fallback="/keyset.png"
        :to="`/keyset/${keyset.profile_keyset_id}`"
      >
        <template #badges>
          <div class="absolute top-2 left-2 flex flex-wrap gap-1">
            <UBadge
              v-if="countdown && keysetPhase(keyset) === 'Live'"
              :label="groupBuyCountdown(keyset).label"
              :color="groupBuyCountdown(keyset).color"
              variant="solid"
            />
            <!-- Confirmed is most of the catalog, so only the other phases
                 get a badge -->
            <UBadge
              v-else-if="keysetPhase(keyset) && keysetPhase(keyset) !== 'Confirmed'"
              :label="keysetPhase(keyset)"
              :color="keysetPhaseColors[keysetPhase(keyset)]"
              variant="solid"
            />
          </div>
        </template>

        <template v-if="authenticated" #footer-start>
          <SharedSaveToCollection
            :item="keyset"
            category="keyset"
            label="Save"
            keep-label
            @on-select="saveTo"
          />
        </template>
      </SharedCatalogCard>
    </UPageGrid>

    <slot v-else name="empty" />

    <UPagination
      v-if="total > size"
      :page="page"
      :items-per-page="size"
      :total="total"
      class="border-t border-default pt-4"
      :ui="{
        list: 'justify-center',
      }"
      @update:page="$emit('update:page', $event)"
    />
  </div>
</template>

<script setup>
defineProps({
  keysets: {
    type: Array,
    default: () => [],
  },
  page: {
    type: Number,
    default: 1,
  },
  size: {
    type: Number,
    default: 36,
  },
  total: {
    type: Number,
    default: 0,
  },
  // Live sets show the days left instead of the Live badge (the group buy
  // tab, where every set is live)
  countdown: Boolean,
})

defineEmits(['update:page'])

const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)

// The group buy window when there is one, else the interest check date
const cardDescription = (keyset) => {
  const range = formatDateRange(keyset.start_date, keyset.end_date)
  if (range) return range

  return keyset.ic_date ? `IC ${formatDate(keyset.ic_date)}` : ''
}

const { addItem } = useCollectionItem()

const saveTo = (collection, keyset) => {
  addItem(collection, { keyset_item_id: keyset.profile_keyset_id }, keyset.name)
}
</script>
