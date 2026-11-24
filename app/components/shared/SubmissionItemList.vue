<template>
  <div class="space-y-4">
    <div
      v-for="(item, index) in items"
      :key="item._key"
      class="space-y-4 rounded-lg border border-default p-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <p class="text-xs font-medium text-dimmed">
            {{ entity }} #{{ index + 1 }}
          </p>

          <UBadge
            v-if="!editable && status"
            :label="status"
            variant="subtle"
            size="xs"
            :color="(statusColorMap[status] as any) || 'neutral'"
          />
        </div>

        <UButton
          v-if="editable"
          :aria-label="`Remove ${entity.toLowerCase()}`"
          size="xs"
          color="error"
          variant="ghost"
          icon="solar:trash-bin-minimalistic-line-duotone"
          :disabled="items.length <= minItems"
          @click="emit('remove', index)"
        />
      </div>

      <slot :item="item" :index="index" />
    </div>

    <UButton
      v-if="editable"
      :label="`Add ${entity}`"
      size="xs"
      variant="soft"
      icon="solar:add-line-duotone"
      block
      @click="emit('add')"
    />
  </div>
</template>

<script setup lang="ts">
// The repeatable colorway/kit/variant cards of a submission wizard. Create
// mode can add and remove items; review mode edits exactly one and shows its
// review status instead.
withDefaults(
  defineProps<{
    items: { _key: number; [key: string]: any }[]
    // e.g. 'Kit', for the card titles and buttons.
    entity: string
    // Create mode: whether items can be added/removed.
    editable: boolean
    status?: string | null
    // Items that cannot be removed (forum review may add no kit at all).
    minItems?: number
  }>(),
  { status: undefined, minItems: 1 },
)

const emit = defineEmits<{ add: []; remove: [index: number] }>()
</script>
