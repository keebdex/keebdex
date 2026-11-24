<template>
  <SharedRedirectPage v-if="!isModerator" to="/" />

  <UDashboardPanel v-else id="keyset-forum-review">
    <template #header>
      <UDashboardNavbar title="Forum Review">
        <template #trailing>
          <UBadge
            v-if="waiting"
            :label="String(waiting)"
            variant="subtle"
            color="warning"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageCard
        variant="subtle"
        class="space-y-4 min-w-0"
        :ui="{ container: 'min-w-0', wrapper: 'min-w-0' }"
      >
        <template #header>
          Keysets read from geekhack Interest Check and Group Buy threads.
          Crawled data is never exact: check every field against the thread
          before approving it, and dismiss what is not catalog material.
        </template>

        <SharedSubmissionToolbar
          v-model:status="stateFilter"
          :options="CANDIDATE_STATE_OPTIONS"
          expandable
          :all-expanded="allExpanded"
          :disabled="!rows.length"
          @toggle-all="toggleAll"
        >
          <UInput
            v-model="search"
            icon="solar:magnifer-line-duotone"
            placeholder="Search keysets or threads..."
            class="w-full sm:w-64"
          />
        </SharedSubmissionToolbar>

        <UTable
          v-model:expanded="expanded"
          :get-row-id="(candidate) => String(candidate.id)"
          sticky
          :loading="status === 'pending'"
          :data="rows"
          :columns="columns"
          :ui="{ tr: 'data-[expanded=true]:bg-elevated/50' }"
          class="min-w-0 max-w-full"
        >
          <template #expand-cell="{ row }">
            <UButton
              variant="ghost"
              size="sm"
              :icon="
                row.getIsExpanded()
                  ? 'solar:alt-arrow-down-linear'
                  : 'solar:alt-arrow-right-linear'
              "
              :aria-label="row.getIsExpanded() ? 'Collapse' : 'Expand'"
              @click="row.toggleExpanded()"
            />
          </template>

          <template #img-cell="{ row }">
            <NuxtImg
              v-if="row.original.payload.keyset.img"
              preset="thumb"
              loading="lazy"
              decoding="async"
              :src="row.original.payload.keyset.img"
              :alt="label(row.original)"
              class="size-12 rounded object-cover"
            />
          </template>

          <template #dimensions-cell="{ row }">
            <SharedImageDimensions :src="row.original.payload.keyset.img" />
          </template>

          <template #keyset-cell="{ row }">
            <div class="min-w-0">
              <UButton
                :label="label(row.original)"
                variant="link"
                class="p-0 font-medium text-highlighted"
                :ui="{ label: 'truncate max-w-64' }"
                @click="row.toggleExpanded()"
              />
              <p class="truncate max-w-64 text-xs text-muted">
                {{ row.original.thread.title }}
              </p>
            </div>
          </template>

          <template #match-cell="{ row }">
            <ULink
              v-if="row.original.match_key"
              :to="`/keyset/${row.original.match_key}`"
              class="text-primary"
            >
              {{ row.original.match_key }}
            </ULink>
            <UBadge v-else label="New Keyset" variant="subtle" />
          </template>

          <template #kits-cell="{ row }">
            {{ row.original.payload.kits.length }}
          </template>

          <template #check-cell="{ row }">
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-if="missingCandidateFields(row.original).length"
                :label="`${missingCandidateFields(row.original).length} missing`"
                variant="subtle"
                color="error"
              />
              <UBadge
                v-if="lowConfidenceFields(row.original).length"
                :label="`${lowConfidenceFields(row.original).length} unsure`"
                variant="subtle"
                color="warning"
              />
            </div>
          </template>

          <template #thread-cell="{ row }">
            <div class="text-sm">
              <span class="font-medium">
                {{ THREAD_BOARD_LABELS[row.original.thread.board] || '-' }}
              </span>
              <span class="text-muted">
                · {{ row.original.thread.author || 'Unknown' }}
              </span>
              <p
                v-if="row.original.thread.changed_at"
                class="text-xs text-muted"
              >
                {{ formatTimeAgo(row.original.thread.changed_at) }}
              </p>
            </div>
          </template>

          <template #state-cell="{ row }">
            <UBadge
              :label="CANDIDATE_STATE_LABELS[row.original.state]"
              variant="subtle"
              :color="candidateStateColorMap[row.original.state]"
            />
          </template>

          <template #action-cell="{ row }">
            <IngestCandidateRowActions
              :candidate="row.original"
              @approve="approveTarget = row.original"
              @dismiss="dismiss(row.original)"
              @restore="restore(row.original)"
            />
          </template>

          <template #expanded="{ row }">
            <IngestCandidateDetails :candidate="row.original" />
          </template>

          <template #empty>
            <UEmpty
              icon="solar:inbox-bold-duotone"
              title="Nothing To Review"
              description="No crawled keyset matches these filters."
            />
          </template>
        </UTable>

        <SharedSubmissionPagination
          :meta="paginationMeta"
          :page="page"
          :size="size"
          :nouns="['keyset', 'keysets']"
          @update:page="setPage"
        />
      </UPageCard>

      <UModal
        v-model:open="approveOpen"
        :title="
          approveTarget?.match_key ? 'Fill Missing Fields' : 'Approve Keyset'
        "
        :description="approveTarget?.thread.title"
        :ui="{ content: 'sm:max-w-4xl' }"
      >
        <template #body>
          <IngestApproveWizard
            v-if="approveTarget"
            :key="approveTarget.id"
            :candidate="approveTarget"
            @approve="(payload) => approve(approveTarget!, payload)"
            @cancel="approveOpen = false"
          />
        </template>
      </UModal>

      <SharedNoteModal
        v-model:open="dismissOpen"
        v-model:note="dismissNote"
        title="Dismiss Keyset"
        :description="`Dismiss ${dismissTarget ? label(dismissTarget) : ''}? It comes back only if the thread's first post changes.`"
        confirm-label="Dismiss"
        confirm-color="error"
        label="Reason"
        help="Optional. Staff see it on the dismissed keyset."
        :presets="DISMISS_PRESETS"
        optional
        @confirm="confirmDismiss"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useSeoMeta({ title: 'Forum Review' })

const { isModerator } = storeToRefs(useUserStore())

const columns = [
  { id: 'expand' },
  { id: 'img', header: 'Image' },
  { id: 'dimensions', header: 'Size' },
  { id: 'keyset', header: 'Keyset' },
  { id: 'match', header: 'Keebdex' },
  { id: 'kits', header: 'Kits' },
  { id: 'check', header: 'Check' },
  { id: 'thread', header: 'Thread' },
  { id: 'state', header: 'State' },
  { id: 'action' },
]

const DISMISS_PRESETS = [
  'Not a keyset.',
  'Already on Keebdex under another name.',
  'Not enough information in the thread yet.',
]

const {
  status,
  stateFilter,
  search,
  page,
  size,
  setPage,
  rows,
  paginationMeta,
  waiting,
  label,
  expanded,
  allExpanded,
  toggleAll,
  approveTarget,
  approveOpen,
  approve,
  dismissTarget,
  dismissNote,
  dismissOpen,
  dismiss,
  confirmDismiss,
  restore,
} = useForumReviewQueue()
</script>
