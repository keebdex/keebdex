<template>
  <UDashboardPanel id="recent-changes-detail">
    <template #header>
      <UDashboardNavbar :toggle="false">
        <template #leading>
          <UButton
            icon="hugeicons:arrow-left-02"
            variant="ghost"
            aria-label="Back to Recent Changes"
            class="-ms-1.5 lg:hidden"
            @click="emit('close')"
          />
        </template>

        <template #title>
          <UBreadcrumb :items="breadcrumb" class="min-w-0" />
        </template>

        <template #right>
          <UTooltip v-if="page?.path" text="Open History">
            <UButton
              icon="hugeicons:time-quarter-pass"
              aria-label="Open History"
              :to="`${page.path}?history=1&rev=${revisionId}`"
            />
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <SharedRevisionDetail
        :revision-id="revisionId"
        @loaded="detail = $event"
        @reverted="emit('reverted')"
      >
        <!-- Every change in the entry, newest first -->
        <section v-if="revisions.length > 1" class="space-y-2">
          <h3
            class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase"
          >
            <UIcon name="hugeicons:time-quarter-pass" class="size-4 text-primary" />
            Revisions ({{ revisions.length }})
          </h3>

          <div class="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
            <UButton
              v-for="(revision, index) in revisions"
              :key="revision.id"
              :icon="revisionIcon(revision)"
              :label="revisionRecordName(revision)"
              :aria-pressed="revision.id === revisionId"
              :active="revision.id === revisionId"
              variant="outline"
              active-variant="solid"
              size="xs"
              class="max-w-full rounded-full"
              :ui="{ label: 'block truncate' }"
              @click="emit('select', revision.id)"
            >
              <template #trailing>
                <time
                  :datetime="revision.created_at"
                  :title="formatDateTime(revision.created_at)"
                  class="shrink-0 opacity-70"
                >
                  {{ formatTimeAgo(revision.created_at) }}
                </time>
                <UBadge
                  v-if="index === 0"
                  label="Latest"
                  color="warning"
                  variant="solid"
                  size="sm"
                  class="shrink-0 rounded-full px-1.5 py-0 text-[10px] leading-4"
                />
              </template>
            </UButton>
          </div>
        </section>
      </SharedRevisionDetail>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type {
  RecentChangesEntry,
  RevisionDetail as RevisionDetailType,
} from '~/utils/revisions'

// The detail side of Recent Changes: a navbar with the page's breadcrumb and
// Open History, then one revision of the selected entry (`revisionId`, from
// `?rev=`) as History shows it (`SharedRevisionDetail`), with the entry's
// other changes as chips to switch between.
// The entry can be missing for a deep link to a revision not loaded in the
// list; the revision then names its page itself. Emits `reverted` so the
// list reloads, and `close` (the back button on phones).
const props = defineProps<{
  entry: RecentChangesEntry | null
  revisionId: number
}>()

const emit = defineEmits<{
  select: [id: number]
  close: []
  reverted: []
}>()

const detail = ref<RevisionDetailType | null>(null)

const revisions = computed(() => props.entry?.revisions || [])

// The page the revision belongs to, from the entry or the revision itself.
const page = computed(() => {
  const source = props.entry
    ? { domain: props.entry.domain, parent_key: props.entry.parentKey }
    : detail.value

  return source
    ? {
        domain: source.domain,
        name: props.entry?.name || detail.value?.label || source.parent_key,
        path: revisionPagePath(source),
      }
    : null
})

const breadcrumb = computed<BreadcrumbItem[]>(() =>
  page.value
    ? [
        {
          label: `${KEEB_MODULE_LABELS[page.value.domain]}s`,
          icon: KEEB_MODULE_ICONS[page.value.domain],
        },
        { label: page.value.name || 'Page', to: page.value.path || undefined },
      ]
    : [],
)
</script>
