<template>
  <!-- One swatch of the Colors page: the color with its hex on it, then the
       system and code, the name, and how many keysets use it -->
  <button
    type="button"
    class="group flex w-full min-w-0 flex-col gap-2 rounded-lg text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    @click="$emit('select', color)"
  >
    <span
      class="flex aspect-4/3 w-full items-end rounded-lg p-2.5 ring-1 ring-default ring-inset transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transition-none"
      :style="{ backgroundColor: color.hex }"
    >
      <span
        class="font-mono text-xs uppercase"
        :class="isLightColor(color.hex) ? 'text-black/70' : 'text-white/80'"
      >
        {{ color.hex }}
      </span>
    </span>

    <span class="min-w-0 px-0.5">
      <span
        class="block truncate text-sm font-medium text-highlighted group-hover:text-primary"
      >
        {{ color.system }} {{ color.code }}
      </span>
      <span class="flex items-center justify-between gap-2 text-xs text-muted">
        <span class="truncate">{{ color.name || '—' }}</span>
        <span
          v-if="color.keyset_count"
          class="flex shrink-0 items-center gap-1"
          :title="countLabel(color.keyset_count, 'keyset')"
        >
          <UIcon :name="KEEB_MODULE_ICONS.keyset" class="size-3.5" />
          {{ color.keyset_count }}
        </span>
      </span>
    </span>
  </button>
</template>

<script setup>
defineProps({
  color: {
    type: Object,
    required: true,
  },
})

defineEmits(['select'])
</script>
