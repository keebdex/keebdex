<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:visible="open"
      v-model:collapsed="collapsed"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header>
        <NuxtLink to="/" class="flex items-center">
          <AppLogo :collapsed="collapsed" />
        </NuxtLink>

        <div v-if="!collapsed" class="flex items-center gap-1.5 ms-auto">
          <UDashboardSidebarCollapse class="text-dimmed" />
        </div>
      </template>

      <template #default>
        <UDashboardSearchButton :collapsed="collapsed" />

        <template v-if="collapsed">
          <UDashboardSidebarCollapse class="text-dimmed" />
        </template>

        <UNavigationMenu
          :key="`routes-${routesMenuKey}`"
          :collapsed="collapsed"
          :items="routes"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer>
        <ProfileMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <KeebSearch :routes="groups" />

    <!-- Panels default to min-h-svh; min-h-0 lets the page shrink under the banner. -->
    <div class="flex flex-col w-full *:min-h-0">
      <UBanner
        v-if="banner"
        :key="banner.key"
        v-bind="bannerProps"
        class="shrink-0"
        @close="announcements.dismiss(banner.key)"
      />

      <slot />
    </div>

    <UModal
      v-model:open="visible.feedback"
      title="Share your thoughts!"
      :ui="{
        body: 'flex flex-col gap-4',
      }"
    >
      <template #body>
        <ModalFeedbackForm @on-success="toggle('feedback')" />
      </template>
    </UModal>

    <UModal v-model:open="visible.donate">
      <template #content>
        <ModalDonate />
      </template>
    </UModal>
  </UDashboardGroup>
</template>

<script setup>
const toast = useToast()
const announcements = useAnnouncements()
const cookieConsent = useCookieConsent()

const open = ref(false)
const collapsed = ref(false)
const routesMenuKey = ref(0)
const { paletteItems } = useThemeMenu()
const { routes, personalLinks } = useSidebarNavigation(collapsed)

const links = computed(() => [
  [
    ...personalLinks.value,
    {
      label: 'Feedback',
      icon: 'hugeicons:message-question',
      class: 'cursor-pointer',
      onSelect() {
        toggle('feedback')
      },
    },
    {
      label: 'Donate',
      icon: 'hugeicons:paypal',
      class: 'cursor-pointer text-donator hover:text-donator',
      ui: {
        linkLeadingIcon: 'text-donator group-hover:text-donator',
      },
      onSelect() {
        toggle('donate')
      },
    },
  ],
])

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: routes.value.flat(),
  },
  {
    id: 'help',
    label: 'Links',
    items: [
      ...links.value.flat(),
      // About and Changelog live in the profile menu, not the sidebar
      { label: 'About', icon: 'hugeicons:badge-info', to: '/about' },
      { label: 'Changelog', icon: 'hugeicons:scroll-text', to: '/changelog' },
    ],
  },
  {
    id: 'palette',
    label: 'Palette',
    items: paletteItems.value,
  },
])

const visible = ref({
  feedback: false,
  donate: false,
})

const toggle = (key) => {
  visible.value[key] = !visible.value[key]
}

watch(collapsed, (isCollapsed, wasCollapsed) => {
  if (wasCollapsed && !isCollapsed) {
    routesMenuKey.value += 1
  }
})
// The banner across the top of every page: one announcement at a time, the
// next one taking its place once it is dismissed (keyed, so it remounts).
const banner = computed(() => announcements.bannerItem.value)
const bannerProps = computed(
  () =>
    banner.value &&
    announcementBanner(banner.value, () =>
      announcements.dismiss(banner.value.key),
    ),
)

// Announcement toasts on every page, once per page load (the layout stays
// mounted across navigation). Everything goes through one toast queue with
// the cookie consent last, so it stays on top and each toast is measured on
// its own (see useCookieConsent).
onMounted(async () => {
  await announcements.load()

  announcements.showToasts(toast)
  cookieConsent.show(toast)
})
</script>
