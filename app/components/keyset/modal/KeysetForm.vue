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

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Profile" name="profile" required>
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

      <p class="mt-2 text-xs text-muted">
        Or drag and drop an image below to upload and auto-fill this field.
      </p>

      <div class="mt-2 space-y-2">
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

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Status" name="status">
        <USelect
          v-model="keyset.status"
          :items="keysetStatusEnum"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Review Status" name="review_status">
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
    >
      Save
    </UButton>
  </component>
</template>

<script setup>
import { parseDate } from '@internationalized/date'
import slugify from 'slugify'
import { Constants } from '~/types/database.types'
import { createKeysetSchema } from '~/utils/schemas/keyset'

const emit = defineEmits(['onSuccess', 'update:modelValue', 'update:dateRange'])

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
  if (!file) return

  const assignment =
    keyset.value.profile_keyset_id ||
    `${keyset.value.profile_id || 'pending'}/pending-${Date.now()}`

  uploadingImage.value = true

  try {
    keyset.value.img = await uploadImageToCloudflare({
      file,
      assignment,
      category: 'keyset',
    })
  } catch (e) {
    toast.add(handleError(e))
  } finally {
    uploadingImage.value = false
  }
})

const onSubmit = async () => {
  if (!isStandalone.value) return

  const slug = slugify(keyset.value.name, { lower: true })
  keyset.value.profile_keyset_id = `${keyset.value.profile_id}/${slug}`

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
        toast.add(handleSuccess('update', keyset.value.name, 'Keyset'))

        if (route.params.keyset !== slug) {
          navigateTo(`/keyset/${keyset.value.profile_keyset_id}`)
        }
      } else {
        toast.add({
          ...handleSuccess('add', keyset.value.name, 'Keyset'),
          actions: [
            {
              label: 'View',
              to: `/keyset/${keyset.value.profile_keyset_id}`,
            },
          ],
        })
      }

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
