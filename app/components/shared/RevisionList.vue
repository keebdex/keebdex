<template>
  <div class="space-y-1">
    <template v-for="entry in entries" :key="entry.key">
      <SharedRevisionListItem
        v-if="entry.type === 'revision'"
        :revision="entry.revision"
        @select="emit('select', entry.revision)"
      />

      <!-- One sync run: a summary row that opens to its changes -->
      <UCollapsible v-else :unmount-on-hide="false">
        <button
          type="button"
          class="group w-full text-start flex gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-elevated/50 focus-visible:bg-elevated/50 focus-visible:outline-none"
        >
          <UIcon
            :name="revisionIcon(entry.revisions[0]!)"
            class="size-5 shrink-0 mt-0.5 text-info"
          />

          <div class="min-w-0 flex-1 space-y-1">
            <p class="flex items-center gap-2 text-sm">
              <span class="truncate font-medium text-highlighted">
                {{ revisionAuthor(entry.revisions[0]!) }}
              </span>
              <time
                :datetime="entry.revisions[0]!.created_at"
                :title="formatDate(entry.revisions[0]!.created_at)"
                class="ms-auto shrink-0 text-xs text-dimmed"
              >
                {{ formatTimeAgo(new Date(entry.revisions[0]!.created_at)) }}
              </time>
            </p>
            <p class="flex items-center gap-1 text-sm text-muted">
              {{ countLabel(entry.revisions.length, 'change') }} in one run
              <UIcon
                name="hugeicons:arrow-down-01"
                class="size-4 transition-transform group-data-[state=open]:rotate-180"
              />
            </p>
          </div>
        </button>

        <template #content>
          <div class="ms-5 border-s border-default ps-2 space-y-1">
            <SharedRevisionListItem
              v-for="revision in entry.revisions"
              :key="revision.id"
              :revision="revision"
              compact
              @select="emit('select', revision)"
            />
          </div>
        </template>
      </UCollapsible>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Revision, RevisionEntry } from '~/utils/revisions'

// Revisions of a page, newest first, with the changes of one sync run
// grouped under a summary row (`groupRevisions`).
defineProps<{ entries: RevisionEntry[] }>()

const emit = defineEmits<{ select: [revision: Revision] }>()
</script>
