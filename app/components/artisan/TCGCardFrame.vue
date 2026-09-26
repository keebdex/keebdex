<template>
  <div
    class="h-[var(--card-height)] w-[var(--card-width)] select-none [perspective:1000px]"
  >
    <div
      :class="[
        'relative h-full w-full overflow-hidden rounded-2xl bg-cover bg-center p-2 shadow-[0_20px_35px_rgba(0,0,0,0.6),0_0_15px_rgba(0,0,0,0.4)] transition-[transform,box-shadow] duration-150 ease-out [transform-style:preserve-3d]',
        cardClass,
      ]"
    >
      <!-- Foil Holo Layer -->
      <div
        :class="[
          'pointer-events-none absolute inset-0 z-[25] transition-opacity duration-300',
          rarity === 'holo-active' &&
            'animate-[holoShift_4s_linear_infinite] opacity-75 [background-size:250%_250%] [mix-blend-mode:color-dodge] [background-image:linear-gradient(115deg,transparent_20%,rgba(255,0,150,0.4)_35%,rgba(255,230,0,0.5)_45%,rgba(0,255,200,0.5)_55%,rgba(0,150,255,0.4)_65%,transparent_80%)]',
          rarity === 'secret-rare-active' &&
            'opacity-85 [mix-blend-mode:overlay] [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.15)_0px,rgba(255,255,255,0.15)_2px,transparent_2px,transparent_4px),linear-gradient(135deg,rgba(255,0,0,0.4),rgba(0,255,0,0.4),rgba(0,0,255,0.4))]',
          !rarity && 'opacity-0',
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
  // 'holo-active' | 'secret-rare-active' | null
  rarity: {
    type: String,
    default: null,
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

@keyframes holoShift {
  0% {
    background-position: 0% 0%;
  }

  50% {
    background-position: 100% 100%;
  }

  100% {
    background-position: 0% 0%;
  }
}
</style>
