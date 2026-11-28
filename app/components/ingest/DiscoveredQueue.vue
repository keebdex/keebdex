<template>
  <div>
    <UPageCard
      variant="subtle"
      class="space-y-4 min-w-0"
      :ui="{ container: 'min-w-0', wrapper: 'min-w-0' }"
    >
      <template #header>
        Keysets read from geekhack Interest Check and Group Buy threads. Crawled
        data is never exact: check every field against the thread before
        approving it, and dismiss what is not catalog material.
      </template>

      <SharedSubmissionToolbar
        v-model:status="stateFilter"
        :options="CANDIDATE_STATE_OPTIONS"
      >
        <UInput
          v-model="search"
          icon="solar:magnifer-line-duotone"
          placeholder="Search keysets..."
          class="w-full sm:w-64"
        />
      </SharedSubmissionToolbar>

      <UTable
        :get-row-id="(candidate) => String(candidate.id)"
        sticky
        :loading="status === 'pending'"
        :data="rows"
        :columns="columns"
        class="min-w-0 max-w-full"
      >
        <template #img-cell="{ row }">
          <NuxtImg
            v-if="row.original.payload.keyset.img"
            preset="thumb"
            loading="lazy"
            decoding="async"
            :src="row.original.payload.keyset.img"
            :alt="label(row.original)"
            referrerpolicy="no-referrer"
            class="size-12 rounded object-cover"
          />
        </template>

        <template #dimensions-cell="{ row }">
          <SharedImageDimensions :src="row.original.payload.keyset.img" />
        </template>

        <template #keyset-cell="{ row }">
          <div class="min-w-0">
            <p class="font-medium text-highlighted truncate max-w-64">
              {{ label(row.original) }}
            </p>
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
            <p v-if="row.original.thread.changed_at" class="text-xs text-muted">
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
            :reviewing="openingId === row.original.id"
            :dismissing="dismissingId === row.original.id"
            :restoring="restoringId === row.original.id"
            @review="openReview(row.original)"
            @dismiss="(note) => dismiss(row.original, note)"
            @restore="restore(row.original)"
          />
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
      :title="approveTarget?.match_key ? 'Review Update' : 'Review Keyset'"
      :description="approveTarget?.thread.title"
      :ui="{ content: 'sm:max-w-4xl' }"
    >
      <template #body>
        <div
          v-if="approveTarget?.match_key && !approveTarget.current"
          class="space-y-4"
        >
          <UAlert
            color="error"
            variant="subtle"
            icon="solar:danger-triangle-line-duotone"
            title="Keyset Not Loaded"
            :description="`Keebdex's ${approveTarget.match_key} could not be read, so approving could not tell what it would change. Reload the page and try again.`"
          />
          <UButton label="Close" @click="approveOpen = false" />
        </div>

        <IngestApproveWizard
          v-else-if="approveTarget"
          :key="approveTarget.id"
          :candidate="approveTarget"
          :loading="approving"
          @approve="
            (payload, ensureProfile) =>
              approve(approveTarget!, payload, ensureProfile)
          "
          @cancel="approveOpen = false"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// The Discovered tab of the keyset submissions page: keysets the crawler
// read from forum threads, to approve into the catalog or dismiss.
const columns = [
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

const {
  status,
  stateFilter,
  search,
  page,
  size,
  setPage,
  rows,
  paginationMeta,
  label,
  approveTarget,
  approveOpen,
  openingId,
  openReview,
  approving,
  approve,
  dismissingId,
  dismiss,
  restoringId,
  restore,
} = useDiscoveredQueue()
</script>
