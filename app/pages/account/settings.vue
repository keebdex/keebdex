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
      <div
        class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto"
      >
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const links = [
  {
    label: 'Profile',
    icon: 'hugeicons:user-01',
    to: '/account/settings',
    avatar: {
      src: user.value.picture,
      alt: user.value.name,
    },
    exact: true,
  },
]

useSeoMeta({
  title: 'Account Settings',
})

definePageMeta({
  middleware: 'auth',
})
</script>
