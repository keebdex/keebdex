<template>
  <ArtisanTCGCardFrame
    :rarity="rarity"
    card-class="border-[10px] border-transparent bg-[linear-gradient(160deg,#f8fafc_0%,#cbd5e1_25%,#94a3b8_50%,#e2e8f0_75%,#94a3b8_100%)] text-[#1f2937]"
  >
    <div class="flex shrink-0 items-center justify-between px-0.5 pt-0.5 pb-1">
      <div class="flex items-center gap-2">
        <span
          class="text-[1.25rem] font-black tracking-[-0.02em] text-[#0f172a] [text-shadow:0_1px_0_rgba(255,255,255,0.4)]"
        >
          {{ colorwayTitle(colorway) }}
        </span>
      </div>
      <!-- <div class="flex items-center gap-1">
        <span class="text-[0.65rem] font-extrabold text-[#dc2626]">QTY</span>
        <span class="text-[1.25rem] font-black tracking-[-0.03em] text-[#dc2626]">{{ colorway.qty }}</span>
        <div class="attr-badge attr-{{ colorway.attr }} ml-1 h-6 w-6 text-xs">
          {{ '' }}
        </div>
      </div> -->
    </div>

    <!-- ARTWORK IMAGE FRAME -->
    <div
      class="relative min-h-[165px] w-full flex-auto overflow-hidden border-[3px] border-[#9ca3af] bg-black shadow-[inset_0_0_6px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.3)] [border-image:linear-gradient(to_bottom,#e5e7eb,#6b7280)_1]"
    >
      <img
        :src="colorway.img"
        :alt="colorway.name"
        class="h-full w-full object-cover"
      >
    </div>

    <!-- POKEMON POKEDEX BAR -->
    <div
      class="mt-[3px] mb-1.5 shrink-0 rounded-[2px] border border-[#6b7280] bg-[linear-gradient(90deg,#d1d5db_0%,#f3f4f6_50%,#9ca3af_100%)] py-[1.5px] text-center text-[0.58rem] font-bold text-[#374151] italic shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
    >
      {{
        `NO. ${(colorway.order + 1).toString().padStart(3, '0')} ${colorway.sculpt.name} Artisan`
      }}
    </div>

    <!-- DESCRIPTION & STATS TEXT BOX -->
    <div
      class="flex h-[185px] shrink-0 flex-col justify-between overflow-hidden rounded-md border border-white/40 bg-white/25 px-2 py-1.5 backdrop-blur-[4px]"
    >
      <div class="flex flex-1 flex-col overflow-hidden">
        <div class="mb-1 flex items-center gap-1.5">
          <span
            v-if="colorway.sale_type"
            class="mr-1.5 inline-block rounded-xl bg-red-600 px-2 py-px text-[0.65rem] font-black text-white italic shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
          >
            {{ colorway.sale_type }}
          </span>
          <span
            v-if="colorway.release"
            class="text-xs font-black text-[#991b1b]"
          >
            {{ colorway.release }}
          </span>
        </div>
        <p
          class="line-clamp-5 text-[11px] leading-snug font-medium break-words text-slate-900"
        >
          {{ colorway.description }}
        </p>
        <!-- <div
          class="mt-2 flex items-center justify-between border-t border-slate-900/10 pt-1"
        >
          <div class="flex items-center gap-1 text-xs font-bold text-slate-900">
            <span
              class="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] text-white"
            >
              🔥
            </span>
            <span>Price</span>
          </div>
          <span class="text-sm font-extrabold text-slate-900">
            {{
              colorway.price
                ? `${colorway.currency || 'USD'}${colorway.price}`
                : '???'
            }}
          </span>
        </div> -->
        <div
          v-if="colorway.qty"
          class="mt-2 flex items-center justify-between border-t border-slate-900/10 pt-1"
        >
          <div class="flex items-center gap-1 text-xs font-bold text-slate-900">
            <span
              class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] text-white"
            >
              📦
            </span>
            <span>Quantity</span>
          </div>
          <span class="text-sm font-extrabold text-slate-900">
            {{ colorway.qty }}
          </span>
        </div>
      </div>

      <div
        class="mt-1 flex shrink-0 items-center justify-between border-t border-black/15 pt-1 text-[0.58rem] font-extrabold text-[#1f2937]"
      >
        <div>weakness <i class="fa-solid fa-droplet text-blue-600" /> ×2</div>
        <div>resistance</div>
        <div>retreat</div>
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
</script>
