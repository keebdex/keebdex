<template>
  <div class="w-full h-full flex flex-col justify-center bg-[#212121]">
    <svg
      class="absolute top-0 right-0"
      width="1200"
      height="675"
      viewBox="0 0 1200 675"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        style="mix-blend-mode: overlay"
        opacity="0.7"
        filter="url(#filter0_f_448_25)"
      >
        <circle cx="901.5" cy="45.5" r="199.5" fill="#FFA7A7" />
        <circle cx="600.5" cy="216.5" r="199.5" fill="#FFCC49" />
        <circle cx="179.5" cy="317.5" r="199.5" fill="#FFA149" />
      </g>
      <defs>
        <filter
          id="filter0_f_448_25"
          x="-240"
          y="-374"
          width="1561"
          height="1111"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="110"
            result="effect1_foregroundBlur_448_25"
          />
        </filter>
      </defs>
    </svg>

    <div class="w-[720px] pl-[120px]">
      <h1
        v-if="title"
        class="text-[36px] text-[#FEC476] font-semibold text-left"
      >
        {{ $config.app.name }}
      </h1>

      <h1 class="w-[600px] m-0 text-[72px] font-semibold text-white">
        {{ title || $config.app.name }}
      </h1>
      <p class="text-[24px] text-[#E4E4E7] font-medium leading-tight">
        {{ description }}
      </p>
    </div>

    <img
      class="absolute my-auto right-[120px]"
      loading="lazy"
      :alt="$config.app.name"
      :src="`/logo-filled.png`"
      width="240"
    />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
})
</script>
