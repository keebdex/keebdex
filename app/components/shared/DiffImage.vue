<template>
  <UTooltip v-if="broken" :text="UNAVAILABLE_HINT">
    <div
      :class="[
        'inline-flex items-center gap-1.5 rounded border border-dashed border-default px-2 text-xs text-muted',
        compact ? 'h-10' : 'h-20',
      ]"
    >
      <UIcon name="hugeicons:image-not-found-01" class="size-4 shrink-0" />
      Image Unavailable
    </div>
  </UTooltip>

  <a v-else :href="src" target="_blank" rel="noopener">
    <NuxtImg
      :src="src"
      :alt="alt"
      :class="[
        'rounded border border-default object-contain',
        compact ? 'h-10' : 'max-h-40',
      ]"
      @error="broken = true"
    />
  </a>
</template>

<script setup lang="ts">
// An image in a diff (suggestions, revision history), linking to the file.
// Older values can point at images that are gone: pruned from Cloudflare
// after they were replaced, or an external URL that no longer works. Pruned
// images come back from the R2 backup once a record uses them again
// (catalog-sync's restore-images, daily).
const props = defineProps<{
  src: string
  alt?: string
  // Thumbnail height for lists, instead of the diff's larger preview.
  compact?: boolean
}>()

const UNAVAILABLE_HINT =
  'This image is no longer available. If a record uses it again, it is restored from the backup within a day.'

const broken = ref(false)

watch(
  () => props.src,
  () => {
    broken.value = false
  },
)
</script>
