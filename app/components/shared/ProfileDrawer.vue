<template>
  <USlideover :title="`${title} Information`">
    <UTooltip text="Info">
      <UButton
        icon="hugeicons:information-circle"
        color="info"
        :aria-label="`${title} Information`"
      />
    </UTooltip>

    <template #body>
      <UPageCard
        reverse
        variant="naked"
        :ui="{
          footer: 'justify-center',
          description: 'text-justify',
        }"
      >
        <UAvatar
          v-if="slug"
          :src="logoUrl(slug)"
          :alt="title"
          size="4xl"
          :ui="{
            root: 'bg-transparent rounded-none p-6 aspect-square w-2/5 mx-auto',
            image: 'h-full w-auto',
          }"
          :class="{
            'dark:invert': invertible,
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
            variant="link"
            class="flex flex-col"
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
  invertible: Boolean,
})
</script>
