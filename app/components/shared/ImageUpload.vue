<template>
  <UFileUpload
    v-model="file"
    accept="image/*"
    icon="hugeicons:image-upload"
    layout="grid"
    reset
    label="Click to browse or drag & drop an image to upload"
    :description="`Maximum file size: ${maxSizeMb}MB`"
    :preview="false"
    :disabled="loading"
    :ui="{ base: 'aspect-video' }"
  >
    <template v-if="previewSrc" #default="{ open }">
      <div
        class="relative aspect-video overflow-hidden rounded-lg border border-default bg-elevated/50"
      >
        <img
          :src="previewSrc"
          alt=""
          class="size-full object-contain"
          @error="broken = true"
        >

        <div
          v-if="loading"
          class="absolute inset-0 flex items-center justify-center bg-default/60"
        >
          <UIcon name="hugeicons:loader" class="size-6 animate-spin" />
        </div>

        <div class="absolute top-2 right-2 flex gap-1">
          <UButton
            icon="hugeicons:image-upload"
            label="Replace"
            color="neutral"
            variant="solid"
            size="xs"
            :ui="{ label: 'block' }"
            :disabled="loading"
            @click="open()"
          />
          <UButton
            icon="hugeicons:delete-02"
            color="neutral"
            variant="solid"
            size="xs"
            aria-label="Remove image"
            :disabled="loading"
            @click="remove"
          />
        </div>
      </div>
    </template>
  </UFileUpload>
</template>

<script setup lang="ts">
// Image upload for entity forms: previews the current image (`src`, the
// stored URL) with Replace/Remove actions, or the dropzone when there is none.
// The parent uploads the picked file (`v-model`) and writes the URL to `src`
const props = withDefaults(
  defineProps<{
    maxSizeMb: number
    loading?: boolean
  }>(),
  { loading: false },
)

const file = defineModel<File | null>({ default: null })
const src = defineModel<string | null>('src', { default: '' })

const broken = ref(false)
const localUrl = ref('')

// While the picked file uploads, preview it from memory
watch(file, (value) => {
  if (localUrl.value) URL.revokeObjectURL(localUrl.value)
  localUrl.value = value ? URL.createObjectURL(value) : ''
})

watch(src, () => {
  broken.value = false
})

onBeforeUnmount(() => {
  if (localUrl.value) URL.revokeObjectURL(localUrl.value)
})

const previewSrc = computed(() => {
  if (props.loading && localUrl.value) return localUrl.value

  return src.value && !broken.value ? src.value : ''
})

const remove = () => {
  file.value = null
  src.value = ''
}
</script>
