<template>
  <div
    class="border-t border-default pt-4 mt-auto px-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="text-toned text-sm text-center sm:text-left">
      Showing {{ meta.from }} to {{ meta.to }} of
      <span class="font-semibold text-highlighted">{{ meta.total }}</span>
      <template v-if="nouns">
        {{ nouns[meta.total === 1 ? 0 : 1] }}
      </template>
    </p>

    <UPagination
      v-if="meta.total > size"
      :page="page"
      :items-per-page="size"
      :total="meta.total"
      :ui="{ list: 'flex-wrap justify-center sm:justify-end' }"
      @update:page="emit('update:page', $event)"
    />
  </div>
</template>

<script setup lang="ts">
// Footer of a submission review page: "Showing x to y of n" and pagination.
defineProps<{
  meta: { from: number; to: number; total: number }
  page: number
  size: number
  // Singular and plural row noun, e.g. ['keyset', 'keysets'].
  nouns?: [string, string]
}>()

const emit = defineEmits<{ 'update:page': [page: number] }>()
</script>
