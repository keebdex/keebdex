<template>
  <UAuthForm
    title="Welcome back"
    icon="hugeicons:user-id-verification"
    :providers="providers"
    :ui="{
      title:
        'text-4xl font-bold bg-gradient-to-r from-red-300 via-pink-400 to-violet-600 dark:from-amber-200 dark:to-teal-400 text-transparent bg-clip-text',
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
    toast.add(handleError(error))
  } else if (user) {
    toast.add(handleNotice('login', user.name))
  }
}

const providers = ref([
  {
    label: 'Continue with Google',
    icon: 'simple-icons:google',
    variant: 'soft',
    class: 'dark:hover:bg-google light:hover:text-google',
    onclick: () => {
      login('google')
    },
    ui: {
      label: 'block',
    },
  },
  {
    label: 'Continue with Discord',
    icon: 'simple-icons:discord',
    variant: 'soft',
    class: 'dark:hover:bg-discord light:hover:text-discord',
    onclick: () => {
      login('discord')
    },
    ui: {
      label: 'block',
    },
  },
])
</script>
