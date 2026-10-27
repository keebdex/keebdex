<template>
  <div class="space-y-8">
    <UPageHeader
      title="Profile"
      description="Manage your profile information"
    />

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

      <UButton block color="primary" type="submit" loading-auto> Save </UButton>
    </UForm>

    <UPageCard
      title="Leaderboard"
      description="Your approved submissions and edits earn points on the public leaderboard."
      variant="subtle"
      orientation="horizontal"
      :ui="{ container: 'lg:items-center' }"
    >
      <USwitch
        :model-value="!leaderboardHidden"
        label="Show me on the leaderboard"
        :loading="savingLeaderboard"
        class="lg:justify-self-end"
        @update:model-value="onLeaderboardChange"
      />
    </UPageCard>
  </div>
</template>

<script setup>
const userStore = useUserStore()
const { user, social, leaderboardHidden } = storeToRefs(userStore)

const toast = useToast()

const onSubmit = async () => {
  await $fetch(`/api/users/${user.value.uid}`, {
    method: 'post',
    body: social.value,
  })
    .then(() => {
      toast.add(successToast('update', { entity: 'Profile' }))
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
}

// Saved as soon as it changes, apart from the profile form
const savingLeaderboard = ref(false)
const onLeaderboardChange = async (show) => {
  savingLeaderboard.value = true
  await $fetch(`/api/users/${user.value.uid}`, {
    method: 'post',
    body: { leaderboard_hidden: !show },
  })
    .then(() => {
      leaderboardHidden.value = !show
      toast.add(successToast('update', { entity: 'Leaderboard visibility' }))
    })
    .catch((error) => {
      toast.add(errorToast(error))
    })
    .finally(() => {
      savingLeaderboard.value = false
    })
}

const discordVerified = computed(() => {
  return user.value && user.value.providers?.includes('discord')
})
</script>
