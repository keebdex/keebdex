<template>
  <UForm :schema="schema" :state="keyset" class="space-y-6" @submit="onSave">
    <div class="space-y-4">
      <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
        Keyset Info
      </p>

      <UFormField label="Name" name="name" required>
        <UInput
          v-model.trim="keyset.name"
          icon="hugeicons:text-font"
          class="w-full"
        />
      </UFormField>

      <div class="grid grid-cols-2 gap-2">
        <UFormField label="Profile" name="profile_id" required>
          <USelect
            v-model="keyset.profile_id"
            :items="
              Object.entries(groupedProfiles)
                .map(([label, profileManufacturers]) => {
                  return [
                    { type: 'label', label },
                    ...Object.entries(profileManufacturers).map(
                      ([value, name]) => ({
                        type: 'item',
                        label: name,
                        value,
                      }),
                    ),
                    { type: 'separator' },
                  ]
                })
                .flat()
                .slice(0, -1)
            "
            class="w-full"
          />
        </UFormField>

        <UFormField label="Designer" name="designer">
          <UInputMenu
            v-model.trim="keyset.designer"
            v-model:search-term="designerTerm"
            :items="designerOptions"
            :loading="designersStatus === 'pending'"
            :content="{ hideWhenEmpty: true }"
            mode="autocomplete"
            ignore-filter
            icon="hugeicons:user-star-01"
            placeholder="Start typing to search designers..."
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Sculpt" name="sculpt">
        <UInput
          v-model.trim="keyset.sculpt"
          icon="hugeicons:dashboard-square-02"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Reference URL" name="url">
        <UInput
          v-model.trim="keyset.url"
          icon="hugeicons:globe-02"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Image" name="img">
        <UInput
          v-model.trim="keyset.img"
          icon="hugeicons:image-02"
          class="w-full"
        />

        <div class="mt-2">
          <UFileUpload
            v-model="uploadedFile"
            accept="image/*"
            icon="hugeicons:image-upload"
            layout="grid"
            label="Click to browse or drag & drop an image to upload"
            :description="`Maximum file size: ${maxUploadSizeMb}MB`"
            :ui="{ base: 'aspect-video' }"
          />
        </div>
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea v-model.trim="keyset.description" :rows="4" class="w-full" />
      </UFormField>
    </div>

    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
          Kits
        </p>

        <UButton
          label="Add Kit"
          size="xs"
          variant="soft"
          icon="hugeicons:plus-sign"
          @click="addKit"
        />
      </div>

      <div
        v-for="(kit, index) in kits"
        :key="kit._key"
        class="space-y-3 rounded-lg border border-default p-4"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-dimmed">Kit #{{ index + 1 }}</p>

          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="hugeicons:delete-02"
            @click="removeKit(index)"
          />
        </div>

        <UFormField label="Category" :name="`kits.${index}.kit_id`">
          <USelect
            v-model="kit.kit_id"
            :items="kitCategories"
            :loading="kitsStatus === 'pending'"
            label-key="name"
            value-key="slug"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Name" :name="`kits.${index}.name`">
          <UInput v-model.trim="kit.name" class="w-full" />
        </UFormField>

        <UFormField label="Image" :name="`kits.${index}.img`">
          <UInput v-model.trim="kit.img" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-2">
          <UFormField label="Price" :name="`kits.${index}.price`">
            <UInput v-model.number="kit.price" class="w-full" />
          </UFormField>

          <UFormField label="Quantity" :name="`kits.${index}.qty`">
            <UInput v-model.number="kit.qty" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Description" :name="`kits.${index}.description`">
          <UTextarea v-model.trim="kit.description" :rows="2" class="w-full" />
        </UFormField>
      </div>

      <p v-if="!kits.length" class="text-sm text-dimmed">
        No kits added yet. Click "Add Kit" to attach the kits included in this
        keyset.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        :label="isEdit ? 'Save Changes' : 'Submit Keyset'"
        type="submit"
        color="primary"
        loading-auto
      />

      <template v-if="moderator && isEdit">
        <UButton
          label="Approve"
          color="success"
          icon="hugeicons:checkmark-circle-02"
          :loading="processingAction === 'approve'"
          @click="() => onModerate('approve')"
        />

        <UButton
          label="Reject"
          color="error"
          icon="hugeicons:cancel-circle"
          :loading="processingAction === 'reject'"
          @click="() => onModerate('reject')"
        />
      </template>
    </div>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const { metadata, moderator } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  moderator: Boolean,
})

