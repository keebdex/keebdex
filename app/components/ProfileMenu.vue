<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <div
      v-if="authenticated"
      class="cursor-pointer w-full flex flex-row items-center justify-between"
    >
      <UUser
        :name="collapsed ? undefined : user.name"
        :description="collapsed ? undefined : roleMap[role]?.label"
        :avatar="{
          src: user.picture,
          alt: user.name,
        }"
      />

      <UIcon
        v-if="role"
        :name="roleMap[role].icon"
        class="text-xl"
        :class="roleMap[role]?.class"
      />
    </div>
    <UButton
      v-else
      :label="collapsed ? undefined : 'Sign In'"
      icon="hugeicons:login-01"
      :trailing-icon="collapsed ? undefined : 'hugeicons:unfold-more'"
      variant="ghost"
      block
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
const { authenticated, user, role, isAdmin } = storeToRefs(userStore)

const client = useSupabaseClient()
const toast = useToast()

const appConfig = useAppConfig()
const colorMode = useColorMode()

const items = computed(() => {
  const adminActions = isAdmin.value
    ? [
        [
          {
            type: 'label',
            label: 'Management',
          },
          {
            label: 'Users',
            icon: 'hugeicons:user-group',
            to: '/admin/users',
          },
          {
            label: 'Feedback',
            icon: 'hugeicons:message-question',
            to: '/admin/feedbacks',
          },
          {
            label: 'Shoutouts',
            icon: 'hugeicons:quote-up-circle',
            to: '/admin/shoutouts',
          },
        ],
      ]
    : []

  const appearance = {
    label: 'Appearance',
    icon: 'hugeicons:paint-board',
    children: [
      {
        label: 'System',
        icon: appConfig.ui.icons.system,
        active: colorMode.preference === 'system',
        onSelect(e) {
          e.preventDefault()
          colorMode.preference = 'system'
        },
      },
      {
        label: 'Light',
        icon: appConfig.ui.icons.light,
        active: colorMode.preference === 'light',
        onSelect(e) {
          e.preventDefault()
          colorMode.preference = 'light'
        },
      },
      {
        label: 'Dark',
        icon: appConfig.ui.icons.dark,
        active: colorMode.preference === 'dark',
        onSelect(e) {
          e.preventDefault()
          colorMode.preference = 'dark'
        },
      },
    ],
  }

  return authenticated.value
    ? [
        [
          {
            type: 'label',
            label: user.value.name,
            avatar: {
              src: user.value.picture,
              alt: user.value.name,
            },
          },
        ],
        [
          {
            label: 'Settings',
            icon: 'hugeicons:settings-02',
            to: '/account/settings',
          },
          appearance,
        ],
        ...adminActions,
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
        [appearance],
      ]
})

const visible = ref(false)
const toggleShowLogin = () => {
  visible.value = !visible.value
}

const logout = async () => {
  const { error } = await client.auth.signOut()
  if (error) {
    toast.add(handleError(error))
  } else {
    userStore.$reset()
    toast.add(handleNotice('logout'))

    navigateTo('/')
  }
}
</script>
