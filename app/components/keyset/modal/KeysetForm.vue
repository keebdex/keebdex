<template>
  <component :is="formWrapper" v-bind="formWrapperProps" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="keyset.name"
        icon="hugeicons:text-font"
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

    <div
      class="grid gap-2"
      :class="suggest || !isStandalone ? 'grid-cols-1' : 'grid-cols-2'"
    >
      <!-- The submission wizard picks the profile in its first step -->
      <UFormField
        v-if="!suggest && isStandalone"
        label="Profile"
        name="profile"
        required
      >
        <USelect
          v-model="keyset.profile_id"
          :items="
            Object.entries(groupedProfiles)
              .map(([profile, profileManufacturers], idx) => {
                return [
                  { type: 'label', label: profile },
                  ...Object.entries(profileManufacturers).map(
                    ([value, label]) => ({
                      type: 'item',
                      label,
                      value,
                    }),
                  ),
                  {
                    type: 'separator',
                  },
                ]
              })
              .flat()
              .slice(0, -1)
          "
          class="w-full"
        />
      </UFormField>

      <UFormField label="Sculpt" name="sculpt">
        <UInputMenu
          v-model.trim="keyset.sculpt"
          :items="sculpts"
          icon="hugeicons:dashboard-square-02"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- Staff manage colors on their own page; suggestions and new keysets in
    the submission wizard take them here -->
    <UFormField
      v-if="suggest || colors"
      label="Colors"
      name="colors"
      help="Search colors by code or name."
    >
      <KeysetColorPicker v-model="keyset.colors" />
    </UFormField>

    <UFormField label="URL" name="url">
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

      <SharedImageUpload
        v-model="uploadedFile"
        v-model:src="keyset.img"
        :max-size-mb="maxUploadSizeMb"
        :loading="uploadingImage"
        class="mt-2"
      />
      <SharedImageDimensions :src="keyset.img" variant="help" />
    </UFormField>

    <div class="grid gap-2" :class="suggest ? 'grid-cols-1' : 'grid-cols-2'">
      <UFormField label="Status" name="status">
        <USelect
          v-model="keyset.status"
          :items="keysetStatusEnum"
          class="w-full"
        />
      </UFormField>

      <UFormField v-if="!suggest" label="Review Status" name="review_status">
        <USelect
          v-model="keyset.review_status"
          default-value="Pending"
          :items="Constants.public.Enums.review_status"
          :disabled="!userStore.isModerator"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField label="IC Date" name="ic_date">
      <UPopover>
        <UButton icon="hugeicons:calendar-03" variant="outline" class="w-full">
          {{ keyset.ic_date ? formatDate(keyset.ic_date) : 'Select a date' }}
        </UButton>

        <template #content>
          <UCalendar v-model="keyset.ic_date" />
        </template>
      </UPopover>
    </UFormField>

    <UFormField v-if="showGbDate" label="GB Time" name="gb_date">
      <UPopover>
        <UButton icon="hugeicons:calendar-03" variant="outline" class="w-full">
          <template v-if="range.start">
            <template v-if="range.end">
              {{ formatDateRange(range.start, range.end) }}
            </template>

            <template v-else>
              {{ formatDate(range.start) }}
            </template>
          </template>
          <template v-else> Pick a date </template>
        </UButton>

        <template #content>
          <UCalendar v-model="range" :number-of-months="2" range />
        </template>
      </UPopover>
    </UFormField>

    <UFormField label="Order Graph" name="order_graph">
      <UInput
        v-model.trim="keyset.order_graph"
        icon="hugeicons:bar-chart-horizontal"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Order History" name="order_history">
      <UInput
        v-model.trim="keyset.order_history"
        icon="hugeicons:chart-line-data-02"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="keyset.description" :rows="5" class="w-full" />
    </UFormField>

    <UButton
      v-if="isStandalone"
      block
      color="primary"
      type="submit"
      loading-auto
      :disabled="uploadingImage || imageUploadFailed"
    >
      Save
    </UButton>
  </component>
</template>

<script setup>
import { parseDate } from '@internationalized/date'
import { Constants } from '~/types/database.types'
import { createKeysetSchema } from '~/utils/schemas/keyset'

const emit = defineEmits([
  'onSuccess',
  'update:modelValue',
  'update:dateRange',
  'update:uploading',
])

const props = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Object,
    default: null,
  },
  dateRange: {
    type: Object,
    default: null,
  },
  isEdit: Boolean,
  mode: {
    type: String,
    default: 'standalone',
    validator: (value) => ['standalone', 'embedded'].includes(value),
  },
  // Suggest Edit (SharedSuggestionForm): hides the fields a suggestion
  // cannot change.
  suggest: Boolean,
  // Shows the keyset's colors (a new keyset in the submission wizard).
  colors: Boolean,
})

