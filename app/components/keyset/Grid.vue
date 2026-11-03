<template>
  <!-- Keysets as cards (a profile's catalog, the group buy tabs): the cover,
       the name, its dates and phase, and Save; then the pagination -->
  <div class="space-y-6">
    <UPageGrid v-if="cards.length">
      <SharedCatalogCard
        v-for="{ keyset, badge } in cards"
        :key="keyset.id"
        :title="
          keyset.profile ? `${keyset.profile.name} ${keyset.name}` : keyset.name
        "
        :description="keysetDateLabel(keyset)"
        :img="keyset.img"
        fallback="/keyset.png"
        :to="`/keyset/${keyset.profile_keyset_id}`"
      >
        <template v-if="badge" #badges>
          <UBadge v-bind="badge" variant="solid" class="absolute top-2 left-2" />
        </template>

        <template v-if="authenticated" #footer-start>
          <SharedSaveToCollection
            :item="keyset"
            category="keyset"
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
const props = defineProps({
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

// Each card with its badge, worked out once against one date: the days left
// on the Live tab (`countdown`), else the phase, except Confirmed, which is
// most of the catalog
const cards = computed(() => {
  const today = isoToday()

  return props.keysets.map((keyset) => {
    const phase = keysetPhase(keyset, today)
    let badge = null

    if (props.countdown && phase === 'Live') {
      const { label, color } = groupBuyCountdown(keyset, today)
      badge = { label, color }
    } else if (phase && phase !== 'Confirmed') {
      badge = { label: phase, color: keysetPhaseColors[phase] }
    }

    return { keyset, badge }
  })
})

const userStore = useUserStore()
const { authenticated } = storeToRefs(userStore)

const { addItem } = useCollectionItem()

const saveTo = (collection, keyset) => {
  addItem(collection, { keyset_item_id: keyset.profile_keyset_id }, keyset.name)
}
</script>
