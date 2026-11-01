<template>
  <!-- One colorway in full: its photo, its description, and its details,
       with Save and Share Card (the trading card popup) in the footer. One
       drawer serves the whole sculpt page. -->
  <USlideover
    v-model:open="open"
    :title="colorway.sculpt ? colorwayTitle(colorway) : colorway.name"
    :description="colorway.sculpt?.maker_name"
    :ui="{
      // Nuxt UI sets the width as sm:max-w-md, so override it at sm too
      content: 'sm:max-w-xl',
      body: 'space-y-6',
      footer: 'flex flex-wrap gap-2',
    }"
  >
    <template #body>
      <NuxtImg
        :src="colorway.img || '/artisan.png'"
        :alt="colorway.name"
        sizes="xs:100vw sm:528px"
        class="aspect-square w-full rounded-lg border border-default bg-elevated object-cover"
      />

      <SharedDescription
        v-if="colorway.description"
        :description="colorway.description"
        class="text-sm text-muted"
      />

      <section class="space-y-3">
        <UPageHeader
          title="Details"
          :as="detailSectionHeaderAs"
          :ui="detailSectionHeaderUi"
        />
        <SharedSpecList :items="specs" layout="grid" :columns="3" />
      </section>
    </template>

    <template #footer>
      <SharedSaveToCollection
        v-if="authenticated"
        :item="colorway"
        :item-name="colorway.name"
        label="Save"
        keep-label
        @on-select="(collection, item) => emit('saveTo', collection, item)"
      />

      <UButton
        icon="hugeicons:id"
        label="Share Card"
        :ui="{ label: 'block' }"
        @click="emit('share')"
      />
    </template>
  </USlideover>
</template>

<script setup>
const emit = defineEmits(['saveTo', 'share'])

const open = defineModel('open', { type: Boolean, default: false })

const { colorway } = defineProps({
  // With its sculpt, as the page's `withSculpt` passes it
  colorway: {
    type: Object,
    default: () => ({}),
  },
  authenticated: Boolean,
})

const specs = computed(() => colorwaySpecItems(colorway))
</script>
