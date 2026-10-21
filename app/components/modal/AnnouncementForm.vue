<template>
  <UForm
    :state="form"
    :validate="validate"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Title" name="title" required>
      <UInput
        v-model="form.title"
        :maxlength="80"
        class="w-full"
        @update:model-value="syncKey"
      />
    </UFormField>

    <UFormField
      label="Key"
      name="key"
      required
      :help="
        isEdit
          ? 'The key stays fixed: dismissals are stored under it.'
          : 'Toast id and where dismissals are stored. It cannot change later.'
      "
    >
      <UInput
        v-model="form.key"
        :disabled="isEdit"
        :maxlength="64"
        class="w-full font-mono"
        @update:model-value="keyEdited = true"
      />
    </UFormField>

    <UFormField label="Description" name="description">
      <UTextarea
        v-model="form.description"
        :rows="3"
        :maxlength="280"
        autoresize
        class="w-full"
      />
    </UFormField>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Icon" name="icon" help="An Iconify name.">
        <UInput
          v-model="form.icon"
          :icon="form.icon || ANNOUNCEMENT_DEFAULT_ICON"
          :placeholder="ANNOUNCEMENT_DEFAULT_ICON"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Color" name="color" required>
        <USelect v-model="form.color" :items="colorOptions" class="w-full" />
      </UFormField>

      <UFormField label="Button Label" name="cta_label">
        <UInput
          v-model="form.cta_label"
          :maxlength="30"
          placeholder="e.g. Try It"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Button Link"
        name="cta_url"
        help="https:// or a path such as /artisan/wishlist."
      >
        <UInput
          v-model="form.cta_url"
          placeholder="/artisan/wishlist"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Audience" name="audience" required>
        <USelect
          v-model="form.audience"
          :items="audienceOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Priority"
        name="priority"
        help="Higher shows first: the top three toasts and the top banner."
      >
        <UInputNumber
          v-model="form.priority"
          :min="-1000"
          :max="1000"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Starts"
        name="starts_at"
        required
        help="A future date schedules it."
      >
        <UPopover>
          <UButton
            icon="hugeicons:calendar-03"
            variant="outline"
            class="w-full"
          >
            {{ startsOn ? formatDay(startsOn) : 'Pick a date' }}
          </UButton>

          <template #content>
            <UCalendar v-model="startsOn" />
          </template>
        </UPopover>
      </UFormField>

      <UFormField
        label="Ends"
        name="ends_at"
        help="The last day it shows. Empty keeps it live."
      >
        <UFieldGroup class="w-full">
          <UPopover>
            <UButton
              icon="hugeicons:calendar-03"
              variant="outline"
              class="flex-1"
            >
              {{ endsOn ? formatDay(endsOn) : 'No end' }}
            </UButton>

            <template #content>
              <UCalendar v-model="endsOn" :min-value="startsOn" />
            </template>
          </UPopover>

          <UButton
            v-if="endsOn"
            icon="hugeicons:cancel-01"
            variant="outline"
            aria-label="Clear end date"
            @click="endsOn = undefined"
          />
        </UFieldGroup>
      </UFormField>
    </div>

    <UFormField
      label="Show As"
      name="display"
      required
      help="It is always listed in the Announcements tab."
    >
      <URadioGroup
        v-model="form.display"
        :items="ANNOUNCEMENT_DISPLAY_OPTIONS"
        variant="card"
        orientation="horizontal"
        indicator="hidden"
        :ui="{ fieldset: 'grid sm:grid-cols-3 gap-2', item: 'items-start' }"
      />
    </UFormField>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-medium text-highlighted">Preview</p>

        <UButton
          v-if="form.display === 'toast'"
          label="Preview Toast"
          icon="hugeicons:eye"
          size="sm"
          :ui="{ label: 'block' }"
          :disabled="!form.title.trim()"
          @click="previewToast"
        />
      </div>

      <!-- The chosen display first, then the tab row every announcement gets. -->
      <template v-if="form.display === 'banner'">
        <p class="text-xs text-muted">Banner</p>

        <UBanner
          v-bind="announcementBanner(preview, () => {})"
          :close="false"
          class="rounded-md overflow-hidden"
        />
      </template>

      <p class="text-xs text-muted">Announcements tab</p>

      <UPageCard variant="subtle" :ui="{ container: 'p-1 sm:p-1' }">
        <NotificationAnnouncementItem :announcement="preview" />
      </UPageCard>
    </div>

    <UButton type="submit" block color="primary" :loading="saving">
      {{ isEdit ? 'Save Changes' : 'Create Announcement' }}
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import {
  type DateValue,
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
  today,
} from '@internationalized/date'
import {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_COLORS,
  announcementPatchSchema,
  announcementSchema,
} from '~/utils/schemas/announcement'
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementColor,
  AnnouncementDisplay,
} from '~/utils/announcements'

