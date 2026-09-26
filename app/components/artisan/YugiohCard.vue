<template>
  <ArtisanTCGCardFrame
    :rarity="rarity"
    card-class="border-[12px] border-[#221508] bg-[linear-gradient(145deg,#d27d2d,#8b4513,#b85b14)] text-[#111]"
  >
    <!-- HEADER SECTION -->
    <div
      class="font-cinzel flex shrink-0 items-center justify-between rounded border-2 border-[#5a3d11] bg-[linear-gradient(to_bottom,#fce8ad,#d1a441,#edd17d)] px-2 py-1 shadow-[inset_0_0_4px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.4)]"
    >
      <span
        class="min-w-0 flex-1 truncate text-[1.05rem] font-black tracking-[-0.02em] text-[#1a0f00] [text-shadow:0.5px_0.5px_0px_rgba(255,255,255,0.8)]"
      >
        {{ colorwayTitle(colorway) }}
      </span>
      <!-- Attribute Icon Badge -->
      <!-- <div class="attr-badge attr-LIGHT">
        <i class="fa-solid fa-sun" />
      </div> -->
    </div>

    <!-- LEVEL STARS / HP CONTAINER -->
    <div class="mt-1 mr-1 mb-1 flex shrink-0 justify-end gap-0.5">
      <div
        v-for="n in stars"
        :key="n"
        class="h-[18px] w-[18px] bg-[radial-gradient(circle,#fff066,#ff8c00)] [clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
      />
    </div>

    <!-- ARTWORK IMAGE FRAME -->
    <div
      class="relative w-full flex-auto min-h-[170px] overflow-hidden rounded-[2px] border-4 border-[#8f6c26] bg-black shadow-[inset_0_0_8px_#000,0_3px_6px_rgba(0,0,0,0.5)]"
    >
      <img
        :src="colorway.img"
        alt="Card Art"
        class="h-full w-full object-cover"
      >
    </div>

    <!-- DESCRIPTION & STATS TEXT BOX (Strictly Max 5-6 Lines) -->
    <div
      class="mt-1.5 flex h-[165px] shrink-0 flex-col justify-between overflow-hidden rounded-[2px] border-[3px] border-[#6b4d1b] bg-[#f1e1be] py-1.5 px-2 shadow-[inset_0_0_5px_rgba(0,0,0,0.2)] [background-image:radial-gradient(#e0c896_1px,transparent_1px)] [background-size:8px_8px]"
    >
      <div>
        <div
          class="font-cinzel mb-1 shrink-0 border-b border-[#a38243] pb-0.5 text-[0.75rem] font-extrabold text-[#2b1a03]"
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
          PRICE /
          {{
            colorway.price
              ? `${colorway.currency || 'USD'}${colorway.price}`
              : '???'
          }}
        </span>
        <span>QTY / {{ colorway.qty || '???' }}</span>
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

  return [sale_type, release].filter(Boolean).join(' / ') || undefined
})
</script>
