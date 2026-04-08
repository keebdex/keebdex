<template>
  <USlideover :title="`${title} Information`">
    <UButton icon="hugeicons:information-circle" label="Info" color="info" />

    <template #body>
      <UPageCard
        reverse
        :ui="{
          root: 'rounded-none ring-0 bg-transparent',
          container: '!p-0',
          footer: 'flex-wrap gap-2 justify-start',
        }"
      >
        <template v-if="description" #description>
          <SharedPageHeaderDescription :description="description" />
        </template>

        <template v-if="links.length" #footer>
          <UButton
            v-for="link in links"
            :key="link.label"
            :target="link.to?.startsWith('http') ? '_blank' : undefined"
            :disabled="!link.to"
            v-bind="link"
          />
        </template>
      </UPageCard>
    </template>

    <!-- <template #footer="{ close }">
      <UButton label="Close" color="secondary" @click="close" />
    </template> -->
  </USlideover>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Information',
  },
  description: {
    type: String,
    default: '',
  },
  links: {
    type: Array,
    default: () => [],
  },
})
</script>
