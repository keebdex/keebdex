<template>
  <USlideover :title="`${title} Information`">
    <UButton icon="hugeicons:information-circle" label="Info" color="info" />

    <template #body>
      <UPageCard
        reverse
        :ui="{
          root: 'rounded-none ring-0 bg-transparent',
          container: '!p-0',
          footer: 'flex-wrap gap-2 justify-center w-full',
          description: 'text-justify',
        }"
      >
        <UAvatar
          v-if="slug"
          :src="`/logo/${slug}.png`"
          :alt="title"
          size="4xl"
          :ui="{
            root: 'bg-transparent rounded-none p-6 aspect-square w-2/5 mx-auto',
          }"
          :class="{
            invert: $colorMode.value === 'dark',
          }"
        />

        <template v-if="description" #description>
          <SharedDescription :description="description" />
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
  </USlideover>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    default: '',
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
