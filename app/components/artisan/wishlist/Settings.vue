<template>
  <USidebar
    v-if="authenticated"
    v-model:open="sidebarOpen"
    title="Wishlist Settings"
    collapsible="offcanvas"
    side="right"
    :ui="{
      container: 'border-none',
      // Padded like the preview's navbar so both titles line up
      header: 'sm:px-6',
    }"
  >
    <!-- A heading like the navbar's title, so themes give both the same
    heading font; the sidebar's own title is a plain paragraph. -->
    <template #header="{ close }">
      <h2 class="flex-1 truncate font-semibold text-highlighted">
        Wishlist Settings
      </h2>

      <!-- Wide screens always show the settings; only the slideover closes -->
      <UButton
        :icon="appConfig.ui.icons.close"
        variant="ghost"
        aria-label="Close"
        class="lg:hidden"
        @click="close"
      />
    </template>

    <UForm :state="tradingConfig" class="flex flex-col gap-6">
      <!-- What the list is for decides its sections and collections -->
      <UTabs
        :model-value="tradingConfig.type"
        :items="WISHLIST_TYPE_ITEMS"
        :content="false"
        size="sm"
        aria-label="List type"
        :ui="{ trigger: 'flex-1' }"
        @update:model-value="setType"
      />

      <fieldset class="flex flex-col gap-4">
        <legend :class="legendClass">
          {{ trading ? 'Want' : 'List' }}
        </legend>

        <UFormField label="Collection" name="want_collection">
          <USelect
            v-model="tradingConfig.buying.collection"
            :items="collectionItems(tradingConfig.type)"
            label-key="name"
            value-key="id"
            placeholder="Pick a Collection"
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
            placeholder="Pick a Collection"
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
const { authenticated, social } = storeToRefs(useUserStore())

const appConfig = useAppConfig()
const sidebarOpen = useWishlistSidebar()

const tradingConfig = useTradingConfig()
const { collectionItems, setType } = useWishlistPicker()

// Each group of settings opens with a small mono heading
const legendClass = ['mb-3 text-muted', eyebrowClass]

const trading = computed(() => tradingConfig.value.type === 'trading')

watch(social, (value) => {
  tradingConfig.value.social = value
})
</script>
