<template>
  <ClientOnly>
    <div
      v-if="active"
      class="fixed top-0 -left-[10000px] pointer-events-none"
      aria-hidden="true"
    >
      <div ref="root" class="w-fit" :style="width ? { width } : undefined">
        <slot />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
// Renders its slot off screen only while capturing, at a fixed width, so a
// copied or downloaded image is the same on every screen size.
const { width } = defineProps({
  // CSS width of the image; leave empty when the content sets its own width.
  width: {
    type: String,
    default: undefined,
  },
})

const root = useTemplateRef('root')
const active = ref(false)

const IMAGE_TIMEOUT = 8000

// Off-screen images never load lazily; load them now and wait for them.
const waitForImages = (element) =>
  Promise.all(
    [...element.querySelectorAll('img')].map((img) => {
      img.loading = 'eager'
      if (img.complete) return undefined

      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
        setTimeout(resolve, IMAGE_TIMEOUT)
      })
    }),
  )

/** Renders the slot and returns it as a PNG blob. */
const capture = async () => {
  active.value = true

  try {
    await nextTick()
    await waitForImages(root.value)

    return await captureScreenshot(root.value)
  } finally {
    active.value = false
  }
}

defineExpose({ capture })
</script>
