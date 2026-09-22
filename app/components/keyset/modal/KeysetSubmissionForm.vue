<template>
  <UForm :schema="schema" :state="keyset" class="space-y-6" @submit="onSave">
    <div class="space-y-4">
      <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
        Keyset Info
      </p>

      <KeysetModalKeysetForm
        v-model="keyset"
        v-model:date-range="range"
        mode="embedded"
      />
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
          <USelectMenu
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

        <UFormField>
          <UCheckbox v-model="kit.cancelled" label="Cancelled" />
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

      <UButton
        v-if="canDelete"
        label="Delete"
        color="error"
        variant="soft"
        icon="hugeicons:delete-02"
        @click="deleteVisible = true"
      />
    </div>
  </UForm>

  <UModal
    v-model:open="deleteVisible"
    title="Delete Submission"
    :description="`Are you sure you want to delete ${keyset.name}? This action cannot be undone.`"
  >
    <template #footer="{ close }">
      <UButton label="Cancel" @click="close" />
      <UButton
        label="Delete"
        color="error"
        :loading="processingDelete"
        @click="onDelete(close)"
      />
    </template>
  </UModal>
</template>

<script setup>
import { parseDate } from '@internationalized/date'
import { createKeysetSchema } from '~/utils/schemas/keyset'

const emit = defineEmits(['onSuccess', 'onDelete'])

const { metadata, moderator } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  moderator: Boolean,
})

const toast = useToast()
const { manufacturers } = useKeysetProfiles()
const { kits: kitCategories, status: kitsStatus } = useKeysetKits()

const isEdit = computed(() => !!metadata.id)
const canDelete = computed(
  () => isEdit.value && (moderator || metadata.review_status !== 'Approved'),
)

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
  cancelled: false,
})

const kits = ref([])
const range = shallowRef({ start: undefined, end: undefined })

onBeforeMount(() => {
  const { kits: metadataKits, ...rest } = metadata
  Object.assign(keyset.value, rest)

  range.value = {
    start: rest.start_date ? parseDate(rest.start_date) : undefined,
    end: rest.end_date ? parseDate(rest.end_date) : undefined,
  }

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

const schema = computed(() => createKeysetSchema(manufacturers))

const processingAction = ref(null)
const { save, remove } = useKeysetSubmission({ keyset, kits, range, isEdit })

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

const deleteVisible = ref(false)
const processingDelete = ref(false)

const onDelete = async (close) => {
  processingDelete.value = true

  try {
    await remove()

    toast.add(handleSuccess('delete', keyset.value.name))
    deleteVisible.value = false
    close()
    emit('onDelete')
  } catch (error) {
    toast.add(handleError(error, { showOriginalMessage: true }))
  } finally {
    processingDelete.value = false
  }
}
</script>
