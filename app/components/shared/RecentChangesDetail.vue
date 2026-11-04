<template>
  <UDashboardPanel id="recent-changes-detail">
    <template #header>
      <UDashboardNavbar :toggle="false">
        <template #leading>
          <UButton
            icon="solar:arrow-left-linear"
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
              icon="solar:clock-circle-bold-duotone"
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
        <!-- The entry's changes (one per record), newest first -->
        <div v-if="revisions.length > 1" class="flex items-center gap-3">
          <span class="text-sm font-semibold text-highlighted">
            Change {{ position + 1 }} of {{ revisions.length }}
          </span>

          <UFieldGroup>
            <UTooltip text="Newer Change">
              <UButton
                icon="solar:alt-arrow-left-linear"
                variant="outline"
                aria-label="Newer Change"
                :disabled="position <= 0"
                @click="step(-1)"
              />
            </UTooltip>
            <UTooltip text="Older Change">
              <UButton
                icon="solar:alt-arrow-right-linear"
                variant="outline"
                aria-label="Older Change"
                :disabled="position >= revisions.length - 1"
                @click="step(1)"
              />
            </UTooltip>
          </UFieldGroup>
        </div>
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
// `?rev=`) as History shows it (`SharedRevisionDetail`), with Change N of M
// and Newer / Older buttons leading its diff band to step through the
// entry's other changes. An entry is a run of changes to one page, one per
// record, so they are called changes, not revisions of one record.
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

const position = computed(() =>
  revisions.value.findIndex((revision) => revision.id === props.revisionId),
)

// Newer is -1, older is +1, as the list runs newest first.
const step = (offset: number) => {
  const next = revisions.value[position.value + offset]

  if (next) emit('select', next.id)
}

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
