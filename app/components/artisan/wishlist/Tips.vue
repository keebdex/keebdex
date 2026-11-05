<template>
  <!-- How the Wishlist Image behaves, in one place: a click (not hover, which
       phones lack) opens the tips. The button always carries a dot so it is
       easy to find; past 24 caps the dot and the size tip turn warning. -->
  <UPopover :content="{ align: 'end' }">
    <UTooltip text="Tips">
      <UChip :color="tooMany ? 'warning' : 'primary'" inset>
        <UButton
          icon="solar:lightbulb-line-duotone"
          aria-label="Wishlist Tips"
        />
      </UChip>
    </UTooltip>

    <template #content>
      <div class="w-80 max-w-[calc(100vw-2rem)] p-4">
        <p class="mb-3 font-semibold text-highlighted">Tips</p>

        <UPageList as="ul" class="gap-4">
          <UPageFeature
            v-for="{ warning, ...tip } in tips"
            :key="tip.title"
            v-bind="tip"
            as="li"
            :ui="{
              leadingIcon: warning && 'text-warning',
              title: ['text-sm', warning && 'text-warning'],
              description: 'text-sm',
            }"
          />
        </UPageList>
      </div>
    </template>
  </UPopover>
</template>

<script setup>
const { totalItems } = defineProps({
  // Caps on the sheet, for the size tip
  totalItems: {
    type: Number,
    default: 0,
  },
})

const { isMobile } = useDevice()

const tooMany = computed(() => totalItems > 24)

const tips = computed(() => [
  {
    icon: 'solar:move-line-duotone',
    title: 'Drag to Reorder',
    description: `${
      isMobile
        ? 'Press and hold a card, then drag it.'
        : 'Drag a card to move it.'
    } The order is saved to the collection, so the image opens the same way next time.`,
  },
  {
    icon: 'solar:trash-bin-minimalistic-line-duotone',
    title: 'Remove Is Just for This Image',
    description:
      'A removed cap stays in your collection and comes back next time, beside the cap it followed.',
  },
  {
    icon: 'solar:star-line-duotone',
    title: 'Top Priority Here, or for Good',
    description:
      'The star marks a cap on this image only. To keep it, turn on Priority with Edit Listing on the collection page.',
  },
  {
    icon: 'solar:widget-line-duotone',
    title: '16 to 24 Caps Preview Best',
    description: tooMany.value
      ? `This list has ${totalItems} caps, so the image gets tall and Discord or Reddit shows it as a small preview. Add columns in Layout to keep it closer to square, or remove a few caps for this image.`
      : 'A long list makes a tall image, which Discord and Reddit shrink to a small preview. Add columns in Layout to keep a big list closer to square.',
    warning: tooMany.value,
  },
  {
    icon: 'solar:list-line-duotone',
    title: 'Text for the Threads',
    description:
      'Save & Share also has a Text tab with your list ready to paste in Discord or Reddit.',
  },
])
</script>
