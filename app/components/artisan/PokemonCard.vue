<template>
  <ArtisanTCGCardFrame
    :rarity="rarity"
    card-class="border-[11px] border-[#facc15] bg-[linear-gradient(135deg,#fcd34d,#f59e0b,#d97706)] text-[#1f2937]"
  >
    <!-- HEADER SECTION -->
    <div
      class="font-inter flex shrink-0 items-center justify-between px-1 py-0.5"
    >
      <span class="text-[1.1rem] font-extrabold text-[#111827]">
        {{ colorwayTitle(colorway) }}
      </span>
      <!-- Attribute Icon Badge -->
      <!-- <div class="attr-badge attr-LIGHT">
        <i class="fa-solid fa-sun" />
      </div> -->
    </div>

    <!-- STAGE / HP CONTAINER -->
    <div class="mt-1 mb-1 shrink-0">
      <div class="flex w-full items-center justify-between px-1">
        <span class="text-[0.65rem] font-extrabold uppercase text-[#4b5563]">
          {{ subtypeDisplay }}
        </span>
        <span class="text-[1.1rem] font-black text-[#dc2626]">
          HP {{ '120' }}
        </span>
      </div>
    </div>

    <!-- ARTWORK IMAGE FRAME -->
    <div
      class="relative w-full flex-auto min-h-[170px] overflow-hidden rounded-lg border-4 border-[#eab308] bg-[#111] shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
    >
      <img
        :src="colorway.img"
        alt="Card Art"
        class="h-full w-full object-cover"
      >
    </div>

    <!-- DESCRIPTION & STATS TEXT BOX (Strictly Max 5-6 Lines) -->
    <div
      class="mt-1.5 flex h-[165px] shrink-0 flex-col justify-between overflow-hidden rounded-md border-2 border-[#d1d5db] bg-[linear-gradient(to_bottom,#ffffff,#f3f4f6)] p-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
    >
      <div>
        <div
          class="font-inter mb-1 shrink-0 border-b border-[#d1d5db] pb-0.5 text-[0.75rem] font-bold text-[#374151]"
        >
          [{{ subtypeDisplay }}]
        </div>

        <!-- Description Text with line clamping -->
        <p
          class="line-clamp-5 text-[0.8rem] leading-[1.3] break-words text-[#111827]"
        >
          {{ colorway.description }}
        </p>
      </div>

      <!-- STATS FOOTER -->
      <div
        class="mt-1 flex items-center justify-between border-t border-amber-900/20 pt-1 font-mono text-xs font-bold text-amber-950"
      >
        <span>
          PRICE:
          {{
            colorway.price
              ? `${colorway.currency || 'USD'}${colorway.price}`
              : '???'
          }}
        </span>
        <span>QTY: {{ colorway.qty || '???' }}</span>
      </div>
    </div>
  </ArtisanTCGCardFrame>
</template>

<script setup>
const { colorway } = defineProps({
  colorway: {
    type: Object,
    default: () => ({}),
  },
  stars: {
    type: Number,
    default: null,
  },
  rarity: {
    type: String,
    default: null,
  },
})

const subtypeDisplay = computed(() => {
  const { sale_type, release } = colorway

  return [sale_type, release].filter(Boolean).join(' - ') || undefined
})
</script>
