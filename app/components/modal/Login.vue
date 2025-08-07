<template>
  <UAuthForm
    title="Welcome back"
    icon="hugeicons:user-id-verification"
    :providers="providers"
    :ui="{
      title:
        'text-4xl font-bold bg-gradient-to-r from-red-300 via-pink-400 to-violet-600 dark:from-amber-200 dark:to-rose-400 text-transparent bg-clip-text',
    }"
  />
</template>

<script setup>
const client = useSupabaseClient()
const toast = useToast()

const login = async (provider) => {
  const { user, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) {
    toast.add({ color: 'error', title: err.message })
  } else if (user) {
    toast.add({
      color: 'success',
      title: `Hello, ${user.name}. You successfully logged into this website.`,
    })

    router.back()
  }
}

const providers = ref([
  {
    label: 'Google',
    icon: 'simple-icons:google',
    color: 'neutral',
    variant: 'subtle',
    onclick: () => {
      login('google')
    },
  },
  {
    label: 'Discord',
    icon: 'simple-icons:discord',
    color: 'neutral',
    variant: 'subtle',
    onclick: () => {
      login('discord')
    },
  },
])
</script>
