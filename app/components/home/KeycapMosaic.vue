<template>
  <div class="relative">
    <div
      class="pointer-events-none absolute inset-6 rounded-full bg-primary/15 blur-3xl"
    />

    <!-- Quarter-unit columns, so rows stagger like a keyboard's: the second
    row starts a quarter key in, the third three quarters (Tab, Caps Lock) -->
    <div class="relative grid grid-cols-[repeat(19,minmax(0,1fr))]">
      <ULink
        v-for="(colorway, index) in keys"
        :key="colorway.colorway_id"
        :to="`/artisan/maker/${colorway.maker_id}/${colorway.sculpt_id}?cid=${colorway.colorway_id}`"
        :aria-label="colorway.name"
        :title="colorway.name"
        :class="['group col-span-4 p-1 sm:p-1.5', offsets[index]]"
      >
        <!-- The keycap: its skirt below, the photo as the top face, which
        presses down on hover -->
        <span
          class="block rounded-xl bg-accented p-1 pb-2.5 shadow-sm ring ring-default transition-[padding] group-hover:pt-1.5 group-hover:pb-2"
        >
          <NuxtImg
            :src="colorway.img"
            :alt="colorway.name"
            sizes="96px sm:128px lg:144px"
            loading="lazy"
            decoding="async"
            class="aspect-square w-full rounded-lg bg-elevated object-cover"
          />
        </span>
      </ULink>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: {
    colorway_id: string
    name: string
    img: string
    maker_id: string
    sculpt_id: string
  }[]
}>()

// Three rows of four keys
const keys = computed(() => props.items.slice(0, 12))

// Each row's first key sets where the row starts
const offsets = Object.fromEntries([
  [0, 'col-start-1'],
  [4, 'col-start-2'],
  [8, 'col-start-4'],
]) as Record<number, string>
</script>
