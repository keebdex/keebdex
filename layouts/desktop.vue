<template>
  <!-- <div
    class="bg-zinc-50 dark:bg-zinc-950 w-full h-screen p-6 flex items-start gap-6 overflow-hidden"
  >
    <LayoutSider />
    <div
      class="flex flex-col justify-between flex-1 h-full overflow-y-auto pb-0.5"
    >
      <NuxtPage class="mx-auto max-w-screen-2xl w-full" />

      <LayoutFooter />
    </div>
  </div> -->

  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <!-- <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template> -->

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
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

      <template #footer="{ collapsed }">
        <ProfileMenu :slim="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <!-- <NotificationsSlideover /> -->
  </UDashboardGroup>
</template>

<script setup>
const config = useRuntimeConfig()

const open = ref(false)

const routes = [
  [
    {
      label: 'Home',
      icon: 'hugeicons:home-01',
      to: '/',
    },
    {
      label: 'My Collection',
      icon: 'hugeicons:collections-bookmark',
      to: '/collection',
    },
  ],
  [
    {
      label: 'Makers',
      icon: 'hugeicons:user-group-03',
      to: '/artisan/maker',
    },
    {
      label: 'Marketplace',
      icon: 'hugeicons:store-01',
      defaultOpen: true,
      type: 'trigger',
      children: [
        {
          label: 'Trading Hub',
          to: '/artisan/marketplace',
          exact: true,
        },
        {
          label: 'Wishlist Image',
          to: '/artisan/wishlist',
          exact: true,
        },
      ],
    },
  ],
  [
    {
      label: 'Keycap Tracker',
      icon: 'hugeicons:calendar-03',
      to: '/keycap/tracker',
    },
    {
      label: 'Keycap Profile',
      icon: 'hugeicons:grid-view',
      defaultOpen: true,
      children: Object.entries(keycapProfiles)
        .map(([profile, manufacturers]) => {
          return [
            {
              label: profile,
              defaultOpen: false,
              type: 'trigger',
              children: Object.entries(manufacturers).map(([id, name]) => {
                return {
                  label: name,
                  to: `/keycap/${id}`,
                  exact: true,
                }
              }),
            },
          ]
        })
        .flat(),
    },
  ],
]

const links = [
  [
    {
      label: 'Feedback',
      icon: 'hugeicons:comment-01',
    },
    {
      label: 'About',
      icon: 'hugeicons:information-diamond',
      to: '/about',
    },
    {
      label: 'Donate',
      icon: 'hugeicons:paypal',
      to: config.public.donate,
      target: '_blank',
    },
  ],
]

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: routes.flat(),
  },
  {
    id: 'help',
    label: 'Links',
    items: links.flat(),
  },
])

// onMounted(async () => {
//   const cookie = useCookie('cookie-consent')
//   if (cookie.value === 'accepted') {
//     return
//   }

//   toast.add({
//     title:
//       'We use first-party cookies to enhance your experience on our website.',
//     duration: 0,
//     close: false,
//     actions: [
//       {
//         label: 'Accept',
//         color: 'neutral',
//         variant: 'outline',
//         onClick: () => {
//           cookie.value = 'accepted'
//         },
//       },
//       {
//         label: 'Opt out',
//         color: 'neutral',
//         variant: 'ghost',
//       },
//     ],
//   })
// })
</script>
