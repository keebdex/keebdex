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
        help="Higher shows first. The homepage shows the top three."
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
        help="A future time schedules it."
      >
        <UInput v-model="form.starts_at" type="datetime-local" class="w-full" />
      </UFormField>

      <UFormField label="Ends" name="ends_at" help="Empty keeps it live.">
        <UInput v-model="form.ends_at" type="datetime-local" class="w-full" />
      </UFormField>
    </div>

    <UFormField name="show_toast">
      <USwitch
        v-model="form.show_toast"
        label="Show as a toast on the homepage"
        description="It is always listed in the Announcements tab."
      />
    </UFormField>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-medium text-highlighted">Preview</p>

        <UButton
          label="Preview Toast"
          icon="hugeicons:eye"
          size="sm"
          :ui="{ label: 'block' }"
          :disabled="!form.title.trim()"
          @click="previewToast"
        />
      </div>

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
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_COLORS,
  announcementPatchSchema,
  announcementSchema,
} from '~/utils/schemas/announcement'
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementColor,
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

// `datetime-local` works in the admin's local time without a zone.
const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''

  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const toIso = (local: string) => {
  if (!local) return null

  const date = new Date(local)

  return Number.isNaN(date.getTime()) ? local : date.toISOString()
}

const source = props.announcement

const form = reactive({
  key: source?.key || '',
  title: source?.title || '',
  description: source?.description || '',
  icon: source?.icon || '',
  color: (source?.color || 'primary') as AnnouncementColor,
  cta_label: source?.cta_label || '',
  cta_url: source?.cta_url || '',
  show_toast: source?.show_toast ?? true,
  audience: (source?.audience || 'all') as AnnouncementAudience,
  priority: source?.priority ?? 0,
  starts_at: toLocalInput(source?.starts_at || new Date().toISOString()),
  ends_at: toLocalInput(source?.ends_at),
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
    starts_at: toIso(form.starts_at),
    ends_at: toIso(form.ends_at),
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
  starts_at: toIso(form.starts_at) || new Date().toISOString(),
}))

// Adding the same id again updates a preview that is still open.
const previewToast = () => {
  toast.add({
    ...announcementToast(
      { ...preview.value, key: PREVIEW_TOAST_ID },
      () => {},
    ),
    // A preview must not stay on screen like the real one.
    duration: 8000,
    close: true,
  })
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
