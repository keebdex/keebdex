<template>
  <UDashboardPanel id="notifications">
    <template #header>
      <UDashboardNavbar title="Notifications">
        <template #right>
          <UButton
            icon="hugeicons:settings-02"
            aria-label="Notification Settings"
            label="Settings"
            to="/account/settings/notifications"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
        </template>

        <template #right>
          <UButton
            label="Mark all as read"
            aria-label="Mark all as read"
            icon="hugeicons:check-check"
            :disabled="
              filter === 'announcements' ? !unreadAnnouncements : !unread
            "
            @click="
              filter === 'announcements'
                ? markAllAnnouncementsRead()
                : markAllRead()
            "
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div
        v-if="filter === 'announcements'"
        class="mx-auto w-full lg:max-w-3xl space-y-6"
      >
        <div
          v-if="!announcementsLoaded"
          class="flex justify-center py-16 text-dimmed"
        >
          <UIcon
            :name="appConfig.ui.icons.loading"
            class="size-6 animate-spin"
          />
        </div>

        <UEmpty
          v-else-if="!announcementItems.length"
          icon="hugeicons:megaphone-01"
          title="No Announcements Right Now"
          description="News about Keebdex shows up here when there is something to share."
        />

        <template v-else>
          <section
            v-for="group in announcementGroups"
            :key="group.label"
            :aria-labelledby="`announcements-${group.id}`"
            class="space-y-1"
          >
            <h2
              :id="`announcements-${group.id}`"
              class="px-3 text-xs font-semibold uppercase tracking-wide text-dimmed"
            >
              {{ group.label }}
            </h2>

            <UPageCard variant="subtle" :ui="{ container: 'p-1 sm:p-1' }">
              <NotificationAnnouncementItem
                v-for="announcement in group.items"
                :key="announcement.key"
                :announcement="announcement"
                :unread="isAnnouncementUnread(announcement)"
                @open="dismissAnnouncement(announcement.key)"
                @read="dismissAnnouncement(announcement.key)"
              />
            </UPageCard>
          </section>
        </template>
      </div>

      <div v-else class="mx-auto w-full lg:max-w-3xl space-y-6">
        <div
          v-if="!loaded && loading"
          class="flex justify-center py-16 text-dimmed"
        >
          <UIcon
            :name="appConfig.ui.icons.loading"
            class="size-6 animate-spin"
          />
        </div>

        <UEmpty
          v-else-if="!visible.length && !hasMore"
          :icon="
            filter === 'unread'
              ? 'hugeicons:checkmark-circle-02'
              : 'hugeicons:notification-01'
          "
          :title="
            filter === 'unread'
              ? 'Inbox Zero, Endgame Achieved'
              : 'Quiet as a Lubed Linear'
          "
          :description="
            filter === 'unread'
              ? 'You have read everything. Go type on something nice.'
              : 'Nothing here yet. We will ping you when something happens.'
          "
        />

        <template v-else>
          <section
            v-for="group in groups"
            :key="group.label"
            :aria-labelledby="`notifications-${group.id}`"
            class="space-y-1"
          >
            <h2
              :id="`notifications-${group.id}`"
              class="px-3 text-xs font-semibold uppercase tracking-wide text-dimmed"
            >
              {{ group.label }}
            </h2>

            <UPageCard variant="subtle" :ui="{ container: 'p-1 sm:p-1' }">
              <NotificationItem
                v-for="notification in group.items"
                :key="notification.id"
                :notification="notification"
                @open="markRead"
                @toggle-read="toggleRead"
                @delete="remove"
              />
            </UPageCard>
          </section>

          <p v-if="!visible.length" class="text-center text-sm text-muted">
            No unread notifications among the ones loaded so far.
          </p>

          <div v-if="hasMore" class="flex justify-center">
            <UButton
              label="Load older notifications"
              variant="outline"
              color="neutral"
              :loading="loadingOlder"
              @click="loadOlder"
            />
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type {
  AppNotification,
  NotificationDateGroup,
} from '~/utils/notifications'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Notifications',
})

const appConfig = useAppConfig()

const {
  items,
  unread,
  hasMore,
  loaded,
  loading,
  loadingOlder,
  loadOlder,
  markRead,
  markUnread,
  markAllRead,
  remove,
} = useNotifications()

const route = useRoute()

// All / Unread / Announcements live in the URL (`?filter=unread`) so the
// menu links work.
const filter = computed(() =>
  route.query.filter === 'unread' || route.query.filter === 'announcements'
    ? route.query.filter
    : 'all',
)

// Announcements have their own tab, so personal notifications don't get lost
// among them, and their own unread badge. Reading one (or its CTA) dismisses
// it, so it no longer shows as a toast either.
const {
  items: announcementItems,
  loaded: announcementsLoaded,
  unread: unreadAnnouncements,
  isUnread: isAnnouncementUnread,
  load: loadAnnouncements,
  dismiss: dismissAnnouncement,
  markAllRead: markAllAnnouncementsRead,
} = useAnnouncements()

onMounted(() => loadAnnouncements())

const links = computed(() => [
  {
    label: 'All',
    to: '/notifications',
    active: filter.value === 'all',
  },
  {
    label: 'Unread',
    to: { path: '/notifications', query: { filter: 'unread' } },
    active: filter.value === 'unread',
    badge: unread.value
      ? {
          label: String(unread.value),
          color: 'error' as const,
          variant: 'subtle' as const,
        }
      : undefined,
  },
  {
    label: 'Announcements',
    to: { path: '/notifications', query: { filter: 'announcements' } },
    active: filter.value === 'announcements',
    badge: unreadAnnouncements.value
      ? {
          label: String(unreadAnnouncements.value),
          color: 'primary' as const,
          variant: 'subtle' as const,
        }
      : undefined,
  },
])

const visible = computed(() =>
  filter.value === 'unread'
    ? items.value.filter((item) => !item.read_at)
    : items.value,
)

const GROUP_IDS: Record<NotificationDateGroup, string> = {
  Today: 'today',
  Yesterday: 'yesterday',
  'Earlier this week': 'this-week',
  Older: 'older',
}

// Splits newest-first items into date groups (each a consecutive run).
const groupByDate = <T,>(items: T[], date: (item: T) => string) => {
  const now = new Date()
  const result: { id: string; label: NotificationDateGroup; items: T[] }[] =
    []

  for (const item of items) {
    const label = notificationDateGroup(date(item), now)
    const last = result.at(-1)

    if (last?.label === label) {
      last.items.push(item)
    } else {
      result.push({ id: GROUP_IDS[label], label, items: [item] })
    }
  }

  return result
}

const groups = computed(() =>
  groupByDate(visible.value, (item) => item.created_at),
)

// Newest first like notifications; priority only orders the toasts.
const announcementGroups = computed(() =>
  groupByDate(
    [...announcementItems.value].sort((a, b) =>
      b.starts_at.localeCompare(a.starts_at),
    ),
    (item) => item.starts_at,
  ),
)

const toggleRead = (notification: AppNotification) =>
  notification.read_at ? markUnread(notification) : markRead(notification)
</script>
