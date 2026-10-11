<template>
  <div class="bg-(--ui-bg) p-4 flex flex-col gap-4" :style="sheetStyle">
    <UPageHeader
      :ui="{
        root: 'border-none',
        links: compact ? 'flex-wrap' : undefined,
      }"
    >
      <template #title>
        <AppWordmark size="xl" />
      </template>

      <template #links>
        <UBadge
          v-if="tradingCfg.social.discord"
          icon="hugeicons:discord"
          size="xl"
          class="text-(--color-discord) bg-transparent"
        >
          {{ tradingCfg.social.discord }}
        </UBadge>

        <UBadge
          v-if="tradingCfg.social.reddit"
          icon="hugeicons:reddit"
          size="xl"
          class="text-(--color-reddit) bg-transparent"
        >
          {{ tradingCfg.social.reddit }}
        </UBadge>

        <UBadge
          v-if="tradingCfg.social.qq"
          icon="basil:qq-outline"
          size="xl"
          class="text-(--color-qq) bg-transparent"
        >
          {{ tradingCfg.social.qq }}
        </UBadge>

        <UBadge
          v-if="tradingCfg.shipping_included"
          icon="hugeicons:package-moving"
          size="xl"
          color="info"
          class="bg-transparent"
        >
          Shipping Included
        </UBadge>
      </template>

      <template #description>
        <UAlert
          v-if="editable && totalItems > 24"
          icon="hugeicons:information-circle"
          variant="subtle"
          color="info"
          class="mt-4"
        >
          <template #description>
            For optimal image display, it's <strong>recommended</strong> to keep
            your wishlist between 16-24 items.
          </template>
        </UAlert>

        <UAlert
          v-if="tradingCfg.fnf_only"
          icon="hugeicons:alert-02"
          title="No PayPal Buyer Protection"
          description="Please note that the seller does not accept PayPal Goods & Services (G&S). This means that if you choose to proceed with the transaction, you will not have PayPal's buyer protection in place."
          variant="subtle"
          color="warning"
          class="mt-4"
        />
      </template>
    </UPageHeader>

    <USeparator
      v-if="buyingItems.length"
      :label="buyingTitle"
      :ui="{
        label: compact
          ? 'text-2xl font-bold text-info'
          : 'text-3xl sm:text-4xl font-bold text-info',
      }"
    />

    <ArtisanWishlistCard
      :data="buyingItems"
      :editable="editable"
      :compact="compact"
      :buying="tradingCfg.type !== 'selling'"
      @on-remove="$emit('remove', $event)"
      @on-highlight="$emit('highlight', $event)"
    />

    <USeparator
      v-if="sellingItems.length && trading"
      :label="tradingCfg.selling.title || tradingCfg.selling.placeholder"
      :ui="{
        label: compact
          ? 'text-2xl font-bold text-warning'
          : 'text-3xl sm:text-4xl font-bold text-warning',
      }"
    />

    <ArtisanWishlistCard
      v-if="trading"
      :data="sellingItems"
      :editable="editable"
      :compact="compact"
      selling
      @on-remove="$emit('remove', $event)"
    />

    <USeparator class="mt-8">
      <AppWordmark />
    </USeparator>
  </div>
</template>

<script setup>
defineEmits(['remove', 'highlight'])

const { buyingItems, sellingItems, editable, compact } = defineProps({
  buyingItems: {
    type: Array,
    default: () => [],
  },
  sellingItems: {
    type: Array,
    default: () => [],
  },
  // The on-screen editor; without it the sheet is the exported image.
  editable: Boolean,
  // Two-column editor on phones.
  compact: Boolean,
})

const tradingCfg = useTradingConfig()
const trading = computed(() => tradingCfg.value.type === 'trading')

const buyingTitle = computed(
  () =>
    tradingCfg.value.buying.title ||
    (tradingCfg.value.type === 'selling'
      ? tradingCfg.value.selling.placeholder
      : tradingCfg.value.buying.placeholder),
)

const totalItems = computed(
  () => buyingItems.length + (trading.value ? sellingItems.length : 0),
)

// Widest section decides the sheet width (plus the p-4 padding).
const sheetColumns = computed(() => {
  const columns = (items) =>
    items.length ? wishlistColumns(items.length, tradingCfg.value.columns) : 0

  return Math.max(
    1,
    columns(buyingItems),
    trading.value ? columns(sellingItems) : 0,
  )
})

const sheetStyle = computed(() => {
  if (compact) return undefined

  const width = `calc(${wishlistGridWidth(sheetColumns.value)} + 2rem)`

  return editable
    ? { width: `min(100%, ${width})`, marginInline: 'auto' }
    : { width }
})
</script>
