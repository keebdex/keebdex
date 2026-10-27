<template>
  <div class="space-y-1">
    <div
      v-for="suggestion in suggestions"
      :key="suggestion.id"
      class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted"
    >
      <UIcon name="hugeicons:user-multiple" class="size-4 shrink-0" />
      <span>Also suggested by</span>
      <UUser
        :name="suggestion.submitter_name || 'Someone'"
        :avatar="
          userAvatar(suggestion.submitter_avatar, suggestion.submitter_name)
        "
        size="3xs"
        :ui="{ name: 'text-xs font-medium text-toned' }"
      />
      <SharedDiffImage
        v-if="image && suggestion.changes[field]"
        :src="String(suggestion.changes[field])"
        :alt="suggestionFieldLabel(field)"
        compact
      />
      <span v-else class="font-medium text-default break-words">
        {{ formatSuggestionValue(field, suggestion.changes[field], values) }}
      </span>
      <span>·</span>
      <time
        :datetime="suggestion.created_at"
        :title="formatDateTime(suggestion.created_at)"
      >
        {{ formatTimeAgo(suggestion.created_at) }}
      </time>
      <UButton
        label="Review"
        size="xs"
        variant="link"
        class="p-0"
        :ui="{ label: 'block' }"
        @click="emit('open', suggestion)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Other Pending suggestions that change the same field of the same record,
// under that field in the review modal, so staff see competing values before
// approving one. Review switches the modal to that suggestion.
const props = defineProps<{
  field: string
  suggestions: Record<string, any>[]
  // Record values around the field, e.g. the currency of a price.
  values?: Record<string, any>
}>()

const emit = defineEmits<{ open: [suggestion: Record<string, any>] }>()

const image = computed(() => isImageSuggestionField(props.field))
</script>
