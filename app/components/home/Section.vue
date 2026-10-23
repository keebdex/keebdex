<template>
  <UPageSection
    :ui="{
      root: 'rounded-2xl border border-default bg-elevated/30 p-3 sm:p-4',
      container: '!py-8 !gap-6 overflow-hidden',
    }"
  >
    <UPageHeader
      :title="title"
      :links="links"
      :ui="{
        root: 'pb-4',
        title:
          'text-base sm:text-md font-semibold uppercase tracking-[0.24em] text-dimmed',
      }"
    />

    <slot />
  </UPageSection>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

defineProps<{
  title: string
  links?: ButtonProps[]
}>()
</script>
