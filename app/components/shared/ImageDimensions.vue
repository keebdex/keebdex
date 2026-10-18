<template>
  <template v-if="variant === 'help'">
    <p
      v-if="info && lowResolution"
      class="mt-2 flex items-start gap-1 text-xs text-warning"
    >
      <UIcon name="hugeicons:alert-02" class="size-4 shrink-0" />
      <span>
        This image is only {{ size }} px. Use one at least
        {{ LOW_RESOLUTION_IMAGE_SIZE }} px on its longer side so it stays sharp.
      </span>
    </p>
    <p v-else-if="info" class="mt-2 text-xs text-muted">
      {{ details }}
    </p>
  </template>

  <UTooltip v-else-if="info" :text="details">
    <UBadge
      :label="size"
      :icon="lowResolution ? 'hugeicons:alert-02' : undefined"
      :color="lowResolution ? 'warning' : 'neutral'"
      variant="subtle"
      size="sm"
      class="tabular-nums"
    />
  </UTooltip>
  <span v-else class="text-muted">-</span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string | null
    // `badge` for tables, `help` for the text under an image field
    variant?: 'badge' | 'help'
  }>(),
  { src: null, variant: 'badge' },
)

const info = ref<ImageInfo | null>(null)

const lowResolution = computed(
  () => !!info.value && isLowResolution(info.value),
)

const size = computed(() =>
  info.value ? `${info.value.width} × ${info.value.height}` : '',
)

const details = computed(() => {
  if (!info.value) return ''

  const { fileSize, format } = info.value
  const parts = [`Original size: ${size.value} px`]

  if (fileSize) parts.push(formatFileSize(fileSize))
  if (format) parts.push(format.replace('image/', '').toUpperCase())
  if (lowResolution.value) {
    parts.push(`Low resolution (under ${LOW_RESOLUTION_IMAGE_SIZE} px)`)
  }

  return parts.join(' · ')
})

watch(
  () => props.src,
  async (src) => {
    info.value = null
    if (!src || !import.meta.client) return

    const result = await getImageInfo(src)
    if (props.src === src) info.value = result
  },
  { immediate: true },
)
</script>
