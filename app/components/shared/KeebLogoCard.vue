<template>
  <UPageCard
    :title="title"
    reverse
    spotlight
    :to="to"
    :ui="{
      root: 'h-full',
      wrapper: 'items-center',
    }"
  >
    <div class="flex items-center p-6">
      <NuxtImg
        loading="lazy"
        :src="`/logo/${slug}.png`"
        :alt="title"
        class="mx-auto my-auto overflow-hidden object-contain h-auto w-full"
        :class="{
          invert: invertible && $colorMode.value === 'dark',
          [`aspect-${props.aspect}`]: props.aspect,
        }"
      />
    </div>
  </UPageCard>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  invertible: {
    type: Boolean,
    default: false,
  },
  aspect: {
    type: String,
    default: '',
  },
})
</script>
