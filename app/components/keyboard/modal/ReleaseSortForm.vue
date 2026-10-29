<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      Drag releases to set the order they appear in, newest at the top.
    </p>

    <draggable
      :list="releases"
      item-key="id"
      handle=".release-sort-handle"
      ghost-class="opacity-40"
      :animation="150"
      tag="ul"
      class="divide-y divide-default rounded-lg border border-default"
    >
      <template #item="{ element: release, index }">
        <li class="flex items-center gap-3 px-3 py-2 bg-default">
          <UIcon
            name="hugeicons:drag-drop-vertical"
            class="release-sort-handle size-5 shrink-0 cursor-grab text-muted active:cursor-grabbing"
          />
          <span class="w-5 shrink-0 text-xs tabular-nums text-muted">
            {{ index + 1 }}
          </span>
          <span class="min-w-0 flex-1 truncate text-sm font-medium">
            {{ release.name }}
          </span>
          <UBadge
            v-if="!isApproved(release)"
            label="In Review"
            color="warning"
          />
          <UBadge
            v-if="release.release_year"
            :label="String(release.release_year)"
            icon="hugeicons:calendar-03"
            class="tabular-nums"
          />
          <span class="w-20 shrink-0 text-right text-xs text-muted">
            {{ countLabel(release.variants?.length || 0, 'variant') }}
          </span>
        </li>
      </template>
    </draggable>

    <UButton
      block
      color="primary"
      label="Save Order"
      :disabled="!changed"
      :loading="saving"
      @click="save"
    />
  </div>
</template>

<script setup>
import { sortBy } from 'es-toolkit/compat'

import draggable from 'vuedraggable'

const emit = defineEmits(['onSuccess'])

const { keyboard } = defineProps({
  // The keyboard with its releases, as GET /api/keyboards/[brand]/[keyboard]
  // returns it.
  keyboard: {
    type: Object,
    required: true,
  },
})

const toast = useToast()

// Every release, including those still in review, so their orders stay
// distinct; newest (highest order) first, as the page shows them.
const releases = ref(sortBy(keyboard.releases || [], 'order').reverse())
const initialIds = releases.value.map(({ id }) => id).join()
const changed = computed(
  () => releases.value.map(({ id }) => id).join() !== initialIds,
)

const saving = ref(false)

const save = async () => {
  const total = releases.value.length
  saving.value = true

  try {
    await $fetch(
      `/api/keyboards/${keyboard.brand_keyboard_slug}/releases/sort`,
      {
        method: 'post',
        body: releases.value.map(({ id }, idx) => ({
          id,
          order: total - idx,
        })),
      },
    )

    toast.add(noticeToast('order_saved'))
    emit('onSuccess')
  } catch (error) {
    toast.add(errorToast(error))
  } finally {
    saving.value = false
  }
}
</script>
