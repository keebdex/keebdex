<template>
  <div
    class="flex flex-col gap-8 bg-(--ui-bg)"
    :class="[
      compact ? 'p-3' : 'p-6',
      // The editor shows the sheet as the page it exports to
      editable && 'rounded-xl shadow-sm ring ring-default',
    ]"
    :style="sheetStyle"
  >
    <header
      class="flex flex-wrap items-center justify-between gap-4 border-b border-default pb-5"
      :class="compact && 'flex-col items-start'"
    >
      <AppWordmark :size="compact ? 'lg' : 'xl'" />

      <div v-if="contacts.length" class="flex flex-wrap gap-2">
        <UBadge
          v-for="contact in contacts"
          :key="contact.icon"
          :icon="contact.icon"
          :label="contact.label"
          size="xl"
          :class="[contact.class, 'bg-transparent']"
        />
      </div>
    </header>

    <section
      v-for="section in sections"
      :key="section.key"
      class="flex flex-col gap-4"
    >
      <h2 class="flex items-center gap-3">
        <span
          class="w-1.5 self-stretch rounded-full"
          :class="section.buying ? 'bg-info' : 'bg-warning'"
        />
        <span
          class="font-bold text-highlighted"
          :class="compact ? 'text-2xl' : 'text-4xl'"
        >
          {{ section.title }}
        </span>
        <!-- The seller's terms, beside the caps they apply to, where buyers
        read the prices -->
        <span
          v-if="!section.buying && terms.length"
          class="ms-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-1 font-semibold"
          :class="compact ? 'text-xs' : 'text-sm'"
        >
          <span
            v-for="term in terms"
            :key="term.label"
            class="flex items-center gap-1"
            :class="term.class"
          >
            <UIcon :name="term.icon" class="size-4 shrink-0" />
            {{ term.label }}
          </span>
        </span>
      </h2>

      <ArtisanWishlistGrid
        :data="section.items"
        :editable="editable"
        :compact="compact"
        :buying="section.buying"
        @on-remove="$emit('remove', $event)"
        @on-highlight="$emit('highlight', $event)"
        @on-reorder="$emit('reorder', $event)"
      />
    </section>

    <footer
      class="flex items-center justify-between gap-4 border-t border-default pt-4 text-muted"
    >
      <span class="font-mono text-sm">{{ formatDate(isoToday()) }}</span>
      <AppWordmark size="sm" domain />
    </footer>
  </div>
</template>

<script setup>
defineEmits(['remove', 'highlight', 'reorder'])

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

// Want first, then Have on a trading list; an empty section is left out
const sections = computed(() =>
  wishlistSections(tradingCfg.value, buyingItems, sellingItems).filter(
    (section) => section.items.length,
  ),
)

// Seller terms; buying lists have none
const terms = computed(() =>
  [
    tradingCfg.value.shipping_included && {
      label: 'Shipping Included',
      icon: 'solar:delivery-bold-duotone',
      class: 'text-info',
    },
    tradingCfg.value.fnf_only && {
      label: 'PayPal F&F Only, No Buyer Protection',
      icon: 'solar:danger-triangle-bold-duotone',
      class: 'text-warning',
    },
  ].filter(Boolean),
)

const contacts = computed(() => {
  const { discord, reddit, qq } = tradingCfg.value.social

  return [
    discord && {
      icon: 'simple-icons:discord',
      label: discord,
      class: 'text-(--color-discord)',
    },
    reddit && {
      icon: 'simple-icons:reddit',
      label: reddit,
      class: 'text-(--color-reddit)',
    },
    qq && { icon: 'simple-icons:qq', label: qq, class: 'text-(--color-qq)' },
  ].filter(Boolean)
})

// Widest section decides the sheet width (plus the p-6 padding).
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

  const width = `calc(${wishlistGridWidth(sheetColumns.value)} + 3rem)`

  return editable
    ? { width: `min(100%, ${width})`, marginInline: 'auto' }
    : { width }
})
</script>
