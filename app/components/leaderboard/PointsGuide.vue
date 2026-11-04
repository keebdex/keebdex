<template>
  <!-- Hover on computers; touch screens have no hover, so a tap opens it -->
  <UPopover
    :mode="$device.isMobile ? 'click' : 'hover'"
    :open-delay="100"
    :content="{ align: 'end' }"
  >
    <UButton
      icon="solar:question-circle-line-duotone"
      label="How Points Work"
    />

    <template #content>
      <div class="w-80 max-w-[calc(100vw-2rem)] p-4">
        <p class="font-semibold">How Points Work</p>
        <p class="mt-1 text-sm text-muted">
          Collectors earn points for what they add to Keebdex, once a moderator
          approves it.
        </p>

        <UPageList as="ul" divide class="mt-2">
          <UPageFeature
            v-for="rule in rules"
            :key="rule.key"
            as="li"
            :icon="rule.icon"
            :description="rule.description"
            :ui="{
              root: 'py-2.5',
              wrapper: 'flex-1 min-w-0',
              title: 'text-sm',
              description: 'text-sm',
            }"
          >
            <template #title>
              <span class="flex items-start justify-between gap-3">
                {{ rule.label }}
                <UBadge
                  :label="`+${LEADERBOARD_POINTS[rule.key]}`"
                  color="primary"
                  variant="soft"
                  class="tabular-nums"
                />
              </span>
            </template>
          </UPageFeature>
        </UPageList>
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
