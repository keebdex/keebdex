<template>
  <UForm :schema="schema" :state="sculpt" class="space-y-4" @submit="onSubmit">
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
              typeMap[tradingConfig.type].includes(c.type),
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
            (c) => c.category === 'artisan' && typeMap.selling.includes(c.type),
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
  </UForm>
</template>

<script setup>
const userStore = useUserStore()
const { collections, social } = storeToRefs(userStore)

const typeMap = {
  buying: ['personal', 'personal_buy', 'shareable', 'to_buy'],
  selling: ['personal', 'personal_sell', 'shareable', 'for_sale'],
  trading: ['personal', 'personal_buy', 'shareable', 'to_buy'],
}

const tradingConfig = useState('trading-config')
tradingConfig.value.social = social.value

const trading = computed(() => tradingConfig.value.type === 'trading')
watch(trading, () => {
  if (trading.value) {
    tradingConfig.value.selling.placeholder = 'For sale or trade'
  }
})
</script>
