<template>
  <UPageCard variant="subtle">
    <UForm :state="user" class="space-y-4" @submit="onSubmit">
      <UFormField label="Name" name="name">
        <UInput
          v-model="user.name"
          icon="hugeicons:user-circle-02"
          disabled
          class="w-full"
        />
      </UFormField>

      <UFormField label="Email" name="email">
        <UInput
          v-model="user.email"
          icon="hugeicons:mail-01"
          :trailing-icon="user.email_verified && 'hugeicons:id-verified'"
          disabled
          class="w-full"
          :ui="{
            trailingIcon: 'text-primary',
          }"
        />
      </UFormField>

      <UFormField label="Discord" name="discord">
        <UInput
          v-model="social.discord"
          icon="hugeicons:discord"
          :trailing-icon="discordVerified && 'hugeicons:id-verified'"
          class="w-full"
          :ui="{
            trailingIcon: 'text-primary',
          }"
        />
      </UFormField>

      <UFormField label="Reddit" name="reddit">
        <UInput
          v-model="social.reddit"
          icon="hugeicons:reddit"
          class="w-full"
        />
      </UFormField>

      <UFormField label="QQ" name="qq">
        <UInput
          v-model="social.qq"
          icon="hugeicons:bubble-chat"
          class="w-full"
        />
      </UFormField>

      <UButton color="primary" type="submit"> Save </UButton>
    </UForm>
  </UPageCard>
</template>

<script setup>
const userStore = useUserStore()
const { user, social } = storeToRefs(userStore)

const toast = useToast()

const loading = ref(false)
const onSubmit = () => {
  loading.value = true
  $fetch(`/api/users/${user.value.uid}`, {
    method: 'post',
    body: social.value,
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Your profile has been updated.',
      })
      loading.value = false
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
      loading.value = false
    })
}

const discordVerified = computed(() => {
  return user.value && user.value.providers?.includes('discord')
})
</script>
