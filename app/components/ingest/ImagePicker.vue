<template>
  <div class="space-y-2">
    <p v-if="!images.length" class="text-sm text-error">
      No images to pick from.
    </p>

    <div v-else class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      <div
        v-for="(image, index) in images"
        :key="image"
        class="group relative space-y-1"
      >
        <button
          type="button"
          class="block w-full overflow-hidden rounded-md ring-2 ring-offset-2 ring-offset-default"
          :class="selected === image ? 'ring-primary' : 'ring-transparent'"
          :aria-pressed="selected === image"
          :aria-label="`Pick image ${index + 1}`"
          @click="pick(image)"
        >
          <NuxtImg
            preset="thumb"
            loading="lazy"
            decoding="async"
            :src="image"
            alt=""
            referrerpolicy="no-referrer"
            class="aspect-square w-full object-cover"
          />
        </button>

        <UBadge
          v-if="selected === image"
          :label="selectedLabel"
          color="primary"
          variant="solid"
          size="sm"
          class="absolute left-1 top-1"
        />

        <UTooltip text="Enlarge">
          <UButton
            icon="solar:magnifer-zoom-in-line-duotone"
            size="xs"
            variant="solid"
            aria-label="Enlarge"
            class="absolute right-1 top-1"
            @click="preview = index"
          />
        </UTooltip>

        <SharedImageDimensions :src="image" />
      </div>
    </div>

    <UModal
      v-model:open="previewOpen"
      :title="`Image ${(preview ?? 0) + 1} of ${images.length}`"
      :ui="{ content: 'sm:max-w-4xl' }"
    >
      <template #body>
        <div v-if="preview !== null" class="space-y-3">
          <NuxtImg
            :src="images[preview]"
            alt=""
            referrerpolicy="no-referrer"
            class="mx-auto max-h-[70vh] w-auto rounded-md object-contain"
          />
          <SharedImageDimensions :src="images[preview]" variant="help" />
        </div>
      </template>

      <template #footer>
        <div class="flex w-full items-center justify-between gap-2">
          <div class="flex gap-2">
            <UButton
              icon="solar:alt-arrow-left-linear"
              aria-label="Previous image"
              :disabled="!preview"
              @click="preview = (preview ?? 0) - 1"
            />
            <UButton
              icon="solar:alt-arrow-right-linear"
              aria-label="Next image"
              :disabled="preview === images.length - 1"
              @click="preview = (preview ?? 0) + 1"
            />
          </div>

          <UButton
            :label="`Use as ${selectedLabel}`"
            color="primary"
            icon="solar:check-circle-line-duotone"
            :ui="{ label: 'block' }"
            :disabled="preview === null || selected === images[preview]"
            @click="pickPreview"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Picks one of a forum thread's images (`ingest.threads.images`): a grid with
// each image's size, and an enlarged view to compare them before picking.
const props = withDefaults(
  defineProps<{
    images: string[]
    // Badge on the picked image, e.g. 'Cover'.
    selectedLabel?: string
  }>(),
  { selectedLabel: 'Picked' },
)

const selected = defineModel<string | null | undefined>({ required: true })

const preview = ref<number | null>(null)
const previewOpen = computed({
  get: () => preview.value !== null,
  set: (open) => {
    if (!open) preview.value = null
  },
})

const pick = (image: string) => {
  selected.value = image
}

const pickPreview = () => {
  if (preview.value === null) return

  pick(props.images[preview.value]!)
  preview.value = null
}
</script>
