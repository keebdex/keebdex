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
      :avatar="{
        src: user.picture,
        alt: user.name,
      }"
      class="cursor-pointer w-full"
    />
    <UButton
      v-else
      label="Sign In"
      icon="hugeicons:login-03"
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
const { authenticated, user } = storeToRefs(userStore)

const client = useSupabaseClient()
const toast = useToast()

const colorMode = useColorMode()

const items = computed(() => {
  const appearance = [
    {
      label: 'Appearance',
      icon: 'hugeicons:paint-board',
      children: [
        {
          label: 'System',
          icon: 'hugeicons:computer',
          active: colorMode.preference === 'system',
          onSelect(e) {
            e.preventDefault()
            colorMode.preference = 'system'
          },
        },
        {
          label: 'Light',
          icon: 'hugeicons:sun-02',
          active: colorMode.preference === 'light',
          onSelect(e) {
            e.preventDefault()
            colorMode.preference = 'light'
          },
        },
        {
          label: 'Dark',
          icon: 'hugeicons:moon-02',
          active: colorMode.preference === 'dark',
          onSelect(e) {
            e.preventDefault()
            colorMode.preference = 'dark'
          },
        },
      ],
    },
  ]

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
        ],
        appearance,
        [
          {
            label: 'Sign Out',
            icon: 'hugeicons:logout-03',
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
            icon: 'hugeicons:login-03',
            onSelect() {
              toggleShowLogin()
            },
          },
        ],
        appearance,
      ]
})

const visible = ref(false)
const toggleShowLogin = () => {
  visible.value = !visible.value
}

const logout = async () => {
  const { error } = await client.auth.signOut()
  if (error) {
    toast.add({
      color: 'error',
      title: 'Oops! Something went wrong',
      description: error.message,
    })
  } else {
    userStore.$reset()
    toast.add({
      color: 'success',
      title: 'You have been logged out successfully.',
    })

    navigateTo('/')
  }
}
</script>
