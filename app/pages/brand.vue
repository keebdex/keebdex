<template>
  <UTheme
    :ui="{
      pageCard: {
        title: 'text-sm font-bold',
        description: 'mt-1 text-xs leading-relaxed text-muted',
      },
      pageHeader: {
        headline: 'font-mono text-xs uppercase tracking-[0.24em] text-muted',
        root: 'border-none',
      },
    }"
  >
    <UDashboardPanel id="brand">
      <template v-if="$device.isMobileOrTablet" #header>
        <UDashboardNavbar title="Brand Guidelines" />
      </template>

      <template #body>
        <div
          class="mx-auto flex w-full max-w-5xl flex-col gap-32 px-4 py-16 sm:px-6 lg:px-8 gap-12"
        >
          <!-- Hero -->
          <section class="flex flex-col gap-8">
            <UPageHeader
              headline="keebdex.org — Brand Guidelines"
              description="The ultimate platform for keyboard collectors to curate, sync, and showcase their collections."
              :ui="{
                container: 'space-y-12',
                description: 'space-y-8 text-default',
              }"
            >
              <template #title>
                <AppWordmark size="2xl" variant="auto" />
              </template>

              <template #description>
                <p class="text-lg font-medium leading-relaxed text-muted">
                  The ultimate platform for keyboard collectors to curate, sync,
                  and showcase their collections.
                </p>

                <!-- Meta -->
                <div class="flex gap-12">
                  <div
                    v-for="item in heroMeta"
                    :key="item.key"
                    class="flex flex-col gap-1"
                  >
                    <span
                      class="font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
                    >
                      {{ item.key }}
                    </span>
                    <span class="text-[15px] font-bold">{{ item.val }}</span>
                  </div>
                </div>
              </template>
            </UPageHeader>
          </section>

          <USeparator />

          <!-- 01 Logo -->
          <section id="logo" class="flex flex-col gap-8">
            <UPageHeader
              headline="01 - Logo"
              title="The Wordmark"
              description='The Keebdex wordmark combines a bold typographic treatment with a
              minimal Esc key motif — the small bar beneath "keeb" references the
              Escape key, the most iconic key on any collector&apos;s board.'
            />

            <!-- 2×2 grid -->
            <div
              class="grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl bg-transparent"
            >
              <!-- Light -->
              <div
                class="flex flex-col items-center justify-center gap-8 bg-teal-50 px-12 py-16"
              >
                <AppWordmark size="xl" variant="light" />
                <span
                  class="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35"
                >
                  Light
                </span>
              </div>
              <!-- Dark -->
              <div
                class="flex flex-col items-center justify-center gap-8 bg-slate-900 px-12 py-16 ring-1 ring-inset ring-white/10"
              >
                <AppWordmark size="xl" variant="dark" />
                <span
                  class="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35"
                >
                  Dark
                </span>
              </div>
              <!-- Teal -->
              <div
                class="flex flex-col items-center justify-center gap-8 bg-teal-500 px-12 py-16"
              >
                <AppWordmark size="xl" variant="dark" />
                <span
                  class="font-mono text-[10px] uppercase tracking-[0.18em] text-black/35"
                >
                  Teal
                </span>
              </div>
              <!-- Slate -->
              <div
                class="flex flex-col items-center justify-center gap-8 bg-slate-800 px-12 py-16 ring-1 ring-inset ring-white/10"
              >
                <AppWordmark size="xl" variant="dark" />
                <span
                  class="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35"
                >
                  Slate
                </span>
              </div>
            </div>
          </section>

          <USeparator />

          <!-- 02 Favicon -->
          <section id="favicon" class="flex flex-col gap-8">
            <UPageHeader
              headline="02 - Favicon & App Icon"
              title="The Mark"
              description='The mark distills the wordmark into "kd" — short for keebdex —
              with the Esc bar below. Used as favicon, app icon, and avatar
              across all platforms.'
            />

            <div class="flex flex-wrap items-end gap-8">
              <!-- Light group -->
              <div class="flex items-end gap-6">
                <div
                  v-for="size in ['xl', 'lg', 'md']"
                  :key="`light-${size}`"
                  class="flex flex-col items-center gap-3"
                >
                  <AppFaviconLogo :size="size" variant="light" framed />
                  <span
                    class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
                  >
                    {{ size }} · Light
                  </span>
                </div>
              </div>

              <!-- Divider -->
              <div
                class="hidden self-stretch border-l border-default sm:block"
              />

              <!-- Dark group -->
              <div class="flex items-end gap-6">
                <div
                  v-for="size in ['xl', 'lg', 'md']"
                  :key="`dark-${size}`"
                  class="flex flex-col items-center gap-3"
                >
                  <AppFaviconLogo :size="size" variant="dark" framed />
                  <span
                    class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
                  >
                    {{ size }} · Dark
                  </span>
                </div>
              </div>
            </div>
          </section>

          <USeparator />

          <!-- 03 Colors -->
          <section id="colors" class="flex flex-col gap-8">
            <UPageHeader
              headline="03 - Colors"
              title="Color Palette"
              description="Teal anchors the brand — precise, focused, and distinct from the
              saturated palettes common in the keyboard space."
            />

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <UPageCard
                v-for="color in colors"
                :key="color.hex"
                :title="color.name"
                :description="color.hex"
                reverse
                variant="naked"
                :ui="{
                  root: 'w-full',
                  container: 'gap-y-2',
                }"
              >
                <div
                  :style="{ backgroundColor: color.hex }"
                  class="h-16 rounded"
                />

                <template #description>
                  {{ color.hex }}
                  <p class="mt-1 text-xs text-muted">{{ color.role }}</p>
                </template>
              </UPageCard>
            </div>
          </section>

          <USeparator />

          <!-- 04 Typography -->
          <section id="typography" class="flex flex-col gap-8">
            <UPageHeader
              headline="04 - Typography"
              title="Type System"
              description="Two fonts, clear roles. Dosis is reserved exclusively for the logo and wordmark. Reddit Sans handles all UI text — headers, body, labels."
            />

            <div
              class="flex flex-col divide-y divide-default overflow-hidden rounded-xl border border-default"
            >
              <div
                v-for="scale in typeScales"
                :key="scale.weight + scale.family"
                class="flex items-center gap-8 bg-elevated/40 px-8 py-7"
              >
                <div class="flex w-36 shrink-0 flex-col gap-0.5">
                  <span
                    class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
                  >
                    {{ scale.family }}
                  </span>
                  <span
                    class="font-mono text-[10px] tracking-[0.1em] text-muted/60"
                  >
                    Weight {{ scale.weight }}
                  </span>
                  <span class="mt-1 text-[11px] text-muted/50">
                    {{ scale.use }}
                  </span>
                </div>
                <span
                  :class="[
                    'leading-tight',
                    scale.mono ? 'font-mono' : scale.dosis ? 'font-dosis' : '',
                    scale.muted ? 'text-muted' : '',
                  ]"
                  :style="{
                    fontWeight: scale.weight,
                    fontSize: scale.size,
                    letterSpacing: scale.tracking,
                  }"
                >
                  {{ scale.sample }}
                </span>
              </div>
            </div>
          </section>

          <USeparator />

          <!-- 05 Usage / Don'ts -->
          <section id="usage" class="flex flex-col gap-8">
            <UPageHeader
              headline="05 - Usage"
              title="Do's & Don'ts"
              description="Keep the logo clean and consistent across all surfaces."
            />

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <!-- Don't 1: Low contrast -->
              <div class="relative">
                <UPageCard
                  variant="naked"
                  class="w-full"
                  title="Low Contrast"
                  :description="`Never place the logo on backgrounds with insufficient contrast.`"
                  :ui="{
                    header:
                      'flex w-full h-28 items-center justify-center rounded-xl border border-default bg-muted',
                  }"
                >
                  <template #header>
                    <AppWordmark
                      size="lg"
                      variant="light"
                      style="opacity: 30%"
                    />
                  </template>
                </UPageCard>
                <span
                  class="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                >
                  ✕
                </span>
              </div>

              <!-- Don't 2: Distorted -->
              <div class="relative">
                <UPageCard
                  variant="naked"
                  class="w-full"
                  title="Distorted"
                  description="Never stretch or squash the wordmark. Always scale proportionally."
                  :ui="{
                    header:
                      'flex w-full h-28 items-center justify-center rounded-xl border border-default bg-muted',
                  }"
                >
                  <template #header>
                    <AppWordmark
                      size="lg"
                      variant="light"
                      style="
                        transform: scaleX(1.4);
                        transform-origin: center center;
                      "
                    />
                  </template>
                </UPageCard>
                <span
                  class="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                >
                  ✕
                </span>
              </div>

              <!-- Don't 3: Recolored -->
              <div class="relative">
                <UPageCard
                  variant="naked"
                  class="w-full"
                  title="Recolored"
                  :description="`Never change the accent color of 'dex'. Use only approved palette.`"
                  :ui="{
                    header:
                      'flex w-full h-28 items-center justify-center rounded-xl border border-default bg-muted',
                  }"
                >
                  <template #header>
                    <span
                      class="font-dosis text-3xl font-extrabold leading-none tracking-tight text-slate-400"
                    >
                      keebdex</span
                    >
                  </template>
                </UPageCard>
                <span
                  class="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                >
                  ✕
                </span>
              </div>
            </div>
          </section>

          <!-- Download CTAs -->
          <UPageCTA
            title="Brand Assets"
            description="Download the official Keebdex logos, marks, and brand kit for use in your projects and press coverage."
            variant="subtle"
            :links="[
              {
                label: 'Coming Soon',
                color: 'primary',
                icon: 'solar:download-minimalistic-bold-duotone',
                to: '/brand/press-kit.zip',
                disabled: true,
              },
            ]"
          />

          <!-- Footer -->
          <div
            class="flex flex-wrap items-center justify-between gap-4 border-t border-default py-6"
          >
            <AppWordmark size="md" variant="auto" />
            <p class="font-mono text-xs text-muted">
              keebdex.org — Brand Guidelines v1.0
            </p>
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </UTheme>
</template>

