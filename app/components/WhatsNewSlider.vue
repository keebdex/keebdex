<template>
  <USlideover
    v-model:open="open"
    title="Latest Additions"
    description="Welcome to today's drop! Dive into the newest keycap sets now live, and snag our latest artisan creations. Check out what's available for preorder and group buy!"
    :ui="{
      header: 'border-none',
      body: '!px-0',
    }"
  >
    <UButton
      :label="collapsed ? undefined : 'Latest Additions'"
      icon="solar:confetti-bold-duotone"
      color="info"
      block
    />

    <template #body="{ close }">
      <UPageList v-if="data.makers.length">
        <USeparator
          label="Fresh Artisan Drops"
          type="dashed"
          :ui="{ label: 'font-bold text-md' }"
        />
        <UPageCard
          v-for="(maker, index) in data.makers"
          :key="index"
          variant="ghost"
          :to="`/artisan/maker/${maker.id}`"
          @click.capture="close"
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
                  image:
                    maker.invertible_logo &&
                    $colorMode.value === 'dark' &&
                    'invert',
                },
              }"
            />
          </template>
        </UPageCard>
      </UPageList>

      <UPageList v-if="data.keycaps.length">
        <USeparator
          label="Live Keycap Sets"
          type="dashed"
          :ui="{ label: 'font-bold text-md' }"
        />
        <UPageCard
          v-for="(keycap, idx) in data.keycaps"
          :key="idx"
          variant="ghost"
          :to="`/keycap/${keycap.profile_keycap_id}`"
          @click.capture="close"
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
        v-if="!total"
        title="Quiet on the Keycap Front"
        description="No artisan or set updates today. The next wave of caps is just around the corner — stay tuned."
        icon="hugeicons:silence"
      />
    </template>
  </USlideover>
</template>

<script setup>
defineProps({
  collapsed: Boolean,
})

const { data, refresh } = await useAsyncData(() => $fetch('/api/statistics'))

const total = computed(
  () => data.value.makers.length + data.value.keycaps.length,
)

const open = ref(false)

watch(open, (val) => {
  if (val) {
    refresh()
  }
})
</script>
