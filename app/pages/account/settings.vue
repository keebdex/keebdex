<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings" />

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageCard variant="subtle" class="space-y-4 min-w-0">
        <NuxtPage />
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const links = [
  {
    label: 'Profile',
    icon: 'solar:user-line-duotone',
    to: '/account/settings',
    avatar: userAvatar(user.value.picture, user.value.name),
    exact: true,
  },
  {
    label: 'Appearance',
    icon: 'solar:palette-line-duotone',
    to: '/account/settings/appearance',
  },
  {
    label: 'Notifications',
    icon: 'solar:notification-unread-lines-line-duotone',
    to: '/account/settings/notifications',
  },
]

useSeoMeta({
  title: 'Account Settings',
})

definePageMeta({
  middleware: 'auth',
})
</script>
