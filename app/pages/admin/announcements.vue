<template>
  <SharedRedirectPage v-if="!isAdmin" to="/account/settings" />

  <UDashboardPanel v-else id="admin-announcements">
    <template #header>
      <UDashboardNavbar title="Announcements">
        <template #right>
          <UButton
            label="New Announcement"
            icon="hugeicons:add-01"
            color="primary"
            @click="openEditor(null)"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageCard
        variant="subtle"
        class="mx-auto min-w-0 w-full lg:max-w-6xl"
        :ui="{ container: 'min-w-0', wrapper: 'min-w-0' }"
      >
        <template #header>
          Announcements show as toasts when the site opens (top three by
          priority) and in the Announcements tab of Notifications. Changes apply
          on the next page load, without a deploy.
        </template>

        <UTable
          sticky
          :loading="status === 'pending'"
          :data="data?.data || []"
          :columns="columns"
          class="min-w-0 max-w-full"
        >
          <template #title-cell="{ row }">
            <div class="flex items-start gap-2 min-w-48 max-w-md">
              <UIcon
                :name="row.original.icon || ANNOUNCEMENT_DEFAULT_ICON"
                class="size-5 shrink-0 mt-0.5 text-muted"
              />
              <div class="min-w-0">
                <p class="font-medium text-highlighted truncate">
                  {{ row.original.title }}
                </p>
                <p class="text-xs text-dimmed font-mono truncate">
                  {{ row.original.key }}
                </p>
              </div>
            </div>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="STATUS_LABELS[announcementStatus(row.original, now)]"
              :color="STATUS_COLORS[announcementStatus(row.original, now)]"
              variant="subtle"
            />
          </template>

          <template #audience-cell="{ row }">
            {{ ANNOUNCEMENT_AUDIENCE_LABELS[row.original.audience] }}
          </template>

          <template #show_toast-cell="{ row }">
            <UIcon
              :name="
                row.original.show_toast
                  ? 'hugeicons:checkmark-circle-02'
                  : 'hugeicons:minus-sign-circle'
              "
              :class="row.original.show_toast ? 'text-success' : 'text-dimmed'"
              class="size-5"
              :aria-label="row.original.show_toast ? 'Toast' : 'Tab only'"
            />
          </template>

          <template #schedule-cell="{ row }">
            <div class="text-sm whitespace-nowrap">
              <p>
                {{ formatAnnouncementDay(new Date(row.original.starts_at)) }}
              </p>
              <p class="text-dimmed">
                {{
                  row.original.ends_at
                    ? `until ${formatAnnouncementDay(announcementLastDay(row.original.ends_at))}`
                    : 'No end'
                }}
              </p>
            </div>
          </template>

          <template #action-cell="{ row }">
            <div class="flex items-center justify-end gap-1">
              <UTooltip text="Preview Toast">
                <UButton
                  icon="hugeicons:eye"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  aria-label="Preview toast"
                  @click="previewToast(row.original)"
                />
              </UTooltip>

              <UTooltip text="Edit">
                <UButton
                  icon="hugeicons:pencil-edit-02"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  aria-label="Edit announcement"
                  @click="openEditor(row.original)"
                />
              </UTooltip>

              <UTooltip
                v-if="announcementStatus(row.original, now) !== 'ended'"
                text="Unpublish"
              >
                <UButton
                  icon="hugeicons:stop-circle"
                  variant="ghost"
                  color="warning"
                  size="sm"
                  aria-label="Unpublish announcement"
                  @click="
                    confirmTarget = {
                      action: 'unpublish',
                      announcement: row.original,
                    }
                  "
                />
              </UTooltip>

              <UTooltip text="Delete">
                <UButton
                  icon="hugeicons:delete-02"
                  variant="ghost"
                  color="error"
                  size="sm"
                  aria-label="Delete announcement"
                  @click="
                    confirmTarget = {
                      action: 'delete',
                      announcement: row.original,
                    }
                  "
                />
              </UTooltip>
            </div>
          </template>

          <template #empty>
            <UEmpty
              icon="hugeicons:megaphone-01"
              title="No Announcements Yet"
              description="Publish news for everyone, guests, signed-in users, or staff."
              :actions="[
                {
                  label: 'New Announcement',
                  icon: 'hugeicons:add-01',
                  ui: { label: 'block' },
                  onClick: () => openEditor(null),
                },
              ]"
            />
          </template>
        </UTable>
      </UPageCard>

      <UModal
        v-model:open="editorOpen"
        :title="editing ? 'Edit Announcement' : 'New Announcement'"
      >
        <template #body>
          <ModalAnnouncementForm
            :announcement="editing"
            @on-success="onSaved"
          />
        </template>
      </UModal>

      <SharedConfirmModal
        v-model:open="confirmOpen"
        :title="confirmCopy.title"
        :description="confirmCopy.description"
        :confirm-label="confirmCopy.label"
        :confirm-color="confirmCopy.color"
        :loading="confirming"
        @confirm="confirm"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Announcement, AnnouncementStatus } from '~/utils/announcements'