const toast = useToast()
const { groupedProfiles, manufacturers } = useKeysetProfiles()
const { kits: kitCategories, status: kitsStatus } = useKeysetKits()

const isEdit = computed(() => !!metadata.id)

const designerTerm = ref('')
const { data: designerData, status: designersStatus } = useGuardedSearch(
  '/api/keysets/designers',
  {
    key: 'keyset-submission-designer-search',
    term: designerTerm,
  },
)
const designerOptions = computed(() => designerData.value?.designers || [])

const keyset = ref({
  id: undefined,
  name: '',
  designer: '',
  sculpt: '',
  profile_id: '',
  img: '',
  url: '',
  description: '',
})

let kitKeySeed = 0
const newKit = () => ({
  _key: kitKeySeed++,
  kit_id: 'base',
  name: '',
  img: '',
  price: null,
  qty: null,
  description: '',
})

const kits = ref([])

onBeforeMount(() => {
  const { kits: metadataKits, ...rest } = metadata
  Object.assign(keyset.value, rest)

  kits.value = (metadataKits || []).map((kit) => ({
    ...newKit(),
    ...kit,
  }))

  if (!kits.value.length) {
    kits.value.push(newKit())
  }
})

const addKit = () => {
  kits.value.push(newKit())
}

const removeKit = (index) => {
  kits.value.splice(index, 1)
}

const uploadedFile = ref(null)
const maxUploadSizeMb = getMaxUploadSizeMb('keyset')

const schema = z.object({
  name: z.string().min(1),
  designer: z.string().nullish(),
  sculpt: z.string().nullish(),
  profile_id: z
    .string()
    .min(1, 'Please choose a profile')
    .refine((value) => !!manufacturers.value[value], 'Invalid keyset profile'),
  url: z.url().nullish().or(z.string().min(0).max(0)),
  img: z.url().nullish().or(z.string().min(0).max(0)),
  description: z.string().nullish(),
})

const buildKitsPayload = () =>
  kits.value
    .filter((kit) => kit.name || kit.img || kit.description)
    .map(({ _key, ...kit }) => kit)

const processingAction = ref(null)

const save = async (action = 'update') => {
  const assignment =
    keyset.value.profile_keyset_id ||
    `${keyset.value.profile_id}/pending-${Date.now()}`

  if (uploadedFile.value) {
    try {
      keyset.value.img = await uploadImageToCloudflare({
        file: uploadedFile.value,
        assignment,
        category: 'keyset',
      })
    } catch (e) {
      toast.add(handleError(e))
      throw e
    }
  }

  const kitsPayload = buildKitsPayload()

  if (isEdit.value) {
    return $fetch(`/api/keyset-submissions/${keyset.value.id}`, {
      method: 'post',
      body: { action, keyset: keyset.value, kits: kitsPayload },
    })
  }

  return $fetch('/api/keyset-submissions', {
    method: 'post',
    body: { keyset: keyset.value, kits: kitsPayload },
  })
}

const onSave = async () => {
  try {
    await save('update')
    toast.add(
      handleSuccess(
        isEdit.value ? 'update' : 'add',
        keyset.value.name,
        'Keyset',
      ),
    )
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  }
}

const onModerate = async (action) => {
  processingAction.value = action

  try {
    await save(action)
    toast.add(handleSuccess('save', keyset.value.name, 'Keyset'))
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingAction.value = null
  }
}
</script>
