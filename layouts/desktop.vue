<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-end gap-2">
          <NuxtImg
            :alt="$config.app.name"
            :src="
              $colorMode.value === 'dark'
                ? '/logo-outlined.png'
                : '/logo-filled.png'
            "
            class="h-8 w-auto shrink-0"
          />

          <span
            v-if="!collapsed"
            class="text-xl font-bold bg-gradient-to-r from-blue-400 via-red-500 to-amber-400 dark:via-red-400 dark:to-amber-200 text-transparent bg-clip-text"
          >
            {{ $config.app.name }}
          </span>
        </NuxtLink>
      </template>

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