const PREVIEW_TOAST_ID = 'announcement-preview'

const props = defineProps<{
  announcement?: Announcement | null
}>()

const emit = defineEmits<{ onSuccess: [announcement: Announcement] }>()

const toast = useToast()

const isEdit = computed(() => !!props.announcement)

const colorOptions = ANNOUNCEMENT_COLORS.map((value) => ({
  label: value[0]!.toUpperCase() + value.slice(1),
  value,
}))

const audienceOptions = ANNOUNCEMENT_AUDIENCES.map((value) => ({
  label: ANNOUNCEMENT_AUDIENCE_LABELS[value],
  value,
}))

// The schedule is picked by day in the admin's time zone: an announcement
// starts at the start of its first day and ends after its last day.
const timeZone = getLocalTimeZone()

const toDay = (date: Date) => toCalendarDate(fromDate(date, timeZone))

const formatDay = (day: DateValue) =>
  formatAnnouncementDay(toCalendarDate(day).toDate(timeZone))

const source = props.announcement

const sourceStart = source ? toDay(new Date(source.starts_at)) : undefined
const sourceEnd = source?.ends_at
  ? toDay(announcementLastDay(source.ends_at))
  : undefined

// An unchanged day keeps the stored time (e.g. the moment it was unpublished).
const startIso = (value?: DateValue) => {
  if (!value) return null

  const day = toCalendarDate(value)

  if (sourceStart && day.compare(sourceStart) === 0) return source!.starts_at

  return day.toDate(timeZone).toISOString()
}

const endIso = (value?: DateValue) => {
  if (!value) return null

  const day = toCalendarDate(value)

  if (sourceEnd && day.compare(sourceEnd) === 0) return source!.ends_at

  return day.add({ days: 1 }).toDate(timeZone).toISOString()
}

// Kept out of the reactive form: reactive() unwraps the date classes into
// plain types that lose their private fields.
const startsOn = shallowRef<DateValue | undefined>(
  sourceStart || today(timeZone),
)
const endsOn = shallowRef<DateValue | undefined>(sourceEnd)

const form = reactive({
  key: source?.key || '',
  title: source?.title || '',
  description: source?.description || '',
  icon: source?.icon || '',
  color: (source?.color || 'primary') as AnnouncementColor,
  cta_label: source?.cta_label || '',
  cta_url: source?.cta_url || '',
  display: (source?.display || 'toast') as AnnouncementDisplay,
  audience: (source?.audience || 'all') as AnnouncementAudience,
  priority: source?.priority ?? 0,
})

// New announcements take their key from the title until it is typed in.
const keyEdited = ref(isEdit.value)

const syncKey = () => {
  if (keyEdited.value) return

  form.key = form.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '')
}

const toPayload = () => {
  const { key, ...fields } = form
  const body = {
    ...fields,
    starts_at: startIso(startsOn.value),
    ends_at: endIso(endsOn.value),
  }

  return isEdit.value ? body : { key, ...body }
}

const schema = computed(() =>
  isEdit.value ? announcementPatchSchema : announcementSchema,
)

const validate = (): FormError[] => {
  const result = schema.value.safeParse(toPayload())

  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        name: String(issue.path[0] ?? ''),
        message: issue.message,
      }))
}

const preview = computed(() => ({
  title: form.title.trim() || 'Announcement title',
  description: form.description.trim() || null,
  icon: form.icon.trim() || null,
  color: form.color,
  cta_label: form.cta_label.trim() || null,
  cta_url: form.cta_url.trim() || null,
  starts_at: startIso(startsOn.value) || new Date().toISOString(),
}))

// Adding the same id again updates a preview that is still open.
const previewToast = () => {
  toast.add(
    announcementToast({ ...preview.value, key: PREVIEW_TOAST_ID }, () => {}),
  )
}

const saving = ref(false)

const onSubmit = async () => {
  const result = schema.value.safeParse(toPayload())

  if (!result.success) {
    toast.add(validationToast(result.error.issues[0]?.message))
    return
  }

  saving.value = true

  try {
    const saved = await $fetch<Announcement>(
      isEdit.value
        ? `/api/admin/announcements/${encodeURIComponent(props.announcement!.key)}`
        : '/api/admin/announcements',
      { method: 'post', body: result.data },
    )

    toast.add(
      successToast(isEdit.value ? 'update' : 'add', {
        entity: 'Announcement',
        name: saved.title,
      }),
    )
    emit('onSuccess', saved)
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    saving.value = false
  }
}
</script>
