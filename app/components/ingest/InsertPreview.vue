<template>
  <div class="rounded-md border border-default">
    <div
      class="flex items-center gap-3 border-b border-default px-4 py-2.5 bg-elevated/50"
    >
      <NuxtImg
        v-if="section.img"
        preset="thumb"
        loading="lazy"
        decoding="async"
        :src="section.img"
        alt=""
        class="size-10 rounded object-cover"
      />
      <div class="min-w-0">
        <p class="truncate font-medium text-highlighted">{{ section.title }}</p>
        <code class="text-xs text-muted">{{ section.statement }}</code>
      </div>
    </div>

    <dl class="divide-y divide-default text-sm">
      <div
        v-for="row in section.rows"
        :key="row.column"
        class="grid grid-cols-1 gap-1 px-4 py-2 sm:grid-cols-[14rem_1fr] sm:gap-4"
      >
        <dt>
          <span class="font-medium">{{ insertColumnLabel(row.column) }}</span>
          <code class="ms-2 text-xs text-muted">{{ row.column }}</code>
        </dt>

        <dd class="min-w-0">
          <span v-if="row.display">{{ row.display }}</span>
          <code v-else-if="row.value === null" class="text-dimmed">null</code>
          <span v-else-if="typeof row.value === 'boolean'">
            {{ row.value ? 'Yes' : 'No' }}
          </span>
          <IngestFieldValue v-else :field="row.column" :value="row.value" />
        </dd>
      </div>

      <p v-if="!section.rows.length" class="px-4 py-2 text-muted">
        No column changes.
      </p>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { InsertPreviewSection } from '~/composables/useIngestApproveWizard'

// One row approving writes (a keyset, a kit, the candidate): each column with
// its label and database name, so staff check exactly what goes in.
defineProps<{ section: InsertPreviewSection }>()
</script>
