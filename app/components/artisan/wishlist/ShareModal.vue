<template>
  <UModal
    v-model:open="open"
    title="Save & Share"
    description="Download or copy your wishlist image, or copy it as text for Discord and Reddit."
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <UTabs v-model="tab" :items="tabs" :ui="{ content: 'pt-4' }">
        <template #image>
          <div class="space-y-4">
            <div
              v-if="imageUrl"
              class="max-h-[60vh] overflow-auto rounded-md border border-default"
            >
              <img :src="imageUrl" alt="Wishlist image" class="w-full" >
            </div>
            <UEmpty
              v-else-if="imageError"
              icon="hugeicons:image-not-found-01"
              title="Image Not Created"
              :description="imageError"
              :actions="[{ label: 'Try Again', onClick: renderImage }]"
            />
            <USkeleton v-else class="aspect-[4/3] w-full" />

            <UButton
              v-if="shareImageSupported"
              block
              icon="hugeicons:share-08"
              :disabled="!imageBlob"
              @click="shareImage"
            >
              Share Image
            </UButton>
            <div class="grid grid-cols-2 gap-2">
              <UButton
                block
                icon="hugeicons:album-01"
                :disabled="!imageBlob"
                @click="copyBlob(imageBlob, toast)"
              >
                Copy Image
              </UButton>
              <UButton
                block
                icon="hugeicons:image-download-02"
                color="neutral"
                :disabled="!imageBlob"
                @click="downloadBlob(imageBlob, filename)"
              >
                Download
              </UButton>
            </div>
          </div>
        </template>

        <template #text>
          <div class="space-y-4">
            <URadioGroup
              v-model="format"
              :items="formats"
              variant="table"
              :orientation="isMobile ? 'vertical' : 'horizontal'"
              :ui="{ fieldset: 'w-full', item: 'flex-1' }"
            />

            <UTextarea
              :model-value="text"
              readonly
              autoresize
              :rows="6"
              :maxrows="14"
              class="w-full font-mono"
              :ui="{ base: 'text-sm' }"
            />

            <div
              class="grid gap-2"
              :class="shareTextSupported ? 'grid-cols-2' : 'grid-cols-1'"
            >
              <UButton block icon="hugeicons:copy-01" @click="copyText">
                Copy Text
              </UButton>
              <UButton
                v-if="shareTextSupported"
                block
                icon="hugeicons:share-08"
                color="neutral"
                @click="shareText"
              >
                Share Text
              </UButton>
            </div>
          </div>
        </template>
      </UTabs>
    </template>
  </UModal>
</template>

<script setup>
const open = defineModel('open', { type: Boolean, default: false })

const { capture, sections, filename } = defineProps({
  // Renders the export sheet to a PNG blob.
  capture: {
    type: Function,
    required: true,
  },
  // `{ title, items, buying }` per wishlist section, for the text export.
  sections: {
    type: Array,
    default: () => [],
  },
  filename: {
    type: String,
    default: 'wishlist',
  },
})

const toast = useToast()
const { isMobile } = useDevice()

const tabs = [
  { label: 'Image', icon: 'hugeicons:image-02', slot: 'image', value: 'image' },
  { label: 'Text', icon: 'hugeicons:text', slot: 'text', value: 'text' },
]
const tab = ref('image')

const formats = [
  {
    label: 'Discord / Reddit',
    description: 'Bold titles, struck-through items',
    value: 'markdown',
  },
  {
    label: 'Plain Text',
    description: 'For apps without Markdown',
    value: 'plain',
  },
]
const format = useCookie('wishlist-text-format', { default: () => 'markdown' })

const text = computed(() => wishlistText(sections, format.value))

// Phones with Web Share get Share Image above Copy Image and Download.
const shareImageSupported = ref(false)
const shareTextSupported = ref(false)

onMounted(() => {
  shareImageSupported.value = isMobile && canShareFiles()
  shareTextSupported.value = isMobile && !!navigator.share
})

// The image is rendered before Share/Copy/Save, so they run on a ready blob
// inside the tap gesture (Safari rejects a share after a long await).
const imageBlob = ref()
const imageUrl = ref()
const imageError = ref()

const clearImage = () => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageBlob.value = undefined
  imageUrl.value = undefined
  imageError.value = undefined
}

const renderImage = async () => {
  clearImage()

  try {
    const blob = await capture()
    // Closed while rendering: drop the result instead of leaking its URL.
    if (!open.value) return

    imageBlob.value = blob
    imageUrl.value = URL.createObjectURL(blob)
  } catch (error) {
    imageError.value = error.message
  }
}

watch(open, (value) => {
  if (value) renderImage()
  else clearImage()
})

onBeforeUnmount(clearImage)

const shareImage = async () => {
  try {
    await shareBlob(imageBlob.value, filename)
  } catch (error) {
    toast.add(errorToast(error))
  }
}

const copyText = async () => {
  try {
    await navigator.clipboard.writeText(text.value)
    toast.add(noticeToast('copied'))
  } catch (error) {
    toast.add(errorToast(error))
  }
}

const shareText = async () => {
  try {
    await navigator.share({ text: text.value })
  } catch (error) {
    if (error.name !== 'AbortError') toast.add(errorToast(error))
  }
}
</script>
