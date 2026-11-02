<template>
  <!-- The top of a detail page (keyboard, keyset, sculpt): the media (a
       cover or a photo carousel) beside the record's header and specs. The
       media takes 3/5 of the row from lg and half from 2xl, so it doesn't
       grow too large on wide screens, and stays in view beside taller
       details; without media the details take the whole row. -->
  <section
    :class="
      $slots.media && 'grid grid-cols-1 gap-8 lg:grid-cols-5 2xl:grid-cols-2'
    "
  >
    <div
      v-if="$slots.media"
      class="min-w-0 lg:col-span-3 lg:sticky lg:top-0 lg:self-start 2xl:col-span-1"
    >
      <slot name="media" />
    </div>

    <div
      class="min-w-0 space-y-5"
      :class="$slots.media && 'lg:col-span-2 2xl:col-span-1'"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineSlots<{ media?(): any; default(): any }>()
</script>
