<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

import { downloadScreenshot } from '~/utils/screenshot'

type AssetKey =
  | 'wordmark-light'
  | 'wordmark-dark'
  | 'favicon-light'
  | 'favicon-dark'

const assetRefs = ref<Partial<Record<AssetKey, HTMLElement | null>>>({})

const assetCards = [
  {
    key: 'wordmark-light' as const,
    title: 'Wordmark Light',
    description: 'Full keebdex wordmark for light surfaces.',
    filename: 'keebdex-wordmark-light',
    background: 'bg-white',
    render: { type: 'wordmark' as const, variant: 'light' as const },
  },
  {
    key: 'wordmark-dark' as const,
    title: 'Wordmark Dark',
    description: 'Full keebdex wordmark for dark surfaces.',
    filename: 'keebdex-wordmark-dark',
    background: 'bg-slate-950',
    render: { type: 'wordmark' as const, variant: 'dark' as const },
  },
  {
    key: 'favicon-light' as const,
    title: 'Favicon Light',
    description: 'Compact kd mark with underline for light surfaces.',
    filename: 'keebdex-favicon-light',
    background: 'bg-white',
    render: { type: 'favicon' as const, variant: 'light' as const },
  },
  {
    key: 'favicon-dark' as const,
    title: 'Favicon Dark',
    description: 'Compact kd mark with underline for dark surfaces.',
    filename: 'keebdex-favicon-dark',
    background: 'bg-slate-950',
    render: { type: 'favicon' as const, variant: 'dark' as const },
  },
]

function setAssetRef(
  key: AssetKey,
  element: Element | ComponentPublicInstance | null,
) {
  assetRefs.value[key] = element instanceof HTMLElement ? element : null
}

async function downloadAsset(key: AssetKey, filename: string) {
  const element = assetRefs.value[key]

  if (!element) {
    return
  }

  await downloadScreenshot(element, filename)
}

useSeoMeta({
  title: 'Logo Assets',
  description:
    'Download Keebdex wordmark and favicon logo assets in light and dark variants.',
})
</script>

<template>
  <UDashboardPanel id="logo-assets">
    <template v-if="$device.isMobileOrTablet" #header>
      <UDashboardNavbar title="Logo Assets" />
    </template>

    <template #body>
      <div
        class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8"
      >
        <UPageHero
          title="Keebdex logo assets"
          description="Preview and download the wordmark and favicon logo in both light and dark variants."
          icon="solar:gallery-bold-duotone"
        />

        <div class="grid gap-6 lg:grid-cols-2">
          <UCard
            v-for="asset in assetCards"
            :key="asset.key"
            class="overflow-hidden"
          >
            <template #header>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-lg font-semibold text-highlighted">
                    {{ asset.title }}
                  </h2>
                  <p class="mt-1 text-sm text-muted">
                    {{ asset.description }}
                  </p>
                </div>

                <UButton
                  color="primary"
                  variant="soft"
                  icon="solar:download-minimalistic-bold-duotone"
                  @click="downloadAsset(asset.key, asset.filename)"
                >
                  Download PNG
                </UButton>
              </div>
            </template>

            <div
              :ref="(element) => setAssetRef(asset.key, element)"
              :class="[
                'flex min-h-64 items-center justify-center rounded-2xl p-8',
                asset.background,
              ]"
            >
              <AppWordmark
                v-if="asset.render.type === 'wordmark'"
                size="2xl"
                :variant="asset.render.variant"
              />
              <AppFaviconLogo
                v-else
                size="xl"
                :variant="asset.render.variant"
              />
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
