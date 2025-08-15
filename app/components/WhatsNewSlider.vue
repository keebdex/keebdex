<template>
  <UPageList v-if="makers.length">
    <USeparator
      label="Fresh Artisan Drops"
      :ui="{ label: 'font-bold text-md' }"
    />
    <UPageCard
      v-for="(maker, index) in makers"
      :key="index"
      variant="ghost"
      :to="`/artisan/maker/${maker.id}`"
    >
      <template #body>
        <UUser
          :name="maker.name"
          :description="
            maker.additions === 1
              ? '1 addition'
              : `${maker.additions} additions`
          "
          size="lg"
          :avatar="{
            src: `/logo/${maker.id}.png`,
            alt: maker.name,
            ui: {
              root: 'rounded-none bg-transparent',
              image: $colorMode.value === 'dark' && 'invert',
            },
          }"
        />
      </template>
    </UPageCard>
  </UPageList>

  <UPageList v-if="keycaps.length">
    <USeparator label="Live Keycap Sets" :ui="{ label: 'font-bold text-md' }" />
    <UPageCard
      v-for="(keycap, idx) in keycaps"
      :key="idx"
      variant="ghost"
      :to="`/keycap/${keycap.profile_keycap_id}`"
    >
      <template #body>
        <UUser
          :name="`${keycap.profile.name} ${keycap.name}`"
          :description="formatDateRange(keycap.start_date, keycap.end_date)"
          size="lg"
          :avatar="{
            src: `/logo/${keycap.profile_id}.png`,
            alt: `${keycap.profile.name} ${keycap.name}`,
            ui: {
              root: 'rounded-none bg-transparent',
              image: $colorMode.value === 'dark' && 'invert',
            },
          }"
        />
      </template>
    </UPageCard>
  </UPageList>

  <UPageSection
    v-if="!makers.length && !keycaps.length"
    title="Quiet on the Keycap Front"
    description="No artisan or set updates today. The next wave of caps is just around the corner — stay tuned."
    icon="hugeicons:silence"
  />
</template>

<script setup>
const { makers, keycaps } = defineProps({
  makers: {
    type: Array,
    default: () => [],
  },
  keycaps: {
    type: Array,
    default: () => [],
  },
})
</script>