definePageMeta({
  middleware: 'admin',
})

useSeoMeta({
  title: 'Announcements',
})

const { isAdmin } = storeToRefs(useUserStore())
const toast = useToast()

const { data, status, refresh } = useFetch<{ data: Announcement[] }>(
  '/api/admin/announcements',
  { key: 'admin-announcements' },
)

// Statuses are computed against the time the list was loaded.
const now = ref(Date.now())
watch(data, () => (now.value = Date.now()))

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  ended: 'Ended',
}

const STATUS_COLORS: Record<
  AnnouncementStatus,
  'info' | 'success' | 'neutral'
> = {
  scheduled: 'info',
  live: 'success',
  ended: 'neutral',
}

const columns = [
  { accessorKey: 'title', header: 'Announcement' },
  { id: 'status', header: 'Status' },
  { accessorKey: 'audience', header: 'Audience' },
  { accessorKey: 'show_toast', header: 'Toast' },
  { accessorKey: 'priority', header: 'Priority' },
  { id: 'schedule', header: 'Schedule' },
  { id: 'action' },
]

const previewToast = (announcement: Announcement) => {
  toast.add(
    announcementToast(
      { ...announcement, key: `preview-${announcement.key}` },
      () => {},
    ),
  )
}

const editorOpen = ref(false)
const editing = ref<Announcement | null>(null)

const openEditor = (announcement: Announcement | null) => {
  editing.value = announcement
  editorOpen.value = true
}

const onSaved = () => {
  editorOpen.value = false
  refresh()
}

const confirmTarget = ref<{
  action: 'delete' | 'unpublish'
  announcement: Announcement
} | null>(null)
const confirming = ref(false)

const confirmCopy = computed(() => {
  const title = confirmTarget.value?.announcement.title

  return confirmTarget.value?.action === 'delete'
    ? {
        title: 'Delete Announcement',
        description: `"${title}" and its dismissals will be deleted. This cannot be undone.`,
        label: 'Delete',
        color: 'error' as const,
      }
    : {
        title: 'Unpublish Announcement',
        description: `"${title}" ends now and stops showing. Edit its dates to publish it again.`,
        label: 'Unpublish',
        color: 'primary' as const,
      }
})

const confirmOpen = computed({
  get: () => !!confirmTarget.value,
  set: (value) => {
    if (!value && !confirming.value) confirmTarget.value = null
  },
})

const confirm = async () => {
  if (!confirmTarget.value) return

  const { action, announcement } = confirmTarget.value
  const url = `/api/admin/announcements/${encodeURIComponent(announcement.key)}`

  confirming.value = true

  try {
    if (action === 'delete') {
      await $fetch(url, { method: 'delete' })
      toast.add(
        successToast('delete', {
          entity: 'Announcement',
          name: announcement.title,
        }),
      )
    } else {
      // Ending now; a scheduled one also starts now so ends_at > starts_at.
      const nowIso = new Date().toISOString()
      const scheduled = announcementStatus(announcement) === 'scheduled'

      await $fetch(url, {
        method: 'post',
        body: scheduled
          ? {
              starts_at: new Date(Date.now() - 1000).toISOString(),
              ends_at: nowIso,
            }
          : { ends_at: nowIso },
      })
      toast.add(
        successToast('update', {
          entity: 'Announcement',
          name: announcement.title,
        }),
      )
    }

    confirmTarget.value = null
    await refresh()
  } catch (error) {
    toast.add(errorToast(error, { showOriginalMessage: true }))
  } finally {
    confirming.value = false
  }
}
</script>
