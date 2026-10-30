<template>
  <SharedRevisionTimeline :entries="entries">
    <template #default="{ entry }">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <UBadge
              :label="KEEB_MODULE_LABELS[entry.domain]"
              :icon="KEEB_MODULE_ICONS[entry.domain]"
              variant="outline"
              size="sm"
              class="shrink-0"
            />
            <ULink
              :to="pagePath(entry) || undefined"
              class="truncate font-semibold text-highlighted hover:text-primary hover:underline"
            >
              {{ entry.name }}
            </ULink>
          </div>

          <p class="mt-1 text-xs text-muted">
            <SharedRevisionAuthors :revisions="entry.revisions" />
            made {{ countLabel(entry.revisions.length, 'change') }}
            ·
            <time :datetime="entry.date" :title="formatDate(entry.date)">
              {{ formatTimeAgo(entry.date) }}
            </time>
          </p>
        </div>

        <UTooltip v-if="pagePath(entry)" text="Open History">
          <UButton
            icon="hugeicons:time-quarter-pass"
            size="sm"
            aria-label="Open History"
            class="shrink-0"
            :to="`${pagePath(entry)}?history=1`"
          />
        </UTooltip>
      </div>
    </template>
  </SharedRevisionTimeline>
</template>

<script setup lang="ts">
import type { RecentChangesEntry } from '~/utils/revisions'

// Recent Changes on the commit-style timeline (`SharedRevisionTimeline`): a
// row per run of changes to a page (`groupRecentChanges`), leading with the
// module badge and the page name (linking to it), then who changed it, how
// many changes, and when; the clock button opens the page's History, where
// the changes are listed one by one.
defineProps<{ entries: RecentChangesEntry[] }>()

const pagePath = (entry: RecentChangesEntry) =>
  revisionPagePath({ domain: entry.domain, parent_key: entry.parentKey })
</script>
