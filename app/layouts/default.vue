<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      v-model:collapsed="collapsed"
      collapsible
      resizable
      :menu="{ side: 'right' }"
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
          :items="sidebarRoutes"
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
    <!-- flex-1 min-w-0 takes the width left by the sidebar (w-full overflowed by it). -->
    <div class="flex flex-1 flex-col min-w-0 *:min-h-0">
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

// The page you are on shows its icon filled (bold-duotone), the rest outlined
const withActiveIcon = (item) => ({
  ...item,
  icon: item.active && item.activeIcon ? item.activeIcon : item.icon,
  children: item.children?.map(withActiveIcon),
})
const sidebarRoutes = computed(() =>
  routes.value.map((group) => group.map(withActiveIcon)),
)
const { isModerator } = storeToRefs(useUserStore())

const links = computed(() => [
  [
    ...personalLinks.value.map(withActiveIcon),
    // Kept in sight, so reporting a problem never takes a search
    {
      label: 'Feedback',
      icon: 'solar:chat-round-question-mark-line-duotone',
      class: 'cursor-pointer',
      onSelect() {
        toggle('feedback')
      },
    },
    {
      label: 'Support',
      icon: 'solar:hand-heart-bold-duotone',
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
      // The profile menu's staff and About links, which the sidebar leaves out
      ...(isModerator.value ? [RECENT_CHANGES_LINK] : []),
      ...ABOUT_LINKS,
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
  // On phones the sidebar is a slideover mounted after these modals, so a
  // modal opened from it would sit hidden behind it: close it first
  open.value = false
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
