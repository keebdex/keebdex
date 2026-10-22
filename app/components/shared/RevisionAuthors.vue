<template>
  <span class="inline">
    <UAvatarGroup size="3xs" :max="3" class="me-1 inline-flex align-middle">
      <UAvatar
        v-for="author in authors"
        :key="author.key"
        v-bind="author.avatar"
      />
    </UAvatarGroup>
    <template v-for="(author, index) in shown" :key="author.key">
      <span class="font-medium text-toned">{{ author.name }}</span>
      <UBadge
        v-if="author.bot"
        label="bot"
        variant="outline"
        size="sm"
        class="ms-1 rounded-full px-1.5 py-0 align-middle text-[10px] leading-4"
      />
      <span class="whitespace-pre">{{ separator(index) }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import type { Revision } from '~/utils/revisions'

// The authors of one revision or a group of them, the way GitHub shows a
// commit's authors: stacked avatars, then the names (`Someone and Bui Anh
// Thang`, `A, B and 2 others`), with a `bot` badge after sync jobs.
const props = defineProps<{ revisions: Revision[] }>()

const authors = computed(() => revisionAuthorList(props.revisions))

// Two names at most; the rest are counted.
const shown = computed(() => authors.value.slice(0, 2))
const others = computed(() => authors.value.length - shown.value.length)

// Text after each shown name, spaces included (`, `, ` and `, ` and 2 others`).
const separator = (index: number) => {
  const last = shown.value.length - 1

  if (others.value) {
    return index < last ? ', ' : ` and ${countLabel(others.value, 'other')}`
  }

  return index < last ? ' and ' : ''
}
</script>
