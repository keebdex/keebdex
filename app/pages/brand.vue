<template>
  <UTheme
    :ui="{
      pageHeader: {
        headline: 'font-mono uppercase tracking-widest',
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
            <p
              class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
            >
              keebdex.org — Brand Guidelines
            </p>

            <AppWordmark size="2xl" variant="auto" />

            <p
              class="max-w-[520px] text-lg font-medium leading-relaxed text-muted"
            >
              The ultimate platform for keyboard collectors to curate, sync, and
              showcase their collections.
            </p>

            <!-- Meta row -->
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
          </section>

          <UDivider />

          <!-- 01 Logo -->
          <section id="logo" class="flex flex-col gap-8">
            <UPageHeader
              headline="01 - Logo"
              title="The Wordmark"
              description='The Keebdex wordmark combines a bold typographic treatment with a
              minimal Esc key motif — the small bar beneath "keeb" references the
              Escape key, the most iconic key on any collector&apos;s board.'
            />

            <!-- 2×2 grid — bg-black gap so the separator is always visible -->
            <div
              class="grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl bg-black"
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

          <UDivider />

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

          <UDivider />

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
                  title: 'text-sm font-medium',
                  description: 'text-xs text-muted',
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

          <UDivider />

          <!-- 04 Typography -->
          <section id="typography" class="flex flex-col gap-8">
            <UPageHeader
              headline="04 - Typography"
              title="Dosis"
              description="Dosis is a rounded geometric sans-serif — the same DNA as the
              legends printed on GMK keycaps. Bold, precise, and unmistakably
              keyboard."
            />

            <UPageCard variant="soft">
              <p
                class="mb-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
              >
                Dosis — Primary Typeface
              </p>
              <div class="flex flex-col gap-4">
                <div
                  v-for="scale in typeScales"
                  :key="scale.weight"
                  class="flex items-baseline gap-6"
                >
                  <span class="w-10 shrink-0 font-mono text-[10px] text-muted">
                    {{ scale.weight }}
                  </span>
                  <span
                    class="font-dosis leading-tight"
                    :class="scale.muted ? 'text-muted' : ''"
                    :style="{ fontWeight: scale.weight, fontSize: scale.size }"
                  >
                    {{ scale.sample }}
                  </span>
                </div>
              </div>
            </UPageCard>
          </section>

          <UDivider />

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
                      'flex w-full h-28 items-center justify-center rounded-xl border border-default bg-default',
                    title: 'text-sm font-bold',
                    description: 'mt-1 text-xs leading-relaxed text-muted',
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
                      'flex w-full h-28 items-center justify-center rounded-xl border border-default bg-elevated',
                    title: 'text-sm font-bold',
                    description: 'mt-1 text-xs leading-relaxed text-muted',
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
              </div>

              <!-- Don't 3: Recolored -->
              <UPageCard
                variant="naked"
                class="w-full"
                title="Recolored"
                :description="`Never change the accent color of 'dex'. Use only approved palette.`"
                :ui="{
                  header:
                    'flex w-full h-28 items-center justify-center rounded-xl border border-default bg-elevated',
                  title: 'text-sm font-bold',
                  description: 'mt-1 text-xs leading-relaxed text-muted',
                }"
              >
                <template #header>
                  <span
                    class="font-dosis font-extrabold leading-none tracking-tight text-slate-400"
                  >
                    keebdex</span
                  >
                </template>
              </UPageCard>
            </div>
          </section>

          <!-- Download CTAs -->
          <div
            class="flex flex-wrap items-center gap-3 rounded-2xl border border-default bg-elevated/50 px-6 py-5"
          >
            <p class="mr-2 font-mono text-xs text-muted">
              ASSETS · COMING SOON
            </p>
            <UButton color="neutral" variant="outline" disabled>
              Download SVG
            </UButton>
            <UButton color="neutral" variant="outline" disabled>
              Download PNG
            </UButton>
            <UButton color="neutral" variant="outline" disabled>
              Download Brand Kit
            </UButton>
          </div>

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
    hex: '#14b8a6',
    role: 'Primary Accent · Light UI',
    bg: 'bg-teal-500',
  },
  {
    name: 'Teal 400',
    hex: '#2dd4bf',
    role: 'Primary Accent · Dark UI',
    bg: 'bg-teal-400',
  },
  {
    name: 'Navy 900',
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
    weight: '800',
    size: 'clamp(28px,4vw,48px)',
    sample: 'Collect. Catalog. Connect.',
  },
  {
    weight: '700',
    size: 'clamp(20px,2.8vw,32px)',
    sample: "The collector's platform",
  },
  {
    weight: '600',
    size: 'clamp(16px,2vw,20px)',
    sample: 'Artisan · Keyset · Keyboard',
  },
  {
    weight: '500',
    size: '16px',
    sample: 'Organize your artisans intelligently, stay synced across devices.',
    muted: true,
  },
]

const heroMeta = [
  { key: 'Version', val: '1.0' },
  { key: 'Primary Font', val: 'Dosis 800' },
  { key: 'Primary Color', val: '#14b8a6' },
]

useSeoMeta({
  title: 'Brand Guidelines',
  description:
    'Keebdex brand guidelines and press kit — logos, colors, and typography.',
})
</script>
