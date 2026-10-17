<template>
  <UTextarea
    v-if="field.type === 'textarea'"
    v-model="value"
    :rows="4"
    autoresize
    :disabled="disabled"
    class="w-full"
  />

  <UInput
    v-else-if="field.type === 'number'"
    v-model.number="value"
    type="number"
    min="0"
    step="any"
    :disabled="disabled"
    class="w-full"
  />

  <UInput
    v-else-if="field.type === 'date'"
    v-model="value"
    type="date"
    :disabled="disabled"
    class="w-full"
  />

  <USelectMenu
    v-else-if="field.type === 'select'"
    v-model="value"
    :items="[...(field.options || [])]"
    :search-input="false"
    :clear="!field.required"
    :disabled="disabled"
    class="w-full"
  />

  <USelectMenu
    v-else-if="field.type === 'multiselect'"
    v-model="list"
    :items="[...(field.options || [])]"
    multiple
    :search-input="false"
    :disabled="disabled"
    class="w-full"
  />


  <USwitch
    v-else-if="field.type === 'boolean'"
    v-model="checked"
    :disabled="disabled"
  />

  <div v-else-if="field.type === 'image'" class="space-y-2">
    <UInput
      v-model="value"
      type="url"
      icon="hugeicons:image-02"
      placeholder="https://"
      :disabled="disabled || uploading"
      class="w-full"
    />

    <div class="flex items-start gap-3">
      <NuxtImg
        v-if="value"
        :src="value"
        :alt="field.label"
        class="size-20 shrink-0 rounded border border-default object-cover"
      />

      <UFileUpload
        v-model="file"
        accept="image/*"
        icon="hugeicons:image-upload"
        label="Upload an image"
        :description="`Up to ${maxUploadSizeMb}MB`"
        :disabled="disabled || uploading"
        class="flex-1"
        :ui="{ base: 'min-h-20' }"
      />
    </div>
  </div>

  <UInput
    v-else
    v-model="value"
    :type="field.type === 'url' ? 'url' : 'text'"
    :placeholder="field.type === 'url' ? 'https://' : undefined"
    :disabled="disabled"
    class="w-full"
  />
</template>

<script setup lang="ts">
import type {
  SuggestionField,
  SuggestionUploadTarget,
} from '~/utils/suggestions'

// One editable field of an edit suggestion, by its registry type. Images
// upload to Cloudflare as soon as a file is picked and fill in the URL.
const props = defineProps<{
  field: SuggestionField
  upload: SuggestionUploadTarget
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:uploading': [uploading: boolean] }>()

const model = defineModel<any>()
const toast = useToast()

const value = computed({
  get: () => model.value ?? undefined,
  set: (next) => {
    model.value = next === '' || next === undefined ? null : next
  },
})

const list = computed({
  get: () => (Array.isArray(model.value) ? model.value : []),
  set: (next: string[]) => {
    model.value = next.length ? next : null
  },
})

const checked = computed({
  get: () => !!model.value,
  set: (next: boolean) => {
    model.value = next
  },
})

const maxUploadSizeMb = getMaxUploadSizeMb(props.upload.category)
const file = ref<File | null>(null)
const uploading = ref(false)

watch(file, async (selected) => {
  if (!selected) return

  uploading.value = true
  emit('update:uploading', true)

  try {
    model.value = await uploadImageToCloudflare({
      file: selected,
      assignment: props.upload.assignment,
      category: props.upload.category,
    })
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    file.value = null
    uploading.value = false
    emit('update:uploading', false)
  }
})
</script>
