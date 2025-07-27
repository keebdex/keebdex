<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: slim ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      v-bind="{
        ...user,
        avatar: {
          src: user?.picture,
          alt: user?.name,
        },
        label: slim ? undefined : user?.name || 'Sign In',
        icon: authenticated ? undefined : 'hugeicons:login-03',
        trailingIcon: slim ? undefined : 'hugeicons:unfold-more',
      }"
      variant="ghost"
      block
      :square="slim"
      size="xl"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />
  </UDropdownMenu>
</template>

<script setup>
const { slim } = defineProps({
  slim: Boolean,
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
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e) {
            e.preventDefault()

            colorMode.preference = 'light'
          },
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked) {
            if (checked) {
              colorMode.preference = 'dark'
            }
          },
          onSelect(e) {
            e.preventDefault()
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
    toast.add({ severity: 'error', summary: error.message, life: 3000 })
  } else {
    userStore.$reset()
    toast.add({
      severity: 'success',
      summary: 'You have been logged out successfully.',
      life: 3000,
    })

    navigateTo('/')
  }
}
</script>
