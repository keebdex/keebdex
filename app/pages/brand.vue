<template>
  <UTheme
    :ui="{
      pageCard: {
        title: 'text-sm font-bold',
        description: 'mt-1 text-xs leading-relaxed text-muted',
      },
      pageSection: {
        headline: 'font-mono text-xs uppercase tracking-[0.24em] text-muted',
        header: 'flex flex-col items-start',
        description: 'text-start',
      },
    }"
  >
    <UDashboardPanel
      id="brand"
      :ui="{
        body: 'overflow-y-scroll snap-y snap-mandatory scroll-smooth p-0',
      }"
    >
      <template v-if="$device.isMobileOrTablet" #header>
        <UDashboardNavbar title="Brand Guidelines" />
      </template>

      <template #body>
        <!-- Section progress dots -->
        <div
          class="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex"
        >
          <button
            v-for="(label, i) in sectionLabels"
            :key="i"
            :title="label"
            class="group relative flex items-center justify-end gap-2"
            @click="scrollToSection(i)"
          >
            <span
              class="pointer-events-none invisible absolute right-5 whitespace-nowrap rounded bg-inverted/80 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-inverted opacity-0 transition-all group-hover:visible group-hover:opacity-100"
            >
              {{ label }}
            </span>
            <span
              class="block rounded-full transition-all duration-300"
              :class="
                currentSection === i
                  ? 'h-5 w-1.5 bg-primary'
                  : 'h-1.5 w-1.5 bg-muted hover:bg-default'
              "
            />
          </button>
        </div>

        <!-- Hero -->
        <section
          :ref="(el) => (sectionRefs[0] = el)"
          class="relative flex min-h-dvh snap-start flex-col items-center justify-center px-8 py-20"
        >
          <div class="max-w-5xl w-full mx-auto">
            <UPageSection
              headline="keebdex.org — Brand Guidelines"
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
            </UPageSection>
          </div>

          <BrandScrollIndicator />
        </section>

        <!-- 01 Logo -->
        <UPageSection
          :ref="(el) => (sectionRefs[1] = el)"
          headline="01 - Logo"
          title="The Wordmark"
          description='The Keebdex wordmark combines a bold typographic treatment with a minimal Esc key motif — the small bar beneath "keeb" references the Escape key, the most iconic key on any collector&apos;s board.'
          class="relative flex min-h-dvh snap-start flex-col items-center justify-center px-8 py-20"
        >
          <div
            class="grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl bg-transparent"
          >
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

          <BrandScrollIndicator />
        </UPageSection>

        <!-- 02 Favicon -->
        <UPageSection
          :ref="(el) => (sectionRefs[2] = el)"
          headline="02 - Favicon & App Icon"
          title="The Mark"
          description='The mark distills the wordmark into "kd" — short for keebdex — with the Esc bar below. Used as favicon, app icon, and avatar across all platforms.'
          class="relative flex min-h-dvh snap-start flex-col items-center justify-center px-8 py-20"
        >
          <div class="flex flex-wrap items-end gap-8">
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
            <div class="hidden self-stretch border-l border-default sm:block" />
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
          <BrandScrollIndicator />
        </UPageSection>

        <!-- 03 Colors -->
        <UPageSection
          :ref="(el) => (sectionRefs[3] = el)"
          headline="03 - Colors"
          title="Color Palette"
          description="Teal anchors the brand — precise, focused, and distinct from the saturated palettes common in the keyboard space."
          class="relative flex min-h-dvh snap-start flex-col items-center justify-center px-8 py-20"
        >
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
          <BrandScrollIndicator />
        </UPageSection>

        <!-- 04 Typography -->
        <UPageSection
          :ref="(el) => (sectionRefs[4] = el)"
          headline="04 - Typography"
          title="Type System"
          description="Two fonts, clear roles. Dosis is reserved exclusively for the logo and wordmark. Reddit Sans handles all UI text — headers, body, labels."
          class="relative flex min-h-dvh snap-start flex-col items-center justify-center px-8 py-20"
        >
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
                <span class="mt-1 text-[11px] text-muted/50">{{
                  scale.use
                }}</span>
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
          <BrandScrollIndicator />
        </UPageSection>

        <!-- 05 Usage / Don'ts -->
        <UPageSection
          :ref="(el) => (sectionRefs[5] = el)"
          headline="05 - Usage"
          title="Do's & Don'ts"
          description="Keep the logo clean and consistent across all surfaces."
          class="relative flex min-h-dvh snap-start flex-col items-center justify-center px-8 py-20"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <AppWordmark size="lg" variant="light" style="opacity: 30%" />
                </template>
              </UPageCard>
              <BrandDontBadge />
            </div>

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
              <BrandDontBadge />
            </div>

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
                    >keebdex</span
                  >
                </template>
              </UPageCard>
              <BrandDontBadge />
            </div>

            <div class="relative">
              <UPageCard
                variant="naked"
                class="w-full"
                title="Wrong Font"
                description="Never render the wordmark in Reddit Sans or any font other than Dosis 800."
                :ui="{
                  header:
                    'flex w-full h-28 items-center justify-center rounded-xl border border-default bg-muted',
                }"
              >
                <template #header>
                  <span
                    class="font-sans text-3xl font-extrabold leading-none tracking-tight"
                    >keeb</span
                  ><span
                    class="font-sans text-3xl font-extrabold leading-none tracking-tight text-teal-500 dark:text-teal-400"
                    >dex</span
                  >
                </template>
              </UPageCard>
              <BrandDontBadge />
            </div>
          </div>
          <BrandScrollIndicator />
        </UPageSection>

        <!-- 06 Download -->
        <UPageSection
          :ref="(el) => (sectionRefs[6] = el)"
          class="snap-start"
          :ui="{
            root: 'relative flex min-h-dvh flex-col items-center justify-center px-8 py-20',
            container: 'w-full max-w-5xl',
          }"
        >
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

          <div
            class="absolute inset-x-8 bottom-6 flex flex-wrap items-center justify-between gap-4 border-t border-default pt-6"
          >
            <AppWordmark size="md" variant="auto" />
            <p class="font-mono text-xs text-muted">
              keebdex.org — Brand Guidelines v1.0
            </p>
          </div>
        </UPageSection>
      </template>
    </UDashboardPanel>
  </UTheme>
</template>

<script setup>
const sectionLabels = [
  'Overview',
  '01 · Logo',
  '02 · Favicon',
  '03 · Colors',
  '04 · Typography',
  '05 · Usage',
  'Download',
]

const sectionRefs = ref([])
const currentSection = ref(0)

// Resolve a ref to its DOM element — handles both native elements and Vue component instances
const getEl = (ref) => ref?.$el ?? ref

onMounted(() => {
  const domEls = sectionRefs.value.map(getEl)

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const index = domEls.indexOf(entry.target)
          if (index !== -1) currentSection.value = index
        }
      }
    },
    { threshold: 0.5 },
  )

  for (const el of domEls) {
    if (el) observer.observe(el)
  }

  onUnmounted(() => observer.disconnect())
})

const scrollToSection = (index) => {
  getEl(sectionRefs.value[index])?.scrollIntoView({ behavior: 'smooth' })
}

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
