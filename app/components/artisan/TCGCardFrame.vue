<template>
  <div
    class="group h-[var(--card-height)] w-[var(--card-width)] select-none [perspective:1000px]"
  >
    <div
      :class="[
        'relative h-full w-full overflow-hidden rounded-2xl bg-cover bg-center p-2 shadow-[0_20px_35px_rgba(0,0,0,0.6),0_0_15px_rgba(0,0,0,0.4)] transition-[transform,box-shadow] duration-150 ease-out [transform-style:preserve-3d]',
        cardClass,
      ]"
    >
      <!-- Foil Holo Layer: hidden on hover so the artwork can be seen clearly -->
      <div
        :class="[
          'pointer-events-none absolute inset-0 z-[25] transition-opacity duration-300 group-hover:opacity-0',
          foil
            ? 'animate-[holoShift_8s_ease-in-out_infinite] bg-no-repeat opacity-75 [background-position:50%_50%] [background-size:250%_250%] motion-reduce:animate-none [mix-blend-mode:color-dodge] [background-image:linear-gradient(115deg,transparent_20%,rgba(255,0,150,0.4)_35%,rgba(255,230,0,0.5)_45%,rgba(0,255,200,0.5)_55%,rgba(0,150,255,0.4)_65%,transparent_80%)]'
            : 'opacity-0',
        ]"
      />

      <!-- CARD INNER CONTENT CONTAINER (theme-specific header/stars/image/box) -->
      <div class="relative flex h-full w-full flex-col overflow-hidden">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  foil: {
    type: Boolean,
    default: true,
  },
  // Theme-specific border/background/text color, e.g.
  // "border-[12px] border-[#221508] bg-[linear-gradient(...)] text-[#111]"
  cardClass: {
    type: [String, Array, Object],
    default: '',
  },
})
</script>

<style>
:root {
  --card-width: 380px;
  --card-height: 550px;
}

/* One sweep across the card, then a rest with the band parked off the card
   (no-repeat, positions past 0-100%) so the artwork stays clear. */
@keyframes holoShift {
  0% {
    background-position: -50% -50%;
  }

  25%,
  100% {
    background-position: 150% 150%;
  }
}
</style>