<script setup>
const colors = [
  {
    name: 'Teal 500',
    hex: '#00bba7',
    role: 'Primary Accent · Light UI',
    bg: 'bg-teal-500',
  },
  {
    name: 'Teal 400',
    hex: '#00d5be',
    role: 'Primary Accent · Dark UI',
    bg: 'bg-teal-400',
  },
  {
    name: 'Slate 900',
    hex: '#0f172a',
    role: 'Primary Text · Dark Background',
    bg: 'bg-slate-900',
  },
  {
    name: 'Teal 50',
    hex: '#f0fdfa',
    role: 'Background · Light UI',
    bg: 'bg-teal-50 border border-slate-200',
  },
]

const typeScales = [
  {
    family: 'Dosis',
    weight: '800',
    use: 'Logo & wordmark only',
    size: '42px',
    tracking: '-0.02em',
    sample: 'keebdex',
    dosis: true,
  },
  {
    family: 'Reddit Sans',
    weight: '700',
    use: 'Headings',
    size: '32px',
    sample: "The Collector's Platform",
  },
  {
    family: 'Reddit Sans',
    weight: '600',
    use: 'Subheadings, labels',
    size: '20px',
    sample: 'Artisan · Keyset · Keyboard',
  },
  {
    family: 'Reddit Sans',
    weight: '400',
    use: 'Body text',
    size: '16px',
    sample:
      'Organize your artisans intelligently, stay synced across devices, and share your passion with fellow enthusiasts.',
    muted: true,
  },
  {
    family: 'Reddit Mono',
    weight: '400',
    use: 'Labels, hex codes, meta',
    size: '13px',
    tracking: '0.12em',
    sample: '01 — BRAND · #00bba7 · v1.0',
    mono: true,
    muted: true,
  },
]

const heroMeta = [
  { key: 'Version', val: '1.0' },
  { key: 'Logo Font', val: 'Dosis 800' },
  { key: 'Body Font', val: 'Reddit Sans' },
  { key: 'Primary Color', val: '#00bba7' },
]

useSeoMeta({
  title: 'Brand Guidelines',
  description:
    'Keebdex brand guidelines and press kit — logos, colors, and typography.',
})
</script>
