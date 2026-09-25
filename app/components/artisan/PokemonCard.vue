<template>
  <div id="cardContainer" class="tcg-card-wrapper">
    <div id="tcgCard" :class="`tcg-card pokemon-style ${rarity || ''}`">
      <!-- Foil Holo Layer -->
      <div class="holo-overlay" />

      <!-- CARD INNER CONTENT CONTAINER -->
      <div id="cardContent" class="tcg-card-inner">
        <!-- HEADER SECTION -->
        <div id="cardHeader" class="pokemon-header">
          <span id="cardTitleDisplay" class="pokemon-title">
            {{ colorwayTitle(colorway) }}
          </span>
          <!-- Attribute Icon Badge -->
          <!-- <div id="cardAttrBadge" class="attr-badge attr-LIGHT">
            <i class="fa-solid fa-sun" />
          </div> -->
        </div>

        <!-- LEVEL STARS / HP CONTAINER -->
        <div id="cardStarsContainer" class="pokemon-stars">
          <div class="flex items-center justify-between w-full px-1">
            <span class="pokemon-stage"> {{ subtypeDisplay }}</span>
            <span class="pokemon-hp">HP {{ '120' }}</span>
          </div>
        </div>

        <!-- ARTWORK IMAGE FRAME -->
        <div id="cardImgFrame" class="pokemon-image-frame">
          <img
            id="cardImage"
            :src="colorway.img"
            alt="Card Art"
            class="w-full h-full object-cover"
          >
        </div>

        <!-- DESCRIPTION & STATS TEXT BOX (Strictly Max 5-6 Lines) -->
        <div id="cardBox" class="pokemon-box">
          <div>
            <div id="cardSubtypeDisplay" class="yugioh-type-line">
              [{{ subtypeDisplay }}]
            </div>

            <!-- Description Text with line clamping -->
            <p id="cardDescDisplay" class="card-description-text">
              {{ colorway.description }}
            </p>
          </div>

          <!-- STATS FOOTER -->
          <div
            id="cardStatsArea"
            class="pt-1 mt-1 border-t border-amber-900/20 flex justify-between items-center font-bold font-mono text-xs text-amber-950"
          >
            <span id="statLabel1">
              PRICE:
              {{
                colorway.price
                  ? `${colorway.currency || 'USD'}${colorway.price}`
                  : '???'
              }}
            </span>
            <span id="statLabel2">QTY: {{ colorway.qty || '???' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
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

<style>
:root {
  --card-width: 380px;
  --card-height: 550px;
}
</style>
