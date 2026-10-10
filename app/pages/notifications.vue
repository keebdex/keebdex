<template>
  <UDashboardPanel id="notifications">
    <template #header>
      <UDashboardNavbar title="Notifications" />

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
        </template>

        <template #right>
          <UButton
            label="Mark all as read"
            aria-label="Mark all as read"
            icon="hugeicons:checkmark-circle-02"
            color="neutral"
            variant="ghost"
            :disabled="!unread"
            :ui="{ label: 'hidden sm:inline' }"
            @click="markAllRead"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="mx-auto w-full lg:max-w-3xl space-y-6">
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
              ? 'No Unread Notifications'
              : 'No Notifications Yet'
          "
          :description="
            filter === 'unread'
              ? 'You are all caught up.'
              : 'Your notifications will show up here.'
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

// All / Unread live in the URL (`?filter=unread`) so the menu links work.
const filter = computed(() =>
  route.query.filter === 'unread' ? 'unread' : 'all',
)

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

// Items are newest first, so each date group is a consecutive run.
const groups = computed(() => {
  const now = new Date()
  const result: {
    id: string
    label: NotificationDateGroup
    items: AppNotification[]
  }[] = []

  for (const item of visible.value) {
    const label = notificationDateGroup(item.created_at, now)
    const last = result.at(-1)

    if (last?.label === label) {
      last.items.push(item)
    } else {
      result.push({ id: GROUP_IDS[label], label, items: [item] })
    }
  }

  return result
})

const toggleRead = (notification: AppNotification) =>
  notification.read_at ? markUnread(notification) : markRead(notification)
</script>
