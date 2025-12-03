<template>
  <UForm :state="tradingConfig" class="space-y-4">
    <UFormField :label="trading ? 'Want Title' : 'Title'" name="want_title">
      <UInput
        v-model.trim="tradingConfig.buying.title"
        icon="hugeicons:text"
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
        icon="hugeicons:text"
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

    <UFormField>
      <UCheckbox
        v-model="tradingConfig.fnf_only"
        label="I do not accept PayPal G&S"
      />
    </UFormField>

    <UButton
      v-if="$device.isMobileOrTablet"
      block
      icon="hugeicons:sidebar-right"
      @click="showPreview = true"
    >
      Preview
    </UButton>
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

const tradingConfig = useState('trading-config')

const trading = computed(() => tradingConfig.value.type === 'trading')
watch(trading, () => {
  if (trading.value) {
    tradingConfig.value.selling.placeholder = 'WTS/WTT'
  }
})

watch(social, (value) => {
  tradingConfig.value.social = value
})

const showPreview = useState('wishlist-preview', () => false)
</script>
