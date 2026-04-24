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
        :src="imageSrc"
        :alt="title"
        class="mx-auto my-auto overflow-hidden object-contain h-auto w-full"
        :class="{
          invert: invertible && $colorMode.value === 'dark',
          [`aspect-${props.aspect}`]: props.aspect,
        }"
        @error="handleError"
      />
    </div>
  </UPageCard>
</template>

<script setup>
const colorMode = useColorMode()

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

const logoSrc = computed(() => `/logo/${props.slug}.png`)
const fallbackSrc = computed(() =>
  colorMode.value === 'dark' ? '/logo-outlined.png' : '/logo-filled.png',
)
const imageSrc = ref(logoSrc.value)

function handleError() {
  if (imageSrc.value === fallbackSrc.value) return

  imageSrc.value = fallbackSrc.value
}

watch(logoSrc, (value) => {
  imageSrc.value = value
})

watch(fallbackSrc, (value) => {
  if (imageSrc.value !== logoSrc.value) imageSrc.value = value
})
</script>
