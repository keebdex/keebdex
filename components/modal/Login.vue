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
    toast.add({ severity: 'error', summary: err.message, life: 3000 })
  } else if (user) {
    toast.add({
      severity: 'success',
      summary: `Hello, ${user.name}. You successfully logged into this website.`,
      life: 3000,
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
