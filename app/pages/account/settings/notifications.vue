<template>
  <div class="space-y-8">
    <UPageHeader
      title="Notifications"
      description="Choose which notifications you receive. Changes apply immediately."
    />

    <section v-for="group in groups" :key="group.id" class="space-y-3">
      <UPageFeature
        :icon="group.icon"
        :title="group.label"
        :description="group.description"
      />

      <UPageCard
        variant="subtle"
        :ui="{ container: 'divide-y divide-default' }"
      >
        <USwitch
          v-for="item in group.items"
          :key="item.key"
          :model-value="preferences?.[item.key] ?? true"
          :label="item.label"
          :description="item.description"
          :disabled="!preferences"
          class="flex-row-reverse justify-between gap-4 py-3 first:pt-0 last:pb-0"
          @update:model-value="(enabled) => save({ [item.key]: !!enabled })"
        />
      </UPageCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  NOTIFICATION_PREFERENCE_GROUPS,
  type NotificationPreferences,
} from '~/utils/notification-preferences'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Notification Settings',
})

const toast = useToast()
const { isModerator } = storeToRefs(useUserStore())

// Staff-only groups (e.g. Moderation) are hidden from everyone else.
const groups = computed(() =>
  NOTIFICATION_PREFERENCE_GROUPS.filter(
    (group) => !group.staffOnly || isModerator.value,
  ),
)

const { data } = useFetch<{ preferences: NotificationPreferences }>(
  '/api/notifications/preferences',
  { key: 'notification-preferences' },
)

const preferences = computed(() => data.value?.preferences)

// Applies the change right away and rolls it back if saving fails.
const save = async (patch: NotificationPreferences) => {
  if (!data.value) return

  const previous = data.value.preferences

  data.value = { preferences: { ...previous, ...patch } }

  try {
    data.value = await $fetch('/api/notifications/preferences', {
      method: 'patch',
      body: patch,
    })
  } catch (error) {
    data.value = { preferences: previous }
    toast.add(errorToast(error))
  }
}
</script>
