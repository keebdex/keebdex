<template>
  <!-- One swatch, on the Colors page and in a keyset's palette: the color
       with its hex centered on it, then the system and code, the name, and how many
       keysets use it when known. The button's ::after covers the whole tile,
       so the `action` slot (e.g. Remove, beside the name: on the swatch it
       would be lost on pale colors) sits above it. `compact` is the smaller
       swatch of a keyset's palette. -->
  <div
    class="group relative flex min-w-0 flex-col"
    :class="compact ? 'gap-1.5' : 'gap-2'"
  >
    <span
      class="flex w-full items-center justify-center ring-1 ring-default ring-inset transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transition-none"
      :class="
        compact ? 'aspect-3/2 rounded-md' : 'aspect-4/3 rounded-lg'
      "
      :style="{ backgroundColor: color.hex }"
    >
      <span
        class="font-mono uppercase"
        :class="[
          compact ? 'text-xs' : 'text-sm',
          isLightColor(color.hex) ? 'text-black/70' : 'text-white/80',
        ]"
      >
        {{ color.hex }}
      </span>
    </span>

    <div class="flex min-w-0 items-start gap-1 px-0.5">
      <button
        type="button"
        class="min-w-0 flex-1 text-start after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
        @click="$emit('select', color)"
      >
        <span
          class="block truncate font-medium text-highlighted group-hover:text-primary"
          :class="compact ? 'text-xs' : 'text-sm'"
        >
          {{ color.system }} {{ color.code }}
        </span>
        <span
          class="flex items-center justify-between gap-2 text-xs text-muted"
        >
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
      </button>

      <div v-if="$slots.action" class="relative z-10 shrink-0">
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  color: {
    type: Object,
    required: true,
  },
  compact: Boolean,
})

defineEmits(['select'])
</script>
