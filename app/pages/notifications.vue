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
          <UTabs
            v-model="readFilter"
            :items="readFilterItems"
            :content="false"
            size="xs"
            aria-label="Show"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div
        v-if="tab === 'announcements'"
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
          v-else-if="!visibleAnnouncements.length"
          :icon="
            unreadOnly
              ? 'hugeicons:checkmark-circle-02'
              : 'hugeicons:megaphone-01'
          "
          :title="unreadOnly ? 'All Caught Up' : 'No Announcements Right Now'"
          :description="
            unreadOnly
              ? 'You have read every announcement.'
              : 'News about Keebdex shows up here when there is something to share.'
          "
          :actions="unreadOnly ? showAllActions : undefined"
        />

        <template v-else>
          <section
            v-for="(group, index) in announcementGroups"
            :key="group.label"
            :aria-labelledby="`announcements-${group.id}`"
            class="space-y-2"
          >
            <div class="flex items-center justify-between gap-2 px-3">
              <h2
                :id="`announcements-${group.id}`"
                class="text-xs font-semibold uppercase tracking-wide text-dimmed"
              >
                {{ group.label }}
              </h2>

              <UButton
                v-if="!index && currentUnread"
                label="Mark all as read"
                icon="hugeicons:check-check"
                variant="link"
                color="neutral"
                size="xs"
                class="-my-1 px-0"
                :ui="{ label: 'block' }"
                @click="markAllCurrentRead"
              />
            </div>

            <UPageCard variant="subtle" :ui="{ container: 'p-1 sm:p-1 divide-y divide-default' }">
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
            unreadOnly
              ? 'hugeicons:checkmark-circle-02'
              : 'hugeicons:notification-01'
          "
          :title="
            unreadOnly
              ? 'Inbox Zero, Endgame Achieved'
              : 'Quiet as a Lubed Linear'
          "
          :description="
            unreadOnly
              ? 'You have read everything. Go type on something nice.'
              : 'Nothing here yet. We will ping you when something happens.'
          "
          :actions="unreadOnly ? showAllActions : undefined"
        />

        <template v-else>
          <section
            v-for="(group, index) in groups"
            :key="group.label"
            :aria-labelledby="`notifications-${group.id}`"
            class="space-y-2"
          >
            <div class="flex items-center justify-between gap-2 px-3">
              <h2
                :id="`notifications-${group.id}`"
                class="text-xs font-semibold uppercase tracking-wide text-dimmed"
              >
                {{ group.label }}
              </h2>

              <UButton
                v-if="!index && currentUnread"
                label="Mark all as read"
                icon="hugeicons:check-check"
                variant="link"
                color="neutral"
                size="xs"
                class="-my-1 px-0"
                :ui="{ label: 'block' }"
                @click="markAllCurrentRead"
              />
            </div>

            <UPageCard variant="subtle" :ui="{ container: 'p-1 sm:p-1 divide-y divide-default' }">
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
const router = useRouter()

// The tab (Notifications / Announcements) and the Unread / All filter live in
// the URL (`?tab=announcements&filter=all`) so links and reloads keep them.
// Unread is the default. `?filter=announcements` is the earlier link to the
// Announcements tab.
const tab = computed(() =>
  route.query.tab === 'announcements' ||
  route.query.filter === 'announcements'
    ? 'announcements'
    : 'notifications',
)

const unreadOnly = computed(() => route.query.filter !== 'all')

const tabQuery = (value: string, unread = unreadOnly.value) => ({
  ...(value === 'announcements' ? { tab: value } : {}),
  ...(unread ? {} : { filter: 'all' }),
})

const readFilterItems = [
  { label: 'Unread', value: 'unread' },
  { label: 'All', value: 'all' },
]

const readFilter = computed({
  get: () => (unreadOnly.value ? 'unread' : 'all'),
  set: (value) =>
    router.replace({
      path: '/notifications',
      query: tabQuery(tab.value, value === 'unread'),
    }),
})

// Announcements have their own tab, so personal notifications don't get lost
// among them, and their own unread badge. Reading one (or its CTA) dismisses
// it, so it no longer shows as a toast or banner either.
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
    label: 'Notifications',
    icon: 'hugeicons:notification-01',
    to: { path: '/notifications', query: tabQuery('notifications') },
    active: tab.value === 'notifications',
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
    icon: 'hugeicons:megaphone-01',
    to: { path: '/notifications', query: tabQuery('announcements') },
    active: tab.value === 'announcements',
    badge: unreadAnnouncements.value
      ? {
          label: String(unreadAnnouncements.value),
          color: 'primary' as const,
          variant: 'subtle' as const,
        }
      : undefined,
  },
])

// Unread count and Mark all as read of the open tab; the button sits next to
// the first day group.
const currentUnread = computed(() =>
  tab.value === 'announcements' ? unreadAnnouncements.value : unread.value,
)

const markAllCurrentRead = () =>
  tab.value === 'announcements' ? markAllAnnouncementsRead() : markAllRead()

const showAllActions = computed(() => [
  {
    label: 'Show All',
    color: 'neutral' as const,
    variant: 'subtle' as const,
    to: { path: '/notifications', query: tabQuery(tab.value, false) },
  },
])

const visible = computed(() =>
  unreadOnly.value
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

// Newest first like notifications; priority only orders toasts and banners.
const visibleAnnouncements = computed(() =>
  unreadOnly.value
    ? announcementItems.value.filter(isAnnouncementUnread)
    : announcementItems.value,
)

const announcementGroups = computed(() =>
  groupByDate(
    [...visibleAnnouncements.value].sort((a, b) =>
      b.starts_at.localeCompare(a.starts_at),
    ),
    (item) => item.starts_at,
  ),
)

const toggleRead = (notification: AppNotification) =>
  notification.read_at ? markUnread(notification) : markRead(notification)
</script>
