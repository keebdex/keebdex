<template>
  <div class="space-y-8">
    <UPageHeader
      title="Notifications"
      description="Choose which notifications you receive. Changes apply immediately."
    />

    <section v-for="group in groups" :key="group.id" class="space-y-3">
      <!-- A group with a single preference puts its switch in the header;
           the group title and description serve as its label. The end
           margin matches the card padding so every switch lines up. -->
      <div class="flex items-start justify-between gap-4">
        <UPageFeature
          :icon="group.icon"
          :title="group.label"
          :description="group.description"
        />

        <USwitch
          v-if="group.items.length === 1"
          :model-value="preferences?.[group.items[0]!.key] ?? true"
          :aria-label="`${group.label} ${group.items[0]!.label.toLowerCase()} notifications`"
          :disabled="!preferences"
          class="shrink-0 mt-0.5 me-3 sm:me-4"
          @update:model-value="
            (enabled) => save({ [group.items[0]!.key]: !!enabled })
          "
        />
      </div>

      <UPageCard
        v-if="group.items.length > 1"
        variant="subtle"
        :ui="{ container: 'divide-y divide-default' }"
      >
        <div
          v-for="item in group.items"
          :key="item.key"
          class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
        >
          <UIcon
            v-if="item.icon"
            :name="item.icon"
            class="size-5 shrink-0"
            :class="item.color && ICON_CLASSES[item.color]"
          />

          <USwitch
            :model-value="preferences?.[item.key] ?? true"
            :label="item.label"
            :description="item.description"
            :disabled="!preferences"
            class="flex-1 flex-row-reverse justify-between gap-4"
            @update:model-value="(enabled) => save({ [item.key]: !!enabled })"
          />
        </div>
      </UPageCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  NOTIFICATION_PREFERENCE_GROUPS,
  type NotificationPreferences,
} from '~/utils/notification-preferences'
import type { NotificationColor } from '~/utils/notifications'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Notification Settings',
})

const toast = useToast()

// Tailwind needs the full class names, so they can't be built from the color.
const ICON_CLASSES: Record<NotificationColor, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
}
const { isModerator } = storeToRefs(useUserStore())

// Staff-only items (e.g. Resubmitted) are hidden from everyone else, and so
// is a group left without items.
const groups = computed(() =>
  NOTIFICATION_PREFERENCE_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.staffOnly || isModerator.value),
  })).filter((group) => group.items.length),
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
