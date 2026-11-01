<template>
  <USidebar
    v-if="authenticated"
    v-model:open="sidebarOpen"
    title="Wishlist Settings"
    collapsible="offcanvas"
    side="right"
    :ui="{
      container: 'border-none',
    }"
  >
    <UForm :state="tradingConfig" class="flex flex-col gap-6">
      <!-- What the list is for decides its sections and collections -->
      <UTabs
        v-model="tradingConfig.type"
        :items="typeItems"
        :content="false"
        size="sm"
        aria-label="List type"
        :ui="{ trigger: 'flex-1' }"
        @update:model-value="resetTradingState"
      />

      <fieldset class="flex flex-col gap-4">
        <legend :class="legendClass">
          {{ trading ? 'Want' : 'List' }}
        </legend>

        <UFormField
          label="Collection"
          name="want_collection"
          :help="
            tradingConfig.buying.collection
              ? undefined
              : 'Start here: pick the collection to turn into a wishlist.'
          "
        >
          <USelect
            v-model="tradingConfig.buying.collection"
            :items="collectionItems(tradingConfig.type)"
            label-key="name"
            value-key="id"
            placeholder="Pick a collection"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Title" name="want_title">
          <UInput
            v-model.trim="tradingConfig.buying.title"
            icon="hugeicons:text-font"
            :placeholder="
              tradingConfig.type === 'selling'
                ? tradingConfig.selling.placeholder
                : tradingConfig.buying.placeholder
            "
            class="w-full"
          />
        </UFormField>
      </fieldset>

      <fieldset v-if="trading" class="flex flex-col gap-4">
        <legend :class="legendClass">Have</legend>

        <UFormField label="Collection" name="have_collection">
          <USelect
            v-model="tradingConfig.selling.collection"
            :items="collectionItems('selling')"
            label-key="name"
            value-key="id"
            placeholder="Pick a collection"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Title" name="have_title">
          <UInput
            v-model.trim="tradingConfig.selling.title"
            icon="hugeicons:text-font"
            :placeholder="tradingConfig.selling.placeholder"
            class="w-full"
          />
        </UFormField>
      </fieldset>

      <fieldset class="flex flex-col gap-4">
        <legend :class="legendClass">Layout</legend>

        <UFormField
          :label="countLabel(tradingConfig.columns, 'column')"
          name="layout_columns"
        >
          <USlider v-model="tradingConfig.columns" :min="1" :max="10" />
        </UFormField>
      </fieldset>

      <fieldset class="flex flex-col gap-4">
        <legend :class="legendClass">Contact</legend>

        <UInput
          v-model.trim="tradingConfig.social.discord"
          icon="hugeicons:discord"
          placeholder="Discord username"
          aria-label="Discord"
          class="w-full"
        />
        <UInput
          v-model.trim="tradingConfig.social.reddit"
          icon="hugeicons:reddit"
          placeholder="u/username"
          aria-label="Reddit"
          class="w-full"
        />
        <UInput
          v-model.trim="tradingConfig.social.qq"
          icon="hugeicons:bubble-chat"
          placeholder="QQ number"
          aria-label="QQ"
          class="w-full"
        />
      </fieldset>

      <!-- Seller terms; buying lists have none. -->
      <fieldset
        v-if="tradingConfig.type !== 'buying'"
        class="flex flex-col gap-3"
      >
        <legend :class="legendClass">Terms</legend>

        <USwitch
          v-model="tradingConfig.shipping_included"
          label="Shipping included"
        />
        <USwitch
          v-model="tradingConfig.fnf_only"
          label="PayPal F&F only"
          description="Buyers get no PayPal buyer protection."
        />
      </fieldset>
    </UForm>
  </USidebar>
</template>

<script setup>
const userStore = useUserStore()
const { authenticated, collections, social } = storeToRefs(userStore)

const sidebarOpen = useState('wishlist-sidebar-open', () => true)

const intentMap = {
  buying: ['keep', 'want'],
  selling: ['keep', 'sell'],
  trading: ['keep', 'want'],
}

const tradingConfig = useTradingConfig()

const typeItems = [
  { label: 'Buying', value: 'buying' },
  { label: 'Selling', value: 'selling' },
  { label: 'Trading', value: 'trading' },
]

// The user's artisan collections that fit a list of this type
const collectionItems = (type) =>
  collections.value.filter(
    (c) => c.category === 'artisan' && intentMap[type].includes(c.intent),
  )

// Each group of settings opens with a small mono heading
const legendClass =
  'mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted'

const resetTradingState = () => {
  tradingConfig.value.buying = {
    collection: undefined,
    title: '',
    placeholder: 'WTB/WTTF',
  }
  tradingConfig.value.selling = {
    collection: undefined,
    title: '',
    placeholder: 'WTS/WTT',
  }
  tradingConfig.value.fnf_only = false
  tradingConfig.value.shipping_included = false
}

const trading = computed(() => tradingConfig.value.type === 'trading')
watch(trading, () => {
  if (trading.value) {
    tradingConfig.value.selling.placeholder = 'WTS/WTT'
  }
})

watch(social, (value) => {
  tradingConfig.value.social = value
})
</script>
