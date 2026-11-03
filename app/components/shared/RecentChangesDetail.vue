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
        <!-- The entry's changes (one per record), newest first: step through them or pick one.
             The panel can be narrow, so the picker sizes to it, not the window. -->
        <section
          v-if="revisions.length > 1"
          class="flex flex-wrap items-center justify-between gap-2"
        >
          <h3
            class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase"
          >
            <UIcon name="hugeicons:time-quarter-pass" class="size-4 text-primary" />
            Change {{ position + 1 }} of {{ revisions.length }}
          </h3>

          <div class="flex min-w-0 flex-1 basis-64 items-center justify-end gap-1">
            <UTooltip text="Newer Change">
              <UButton
                icon="hugeicons:arrow-left-01"
                variant="ghost"
                aria-label="Newer Change"
                :disabled="position <= 0"
                @click="step(-1)"
              />
            </UTooltip>

            <USelectMenu
              :model-value="revisionId"
              :items="changeItems"
              value-key="value"
              :icon="changeItems[position]?.icon"
              :search-input="{ placeholder: 'Find a change...' }"
              aria-label="Change"
              class="w-full max-w-72 min-w-0"
              :ui="{ content: 'min-w-80' }"
              @update:model-value="(id) => id && emit('select', id)"
            >
              <template #item-trailing="{ index }">
                <UBadge
                  v-if="index === 0"
                  label="Latest"
                  color="warning"
                  variant="subtle"
                  size="sm"
                />
              </template>
            </USelectMenu>

            <UTooltip text="Older Change">
              <UButton
                icon="hugeicons:arrow-right-01"
                variant="ghost"
                aria-label="Older Change"
                :disabled="position >= revisions.length - 1"
                @click="step(1)"
              />
            </UTooltip>
          </div>
        </section>
      </SharedRevisionDetail>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { upperFirst } from 'es-toolkit'
import type { BreadcrumbItem } from '@nuxt/ui'
import type {
  RecentChangesEntry,
  RevisionDetail as RevisionDetailType,
} from '~/utils/revisions'

// The detail side of Recent Changes: a navbar with the page's breadcrumb and
// Open History, then one revision of the selected entry (`revisionId`, from
// `?rev=`) as History shows it (`SharedRevisionDetail`), with the entry's
// other changes in a picker (searchable, any number of them) between Newer
// and Older buttons. An entry is a run of changes to one page, one per
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

// The entry's changes for the picker, by what tells them apart: the record's
// kind and name. Who made them and when is in the heading above (a run of
// changes is usually one sync); the action shows only when the entry mixes
// them, e.g. a kit added and another edited.
const mixedActions = computed(
  () => new Set(revisions.value.map(revisionVerb)).size > 1,
)

const changeItems = computed(() =>
  revisions.value.map((revision) => ({
    value: revision.id,
    label: revisionRecordName(revision),
    description: mixedActions.value
      ? upperFirst(revisionVerb(revision))
      : undefined,
    icon: revisionEntityIcon(revision),
  })),
)

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
