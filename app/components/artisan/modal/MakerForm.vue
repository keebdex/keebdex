<template>
  <UForm
    :schema="makerSchema"
    :state="maker"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="maker.name"
        icon="solar:text-square-bold-duotone"
        :trailing-icon="maker.verified && 'solar:verified-check-bold-duotone'"
        class="w-full"
        :ui="{
          trailingIcon: 'text-primary',
        }"
      />
    </UFormField>

    <UFormField
      v-if="!isEdit"
      label="Slug"
      name="maker_id"
      help="Used in URL, e.g. my-maker. Leave empty to auto-generate from name. It can't be changed once the maker is published."
      :ui="{ help: 'text-warning' }"
    >
      <UInput
        v-model.trim="maker.maker_id"
        icon="solar:text-square-bold-duotone"
        class="w-full"
        placeholder="my-maker"
      />
    </UFormField>

    <UFormField v-if="!suggest">
      <UCheckbox v-model="maker.verified" label="Verified" />
    </UFormField>

    <UFormField
      v-if="!suggest"
      help="Stop syncing from Google Docs and manage uploads here instead."
      :ui="{
        help: 'text-info',
      }"
    >
      <UCheckbox
        v-model="maker.disable_google_sync"
        label="Disable Google Sync"
      />
    </UFormField>

    <UFormField label="Country" name="country_origin">
      <USelectMenu
        v-model="maker.country_origin"
        :items="country"
        label-key="name"
        value-key="code"
        icon="solar:global-bold-duotone"
        class="w-full"
      >
        <template #item-leading="{ item }">
          <span :class="`fi fi-${item.code}`" />
        </template>
      </USelectMenu>
    </UFormField>

    <UFormField label="Founded" name="founded">
      <UInput
        v-model.number="maker.founded"
        placeholder="e.g., 2024, Feb 2024"
        icon="solar:calendar-bold-duotone"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="!suggest && !maker.disable_google_sync"
      label="Document ID"
      name="document_ids"
      :ui="{
        container: 'flex flex-col gap-2',
      }"
    >
      <UInput
        v-for="(docId, idx) in maker.document_ids"
        :key="docId"
        v-model.trim="maker.document_ids[idx]"
        icon="solar:file-bold-duotone"
        :trailing-icon="maker.verified && 'solar:verified-check-bold-duotone'"
        class="w-full"
      >
        <template #trailing>
          <UButton
            color="error"
            variant="link"
            icon="solar:file-remove-bold-duotone"
            @click="removeDocId(docId)"
          />
        </template>
      </UInput>

      <UButton
        label="Add Document Id"
        icon="solar:file-add-bold-duotone"
        variant="outline"
        class="w-full"
        @click="addDocId"
      />
    </UFormField>

    <UFormField label="Website" name="website">
      <UInput
        v-model="maker.website"
        icon="solar:earth-bold-duotone"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Instagram" name="instagram">
      <UInput
        v-model.trim="maker.instagram"
        icon="solar:camera-square-bold-duotone"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Discord" name="discord">
      <UInput
        v-model.trim="maker.discord"
        icon="simple-icons:discord"
        class="w-full"
      />
    </UFormField>

    <UFormField label="ArtisanCollector" name="artisancollector">
      <UInput
        v-model.trim="maker.artisancollector"
        icon="solar:earth-bold-duotone"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Bio"
      name="bio"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="maker.bio" :rows="5" class="w-full" />
    </UFormField>

    <UButton
      v-if="mode === 'standalone'"
      block
      color="primary"
      type="submit"
      loading-auto
    >
      Save
    </UButton>
  </UForm>
</template>

<script setup>
import country from 'flag-icons/country.json'
import 'flag-icons/css/flag-icons.min.css'
import { makerSchema } from '~/utils/schemas/artisan'

const emit = defineEmits(['onSuccess', 'update:modelValue'])

const toast = useToast()

const { metadata, modelValue, isEdit, mode } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Object,
    default: null,
  },
  isKeeb: Boolean,
  // Suggest Edit (SharedSuggestionForm): hides the Google Doc settings and
  // the verified flag, which a suggestion cannot change.
  suggest: Boolean,
  isEdit: Boolean,
  mode: {
    type: String,
    default: 'standalone',
    validator: (value) => ['standalone', 'embedded'].includes(value),
  },
})

const maker = ref({
  name: '',
  document_ids: [],
})

onBeforeMount(() => {
  if (modelValue || Object.keys(metadata).length) {
    maker.value = { ...(modelValue || metadata) }
  }
})

watch(
  () => modelValue,
  (value) => {
    if (value && value !== maker.value) {
      maker.value = { ...value }
    }
  },
)

watch(
  maker,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

const addDocId = () => {
  if (!Array.isArray(maker.value.document_ids)) {
    maker.value.document_ids = ['']
  } else {
    maker.value.document_ids.push('')
  }
}

const removeDocId = (docIdx) => {
  maker.value.document_ids = maker.value.document_ids.filter(
    (d) => d !== docIdx,
  )
}

const onSubmit = async () => {
  if (mode !== 'standalone') return

  const { sculpts, ...rest } = maker.value
  const normalizedMakerId = String(rest.maker_id || '').trim()

  // A new maker's slug is normalized; an existing one keeps its key.
  const makerId = isEdit
    ? normalizedMakerId
    : urlSlugify(normalizedMakerId || maker.value.name)

  await $fetch(`/api/makers/${makerId}`, {
    method: 'post',
    body: rest,
  })
    .then(() => {
      toast.add(
        successToast(isEdit ? 'update' : 'add', {
          entity: 'Maker',
          name: rest.name,
        }),
      )

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}
</script>
