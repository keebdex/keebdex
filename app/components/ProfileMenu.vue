<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UUser
      v-if="authenticated"
      :name="collapsed ? undefined : user.name"
      :description="collapsed ? undefined : roleMap[role]?.label"
      :avatar="userAvatar(user.picture, user.name)"
      class="cursor-pointer w-full"
    />
    <UButton
      v-else
      :label="collapsed ? undefined : 'Sign In'"
      icon="hugeicons:login-01"
      :trailing-icon="collapsed ? undefined : 'hugeicons:unfold-more'"
      variant="ghost"
      block
      :ui="{ label: 'block' }"
    />

    <UModal v-model:open="visible">
      <template #content>
        <UPageCard>
          <ModalLogin />
        </UPageCard>
      </template>
    </UModal>
  </UDropdownMenu>
</template>

<script setup>
const { collapsed } = defineProps({
  collapsed: Boolean,
})

const userStore = useUserStore()
const { authenticated, user, role, isAdmin, isModerator } = storeToRefs(userStore)

const client = useSupabaseClient()
const toast = useToast()

const { colorModeItems, paletteItems } = useThemeMenu()

// Keep the dropdown open so users can compare several options in a row.
const keepOpen = (items) =>
  items.map((item) => ({
    ...item,
    onSelect(e) {
      e.preventDefault()
      item.onSelect()
    },
  }))

const items = computed(() => {
  // Admin pages share one submenu so they don't lengthen the profile menu.
  const management = isAdmin.value
    ? {
        label: 'Management',
        icon: 'hugeicons:dashboard-square-setting',
        children: [
          {
            label: 'Users',
            icon: 'hugeicons:user-group',
            to: '/admin/users',
          },
          {
            label: 'Announcements',
            icon: 'hugeicons:megaphone-01',
            to: '/admin/announcements',
          },
          {
            label: 'Feedback',
            icon: 'hugeicons:message-question',
            to: '/admin/feedbacks',
          },
          {
            label: 'Shoutouts',
            icon: 'hugeicons:quote-up',
            to: '/admin/shoutouts',
          },
        ],
      }
    : null

  // Light/dark mode and the palette in one submenu, a group each
  const appearance = {
    label: 'Appearance',
    icon: 'hugeicons:paint-board',
    children: [
      keepOpen(colorModeItems.value),
      keepOpen(paletteItems.value),
    ],
  }

  // Staff tools: the revisions of the pages they manage, and for admins the
  // management pages
  const staff = [isModerator.value && RECENT_CHANGES_LINK, management].filter(
    Boolean,
  )

  // Rarely needed, so folded into one submenu (Feedback sits in the sidebar)
  const about = {
    label: 'About',
    icon: 'hugeicons:badge-info',
    children: ABOUT_LINKS,
  }

  return authenticated.value
    ? [
        [
          {
            type: 'label',
            label: user.value.name,
            // The role, when the trigger shows only the avatar (phones and the
            // collapsed sidebar); otherwise the trigger already shows it
            description: collapsed ? roleMap[role.value]?.label : undefined,
          },
        ],
        [
          {
            label: 'Settings',
            icon: 'hugeicons:settings-02',
            to: '/account/settings',
          },
          appearance,
          about,
        ],
        ...(staff.length ? [staff] : []),
        [
          {
            label: 'Sign Out',
            icon: 'hugeicons:logout-01',
            onSelect() {
              logout()
            },
          },
        ],
      ]
    : [
        [
          {
            label: 'Sign In',
            icon: 'hugeicons:login-01',
            onSelect() {
              toggleShowLogin()
            },
          },
        ],
        [appearance, about],
      ]
})

const visible = ref(false)
const toggleShowLogin = () => {
  visible.value = !visible.value
}

const logout = async () => {
  const { error } = await client.auth.signOut()
  if (error) {
    toast.add(errorToast(error))
  } else {
    userStore.$reset()
    toast.add(noticeToast('signed_out'))

    navigateTo('/')
  }
}
</script>
