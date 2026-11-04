<template>
  <USlideover
    v-model:open="open"
    :description="selectedId ? undefined : listDescription"
    :ui="{
      content: 'sm:max-w-2xl',
      wrapper: 'min-w-0 flex-1',
      body: 'flex flex-col gap-4 sm:gap-6',
      close: 'static',
    }"
  >
    <!-- A revision goes back to the list from the title, like a page -->
    <template #title>
      <span class="flex items-center gap-1">
        <UTooltip v-if="selectedId" text="All Changes">
          <UButton
            icon="solar:arrow-left-linear"
            variant="ghost"
            size="sm"
            aria-label="All Changes"
            class="-ms-1.5"
            @click="selectedId = null"
          />
        </UTooltip>
        History
      </span>
    </template>

    <!-- Every page's changes, beside the close button (kept in the row) -->
    <template #actions>
      <UTooltip text="Recent Changes">
        <UButton
          icon="solar:clock-circle-line-duotone"
          variant="ghost"
          aria-label="Recent Changes"
          to="/recent-changes"
        />
      </UTooltip>
    </template>

    <template #body>
      <!-- One revision, as Recent Changes shows it -->
      <SharedRevisionDetail
        v-if="selectedId"
        :revision-id="selectedId"
        @reverted="onReverted"
      />

      <!-- All revisions of the page, or of one of its records -->
      <div v-else class="space-y-4">
        <div
          v-if="record"
          class="flex flex-wrap items-center justify-between gap-2"
        >
          <UBadge
            :label="record.label"
            icon="solar:filter-line-duotone"
            variant="subtle"
            class="max-w-full"
            :ui="{ label: 'truncate' }"
          />
          <UButton
            label="Show All Changes"
            variant="link"
            size="sm"
            class="px-0"
            :ui="{ label: 'block' }"
            @click="show()"
          />
        </div>

        <div v-if="loading && !revisions.length" class="space-y-3">
          <USkeleton v-for="i in 5" :key="i" class="h-16 w-full" />
        </div>

        <UEmpty
          v-else-if="!revisions.length"
          icon="solar:clock-circle-bold-duotone"
          title="No Changes Yet"
          :description="
            record
              ? 'Changes to this record will be listed here as they happen.'
              : 'Changes to this page and its records will be listed here as they happen.'
          "
        />

        <template v-else>
          <SharedRevisionList
            :revisions="revisions"
            @select="selectedId = $event.id"
          />

          <div v-if="hasMore" class="flex justify-center">
            <UButton
              label="Load Older"
              variant="soft"
              :loading="loading"
              :ui="{ label: 'block' }"
              @click="load(true)"
            />
          </div>
        </template>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Revision, RevisionRevert } from '~/utils/revisions'

import type { SuggestionEntityType } from '~/utils/suggestions'

interface RevisionRecord {
  entityType: SuggestionEntityType
  entityId: number
  label: string
}

// History slideover of a page (staff only), opened through `show()` (from
// `SharedRecordActions`' History button): the revisions of the record and
// its children, loaded when opened, in the cards Recent Changes uses
// (`SharedRevisionList`), and a revision as Recent Changes shows it
// (`SharedRevisionDetail`, diff and Undo / Restore). `show({ record })` (exposed)
// narrows it to one child record, e.g. from a colorway card. `?history=1`
// opens it on load and `&rev=<id>` opens that revision (links from Recent
// Changes). Emits `reverted` with the fields the revert wrote, so the page
// reloads its data (or follows a sculpt's changed slug).
const props = withDefaults(
  defineProps<{
    domain: KeebModule
    parentKey: string
    description?: string
  }>(),
  {
    description: 'Every change to this page and its records, newest first.',
  },
)

const emit = defineEmits<{ reverted: [revert: RevisionRevert] }>()

const toast = useToast()
const route = useRoute()
const router = useRouter()

const open = ref(false)
const record = ref<RevisionRecord | null>(null)
const listDescription = computed(() => {
  if (record.value) {
    return `Every change to this ${SUGGESTION_ENTITIES[record.value.entityType].label.toLowerCase()}, newest first.`
  }

  return props.description
})
const revisions = ref<Revision[]>([])
const hasMore = ref(false)
const loading = ref(false)

const load = async (older = false) => {
  loading.value = true

  try {
    const result = await $fetch<{ data: Revision[]; hasMore: boolean }>(
      '/api/revisions',
      {
        query: {
          domain: props.domain,
          parent_key: props.parentKey,
          entity_type: record.value?.entityType,
          entity_id: record.value?.entityId,
          groups: 20,
          before: older ? revisions.value.at(-1)?.id : undefined,
        },
      },
    )

    revisions.value = older ? [...revisions.value, ...result.data] : result.data
    hasMore.value = result.hasMore
  } catch (error) {
    toast.add(errorToast(error))
  } finally {
    loading.value = false
  }
}

// The open revision, if any (deep link or show()).
const selectedId = ref<number | null>(null)

const start = () => {
  revisions.value = []
  hasMore.value = false
  load()
}

/** Opens the history, of the whole page or one record. */
const show = (
  options: { record?: RevisionRecord | null; revisionId?: number } = {},
) => {
  record.value = options.record ?? null
  selectedId.value = options.revisionId ?? null

  if (open.value) start()
  else open.value = true
}

watch(open, (value) => {
  if (value) {
    start()
  } else if (route.query.history) {
    // Closing drops the deep link, so a reload doesn't reopen it.
    const { history: _history, rev: _rev, ...query } = route.query
    router.replace({ query })
  }
})

onMounted(() => {
  if (!route.query.history) return

  const revisionId = Number(route.query.rev)

  show({
    revisionId:
      Number.isInteger(revisionId) && revisionId > 0 ? revisionId : undefined,
  })
})

defineExpose({ show })

const onReverted = (revert: RevisionRevert) => {
  emit('reverted', revert)
  load()
}
</script>
