<template>
  <UForm :state="tradingConfig" class="space-y-4">
    <UFormField label="Type" name="type">
      <USelect
        v-model="tradingConfig.type"
        :items="typeItems"
        class="w-full"
        @update:model-value="resetTradingState"
      />
    </UFormField>

    <UFormField
      :label="`Layout - ${tradingConfig.columns} Column${tradingConfig.columns === 1 ? '' : 's'}`"
      name="layout_columns"
    >
      <USlider
        v-model="tradingConfig.columns"
        :min="1"
        :max="10"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="trading ? 'Want Title' : 'Title'" name="want_title">
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

    <UFormField
      :label="trading ? 'Want Collection' : 'Collection'"
      name="want_collection"
    >
      <USelect
        v-model="tradingConfig.buying.collection"
        :items="
          collections.filter(
            (c) =>
              c.category === 'artisan' &&
              intentMap[tradingConfig.type].includes(c.intent),
          )
        "
        label-key="name"
        value-key="id"
        class="w-full"
      />
    </UFormField>

    <UFormField v-if="trading" label="Have Title" name="have_title">
      <UInput
        v-model.trim="tradingConfig.selling.title"
        icon="hugeicons:text-font"
        :placeholder="tradingConfig.selling.placeholder"
        class="w-full"
      />
    </UFormField>

    <UFormField v-if="trading" label="Have Collection" name="have_collection">
      <USelect
        v-model="tradingConfig.selling.collection"
        :items="
          collections.filter(
            (c) =>
              c.category === 'artisan' && intentMap.selling.includes(c.intent),
          )
        "
        label-key="name"
        value-key="id"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Discord" name="discord">
      <UInput
        v-model.trim="tradingConfig.social.discord"
        icon="hugeicons:discord"
        placeholder="username#1234"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Reddit" name="reddit">
      <UInput
        v-model.trim="tradingConfig.social.reddit"
        icon="hugeicons:reddit"
        placeholder="u/username"
        class="w-full"
      />
    </UFormField>

    <UFormField label="QQ" name="qq">
      <UInput
        v-model.trim="tradingConfig.social.qq"
        icon="hugeicons:bubble-chat"
        placeholder="00000000"
        class="w-full"
      />
    </UFormField>

    <UFormField v-if="tradingConfig.type !== 'buying'">
      <UCheckbox
        v-model="tradingConfig.fnf_only"
        label="I do not accept PayPal G&S"
      />
    </UFormField>

    <UFormField v-if="tradingConfig.type !== 'buying'">
      <UCheckbox
        v-model="tradingConfig.shipping_included"
        label="Shipping included"
      />
    </UFormField>

    <UFormField v-if="tradingConfig.type !== 'selling'">
      <UCheckbox
        v-model="tradingConfig.highlight_filled"
        label="Use filled highlight"
      />
    </UFormField>
  </UForm>
</template>

<script setup>
const userStore = useUserStore()
const { collections, social } = storeToRefs(userStore)

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
  tradingConfig.value.highlight_filled = false
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
