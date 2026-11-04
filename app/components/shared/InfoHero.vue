<template>
  <header class="pt-2 pb-10 sm:pt-8 sm:pb-14">
    <!-- The info pages as a row of keycaps, the current one held down. Each
    legend sits top-left like a real key's, its name below as a sublegend. -->
    <nav aria-label="About Keebdex">
      <ul class="grid grid-cols-5 gap-1.5 sm:flex sm:gap-2">
        <li v-for="(page, index) in INFO_PAGES" :key="page.to">
          <NuxtLink
            :to="page.to"
            :aria-label="page.label"
            :aria-current="page.to === route.path ? 'page' : undefined"
            :style="{ '--i': index }"
            :class="[
              'home-key group block rounded-xl bg-accented p-1 shadow-sm ring transition-[padding,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none',
              page.to === route.path
                ? 'pt-2 pb-1 ring-primary/60 shadow-none'
                : 'pb-2.5 ring-default hover:pt-1.5 hover:pb-2',
            ]"
          >
            <span
              class="flex h-12 flex-col justify-between rounded-lg bg-elevated p-2 sm:h-14 sm:w-22"
            >
              <UIcon
                :name="page.icon"
                :class="[
                  'size-5',
                  page.to === route.path
                    ? 'text-primary'
                    : 'text-muted group-hover:text-highlighted',
                ]"
              />
              <span
                class="hidden truncate text-[11px] leading-none text-dimmed sm:block"
              >
                {{ page.legend }}
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <h1
      class="mt-10 max-w-4xl text-4xl font-bold tracking-tight text-balance text-highlighted sm:mt-12 sm:text-5xl lg:text-6xl"
    >
      <slot name="title">{{ title }}</slot>
    </h1>

    <p
      v-if="description || $slots.description"
      class="mt-5 max-w-2xl text-lg text-pretty text-muted"
    >
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="$slots.default" class="mt-8 flex flex-wrap items-center gap-3">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
// The opening of every info page (/about, /why-choose-keebdex, /changelog,
// /shoutouts, /privacy): the keycap row that moves between them, then the
// page's title and description, left aligned, and its links.
defineProps<{
  title: string
  description?: string
}>()

const route = useRoute()

const INFO_PAGES = [
  { label: 'About Keebdex', legend: 'About', icon: 'hugeicons:badge-info', to: '/about' },
  {
    label: 'Why Choose Keebdex?',
    legend: 'Compare',
    icon: 'hugeicons:balance-scale',
    to: '/why-choose-keebdex',
  },
  { label: 'Changelog', legend: 'Changelog', icon: 'hugeicons:scroll-text', to: '/changelog' },
  {
    label: 'Shoutouts',
    legend: 'Shoutouts',
    icon: 'hugeicons:bubble-chat-favourite',
    to: '/shoutouts',
  },
  { label: 'Privacy Policy', legend: 'Privacy', icon: 'hugeicons:shield-user', to: '/privacy' },
]
</script>
