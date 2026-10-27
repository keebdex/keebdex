<template>
  <!-- Hover on computers; touch screens have no hover, so a tap opens it -->
  <UPopover
    :mode="$device.isMobile ? 'click' : 'hover'"
    :open-delay="100"
    :content="{ align: 'end' }"
  >
    <UButton icon="hugeicons:help-circle" label="How Points Work" />

    <template #content>
      <div class="w-80 max-w-[calc(100vw-2rem)] p-4">
        <p class="font-semibold">How Points Work</p>
        <p class="mt-1 text-sm text-muted">
          Collectors earn points for what they add to Keebdex, once a
          moderator approves it.
        </p>

        <ul class="mt-3 divide-y divide-default">
          <li
            v-for="rule in rules"
            :key="rule.key"
            class="flex items-start gap-3 py-2.5"
          >
            <UIcon :name="rule.icon" class="size-5 shrink-0 text-muted" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">{{ rule.label }}</p>
              <p class="text-xs text-muted">{{ rule.description }}</p>
            </div>
            <UBadge
              :label="`+${LEADERBOARD_POINTS[rule.key]}`"
              color="primary"
              variant="soft"
              class="tabular-nums"
            />
          </li>
        </ul>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const details = {
  pages: {
    label: 'New Page',
    description: 'A maker, sculpt, profile, keyset, brand, or keyboard',
  },
  items: {
    label: 'New Item',
    description: 'A colorway, kit, release, or variant',
  },
  suggestions: {
    label: 'Accepted Edit',
    description: 'A suggested fix or addition to a published page',
  },
}

// Same order and icons as the board's count columns
const rules = LEADERBOARD_COLUMNS.map((column) => ({
  ...column,
  ...details[column.key],
}))
</script>
