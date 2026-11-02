<template>
  <section class="flex flex-col gap-8">
    <HomeSectionHeader
      headline="Browse the dex"
      title="Three catalogs, one place"
      description="Pick up where your collection lives, or wander somewhere new."
    />

    <div class="grid gap-6 md:grid-cols-3">
      <UPageCard
        v-for="module in modules"
        :key="module.key"
        :title="module.label"
        :description="module.description"
        :icon="KEEB_MODULE_ICONS[module.key]"
        variant="subtle"
        spotlight
        :ui="{
          leadingIcon: 'size-8 text-primary',
          title: 'text-lg',
          wrapper: 'flex-none',
          container: 'gap-y-4 sm:gap-y-5 h-full',
        }"
      >
        <p
          v-if="module.count"
          class="font-mono text-sm tabular-nums text-toned"
        >
          {{ module.count }}
        </p>

        <div class="-mx-2.5 -mb-1.5 mt-auto flex flex-wrap gap-1">
          <UButton
            v-for="link in module.links"
            :key="link.to"
            v-bind="link"
            variant="ghost"
            size="sm"
            :ui="{ label: 'block' }"
          />
        </div>
      </UPageCard>
    </div>
  </section>
</template>

<script setup>
const { catalogCount } = await useHomeStatistics()

// "194 makers · 68,000+ colorways", leaving out counts that failed
const counted = (...keys) =>
  keys
    .filter((key) => catalogCount(key))
    .map((key) => `${catalogCount(key)} ${key}`)
    .join(' · ')

const modules = computed(() => [
    {
      key: 'artisan',
      label: 'Artisans',
      description:
        'Sculpts and colorways from makers around the world, with sale details, stems, and photos.',
      count: counted('makers', 'colorways'),
      links: [
        { label: 'Makers', to: '/artisan/maker', icon: 'hugeicons:user-multiple' },
        { label: 'Search', to: '/artisan/search', icon: 'hugeicons:search-01' },
        { label: 'Trading Hub', to: '/artisan/marketplace', icon: 'hugeicons:store-01' },
      ],
    },
    {
      key: 'keyboard',
      label: 'Keyboards',
      description:
        'Brands, releases, and variants, with the specs and layouts each one shipped with.',
      count: counted('keyboards'),
      links: [
        { label: 'Brands', to: '/keyboard/brand', icon: 'hugeicons:user-multiple' },
        { label: 'Submit One', to: '/keyboard/submissions/submit', icon: 'hugeicons:add-circle' },
      ],
    },
    {
      key: 'keyset',
      label: 'Keysets',
      description:
        'Profiles, group buys, kits, and colors, followed from interest check to delivery.',
      count: counted('keysets'),
      links: [
        { label: 'Profiles', to: '/keyset', icon: 'hugeicons:cross' },
        { label: 'Group Buys', to: '/keyset/group-buy?status=live', icon: 'hugeicons:live-streaming-02' },
        { label: 'Colors', to: '/keyset/color', icon: 'hugeicons:colors' },
      ],
    },
])
</script>
