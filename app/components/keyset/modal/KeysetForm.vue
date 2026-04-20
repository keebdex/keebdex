<template>
  <UForm :schema="schema" :state="keyset" class="space-y-4" @submit="onSubmit">
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
        autocomplete
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
          :items="Constants.public.Enums.review_status"
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

    <UFormField v-if="!ic" label="GB Time" name="gb_date">
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

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { parseDate } from '@internationalized/date'
import slugify from 'slugify'
import { z } from 'zod'
import { Constants } from '~/types/database.types'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
})

const route = useRoute()
const toast = useToast()
const keysetStatusEnum = Constants.public.Enums.keyset_status
const { groupedProfiles, manufacturers } = useKeysetProfiles()

const designerTerm = ref('')
const designersStatus = ref('idle')
const designerOptions = ref([])

const keyset = ref({
  name: '',
  url: '',
  img: '',
})

const range = ref({})
const uploadedFile = ref(null)
const maxUploadSizeMb = getMaxUploadSizeMb('keyset')
let designerSearchTimer = null

const fetchDesignerOptions = async () => {
  const term = designerTerm.value.trim()

  if (term.length < 2) {
    designerOptions.value = []
    designersStatus.value = 'idle'
    return
  }

  designersStatus.value = 'pending'

  await $fetch('/api/keysets/designers', {
    query: {
      term,
    },
  })
    .then((data) => {
      designerOptions.value = data.designers || []
      designersStatus.value = 'success'
    })
    .catch((error) => {
      designerOptions.value = []
      designersStatus.value = 'error'
      toast.add(handleError(error))
    })
}

onBeforeMount(() => {
  const { page, size, ...rest } = metadata
  Object.assign(keyset.value, rest)

  if (rest.ic_date) {
    keyset.value.ic_date = parseDate(rest.ic_date)
  }
  if (rest.start_date) {
    range.value.start = parseDate(rest.start_date)
  }
  if (rest.end_date) {
    range.value.end = parseDate(rest.end_date)
  }
})

watch(designerTerm, () => {
  if (designerSearchTimer) {
    clearTimeout(designerSearchTimer)
  }

  designerSearchTimer = setTimeout(() => {
    fetchDesignerOptions()
  }, 250)
})

onBeforeUnmount(() => {
  if (designerSearchTimer) {
    clearTimeout(designerSearchTimer)
  }
})

const ic = computed(() => keyset.value.status === 'Interest Check')

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

const schema = z.object({
  name: z.string().min(1),
  designer: z.string().nullish(),
  sculpt: z.enum(sculpts.filter((s) => typeof s === 'string')).nullish(),
  profile_id: z
    .string()
    .min(1)
    .refine((value) => !!manufacturers.value[value], 'Invalid keyset profile'),
  url: z.url().nullish().or(z.string().min(0).max(0)),
  img: z.url().nullish().or(z.string().min(0).max(0)),
  // ic_date: z.date(),
  // start_date: z.date(),
  // end_date: z.date(),
  status: z.enum(keysetStatusEnum).nullish(),
  review_status: z.enum(Constants.public.Enums.review_status).nullish(),
  order_graph: z.url().nullish().or(z.string().min(0).max(0)),
  order_history: z.url().nullish().or(z.string().min(0).max(0)),
  // description: z.string(),
})

const onSubmit = async () => {
  const slug = slugify(keyset.value.name, { lower: true })
  keyset.value.profile_keyset_id = `${keyset.value.profile_id}/${slug}`

  if (uploadedFile.value) {
    try {
      keyset.value.img = await uploadImageToCloudflare({
        file: uploadedFile.value,
        assignment: keyset.value.profile_keyset_id,
        category: 'keyset',
      })
    } catch (e) {
      toast.add(handleError(e))
      return
    }
  }

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
      if (isEdit) {
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
