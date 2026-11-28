<template>
  <span v-if="isBlank(value)" class="text-dimmed">-</span>

  <ULink
    v-else-if="field === 'img'"
    :to="value"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-block"
  >
    <NuxtImg
      preset="thumb"
      loading="lazy"
      decoding="async"
      :src="value"
      alt=""
      referrerpolicy="no-referrer"
      class="size-12 rounded object-cover"
    />
  </ULink>

  <ULink
    v-else-if="field === 'url'"
    :to="value"
    target="_blank"
    rel="noopener noreferrer"
    class="block truncate max-w-64 text-primary"
  >
    {{ value }}
  </ULink>

  <span v-else-if="typeof value === 'boolean'">{{ value ? 'Yes' : 'No' }}</span>

  <span v-else-if="DATE_FIELDS.includes(field)">{{ formatDate(value) }}</span>

  <span v-else-if="field === 'profile_id'">
    {{ manufacturers[value] || value }}
  </span>

  <span v-else class="block truncate max-w-64">{{ value }}</span>
</template>

<script setup lang="ts">
// One keyset field of a discovered keyset, as the review tables show it.
defineProps<{ field: string; value: any }>()

const DATE_FIELDS = ['ic_date', 'start_date', 'end_date']

const { manufacturers } = useKeysetProfiles()
</script>
