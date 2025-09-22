<template>
  <UForm :schema="schema" :state="keycap" class="space-y-4">
    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Name" name="name" required>
        <UInput
          v-model.trim="keycap.name"
          icon="hugeicons:text"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Designer" name="designer">
        <UInput
          v-model.trim="keycap.designer"
          icon="hugeicons:user-star-01"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Profile" name="profile">
        <USelect
          v-model="keycap.profile_id"
          :items="
            Object.entries(keycapProfiles)
              .map(([profile, manufacturers], idx) => {
                return [
                  { type: 'label', label: profile },
                  ...Object.entries(manufacturers).map(([value, label]) => ({
                    type: 'item',
                    label,
                    value,
                  })),
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
        <UInput
          v-model.trim="keycap.sculpt"
          icon="hugeicons:dashboard-square-02"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField label="URL" name="url">
      <UInput
        v-model.trim="keycap.url"
        icon="hugeicons:globe-02"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Render" name="render_img">
      <UInput
        v-model.trim="keycap.render_img"
        icon="hugeicons:image-02"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Cover" name="cover_img">
      <UInput
        v-model.trim="keycap.cover_img"
        icon="hugeicons:image-02"
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-2 gap-2">
      <UFormField label="Status" name="status">
        <USelect
          v-model="keycap.status"
          :items="Object.keys(keycapStatuses)"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Review Status" name="review_status">
        <USelect
          v-model="keycap.review_status"
          :items="['Pending', 'Approved', 'Rejected']"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField label="IC Date" name="ic_date">
      <UPopover>
        <UButton icon="hugeicons:calendar-03" variant="outline" class="w-full">
          {{ keycap.ic_date ? formatDate(keycap.ic_date) : 'Select a date' }}
        </UButton>

        <template #content>
          <UCalendar v-model="keycap.ic_date" />
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
        v-model.trim="keycap.order_graph"
        icon="hugeicons:bar-chart-horizontal"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Order History" name="order_history">
      <UInput
        v-model.trim="keycap.order_history"
        icon="hugeicons:chart-line-data-02"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="keycap.description" :rows="5" class="w-full" />
    </UFormField>

    <!-- FIXME: I don't know why form submit is not working for this form. So I need to did this -->
    <UButton block color="primary" type="submit" @click="onSubmit">
      Save
    </UButton>
  </UForm>
</template>

<script setup>
import { parseDate } from '@internationalized/date'
import slugify from 'slugify'
import { z } from 'zod'

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

const keycap = ref({
  name: '',
  url: '',
  render_img: '',
})

const range = ref({})

onBeforeMount(() => {
  const { page, size, ...rest } = metadata
  Object.assign(keycap.value, rest)

  if (rest.ic_date) {
    keycap.value.ic_date = parseDate(rest.ic_date)
  }
  if (rest.start_date) {
    range.value.start = parseDate(rest.start_date)
  }
  if (rest.end_date) {
    range.value.end = parseDate(rest.end_date)
  }
})

const ic = computed(() => keycap.value.status === 'Interest Check')

const schema = z.object({
  name: z.string().min(1),
  designer: z.string().nullish(),
  sculpt: z.string().nullish(),
  profile_id: z.enum(Object.keys(manufacturers)),
  url: z.url().nullish().or(z.string().min(0).max(0)),
  render_img: z.url().nullish().or(z.string().min(0).max(0)),
  cover_img: z.url().nullish().or(z.string().min(0).max(0)),
  // ic_date: z.date(),
  // start_date: z.date(),
  // end_date: z.date(),
  status: z.enum(Object.keys(keycapStatuses)).nullish(),
  order_graph: z.url().nullish().or(z.string().min(0).max(0)),
  order_history: z.url().nullish().or(z.string().min(0).max(0)),
  // description: z.string(),
})

const onSubmit = () => {
  const slug = isEdit
    ? keycap.value.id
    : slugify(keycap.value.name, { lower: true })

  if (!isEdit) {
    keycap.value.profile_keycap_id = `${keycap.value.profile_id}/${slug}`
  }

  if (keycap.value.ic_date) {
    keycap.value.ic_date = toISODate(keycap.value.ic_date)
  }
  if (range.value.start) {
    keycap.value.start_date = toISODate(range.value.start)
  }
  if (range.value.end) {
    keycap.value.end_date = toISODate(range.value.end)
  }

  /**
   * FIXME: maybe we need to change this
   * this is workaroundto handle updating render_img and refresh cdn image
   */
  if (metadata.render_img && metadata.render_img !== keycap.value.render_img) {
    keycap.value.img = ''
  }

  $fetch(`/api/keycaps/${route.params.profile}/${slug}`, {
    method: 'post',
    body: keycap.value,
  })
    .then(() => {
      if (isEdit) {
        toast.add({
          color: 'success',
          title: `Keycap **${keycap.value.name}** has been updated successfully.`,
        })
      } else {
        toast.add({
          color: 'success',
          title: `Keycap [${keycap.value.name}] has been created successfully.`,
          actions: [
            {
              label: 'View',
              to: `/keycap/${keycap.value.profile_keycap_id}`,
            },
          ],
        })
      }

      emit('onSuccess')
    })
    .catch((error) => {
      toast.add({
        color: 'error',
        title: 'Oops! Something went wrong',
        description: error.message,
      })
    })
}
</script>