const route = useRoute()
const toast = useToast()
const userStore = useUserStore()
const keysetStatusEnum = Constants.public.Enums.keyset_status
const { groupedProfiles, manufacturers } = useKeysetProfiles()
const isEdit = computed(() => props.isEdit)
const isStandalone = computed(() => props.mode === 'standalone')
// Regular users never see status fields (server controls them); moderators
// reviewing an existing submission need to see and adjust them too.
const showAdminFields = computed(() => isStandalone.value)

const formWrapper = computed(() =>
  isStandalone.value ? resolveComponent('UForm') : 'div',
)
const schema = computed(() => createKeysetSchema(manufacturers))
const formWrapperProps = computed(() =>
  isStandalone.value
    ? { schema: schema.value, state: keyset.value, class: 'space-y-4' }
    : { class: 'space-y-4' },
)

const designerTerm = ref('')

const { data: designerData, status: designersStatus } = useGuardedSearch(
  '/api/keysets/designers',
  {
    key: 'keyset-designer-search',
    term: designerTerm,
  },
)

const designerOptions = computed(() => designerData.value?.designers || [])

const defaultKeyset = () => ({
  name: '',
  designer: '',
  profile_id: '',
  sculpt: '',
  url: '',
  img: '',
  description: '',
})

const keyset = ref(defaultKeyset())

const range = shallowRef({ start: undefined, end: undefined })
const uploadedFile = ref(null)
const uploadingImage = ref(false)
const imageUploadFailed = ref(false)
const maxUploadSizeMb = getMaxUploadSizeMb('keyset')

onBeforeMount(() => {
  const { page, size, ...rest } = props.modelValue || props.metadata || {}
  Object.assign(keyset.value, defaultKeyset(), rest)

  if (rest.ic_date) {
    keyset.value.ic_date = parseDate(rest.ic_date)
  }
  range.value = props.dateRange || {
    start: rest.start_date ? parseDate(rest.start_date) : undefined,
    end: rest.end_date ? parseDate(rest.end_date) : undefined,
  }
})

const ic = computed(() => keyset.value.status === 'Interest Check')
const showGbDate = computed(() => !showAdminFields.value || !ic.value)

const sculpts = [
  {
    type: 'label',
    label: 'Sculpted',
  },
  '1-1-2-3-4-4',
  '1-1-2-3-4-3',
  '1-1-2-3-4-5',
  '0-1-2-3-4-5',
  {
    type: 'label',
    label: 'Uniform',
  },
  'Uniform R3',
]

watch(
  () => props.modelValue,
  (value) => {
    if (value && value !== keyset.value) {
      Object.assign(keyset.value, defaultKeyset(), value)
    }
  },
)

watch(
  () => props.dateRange,
  (value) => {
    if (value && value !== range.value) {
      range.value = value
    }
  },
)

watch(
  keyset,
  (value) => {
    emit('update:modelValue', value)
  },
  { deep: true },
)

watch(
  range,
  (value) => {
    emit('update:dateRange', value)
  },
  { deep: true },
)

// Upload immediately on selection using a pending assignment path when the
// profile_keyset_id isn't known yet (e.g. new keyset submissions).
watch(uploadedFile, async (file) => {
  imageUploadFailed.value = false

  // Removed image: a failed upload no longer blocks saving
  if (!file) {
    emit('update:uploading', false)
    return
  }

  const assignment =
    keyset.value.profile_keyset_id ||
    `${keyset.value.profile_id || 'pending'}/pending-${Date.now()}`

  uploadingImage.value = true
  emit('update:uploading', true)

  try {
    keyset.value.img = await uploadImageToCloudflare({
      file,
      assignment,
      category: 'keyset',
    })
  } catch (e) {
    toast.add(errorToast(e))
    imageUploadFailed.value = true
  } finally {
    uploadingImage.value = false
    emit('update:uploading', imageUploadFailed.value)
  }
})

const onSubmit = async () => {
  if (
    !isStandalone.value ||
    uploadingImage.value ||
    imageUploadFailed.value
  ) {
    return
  }

  // The database builds profile_keyset_id from profile_id and slug.
  const slug = urlSlugify(keyset.value.name)
  keyset.value.slug = slug
  const path = `/keyset/${keyset.value.profile_id}/${slug}`

  if (keyset.value.ic_date) {
    keyset.value.ic_date = toISODate(keyset.value.ic_date)
  }
  if (range.value.start) {
    keyset.value.start_date = toISODate(range.value.start)
  }
  if (range.value.end) {
    keyset.value.end_date = toISODate(range.value.end)
  }

  $fetch(
    `/api/keysets/${route.params.profile}/${route.params.keyset || slug}`,
    {
      method: 'post',
      body: keyset.value,
    },
  )
    .then(() => {
      if (isEdit.value) {
        toast.add(successToast('update', { entity: 'Keyset', name: keyset.value.name }))

        if (route.params.keyset !== slug) {
          navigateTo(path)
        }
      } else {
        toast.add({
          ...successToast('add', { entity: 'Keyset', name: keyset.value.name }),
          actions: [
            {
              label: 'View',
              to: path,
            },
          ],
        })
      }

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}
</script>
