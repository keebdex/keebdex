<template>
  <UForm :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField name="pins">
      <UListbox
        v-model="state.pins"
        multiple
        filter
        label-key="name"
        :value-key="valueKey"
        :items="items"
        selected-icon="hugeicons:pin"
        :ui="{ item: 'items-center' }"
      >
        <template v-if="logos" #item-leading="{ item }">
          <UAvatar
            :src="logoUrl(item[valueKey])"
            size="xs"
            :ui="{
              root: 'rounded-none bg-transparent',
              image: item.invertible_logo && 'dark:invert',
            }"
          />
        </template>
      </UListbox>
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto label="Save" />
  </UForm>
</template>

<script setup>
// Customize Pins for a list: makers or keyboard brands (`logos`), or a pinned
// maker's sculpts or a pinned brand's keyboards. `save` persists the picked
// keys through the user store's pin actions.
const emit = defineEmits(['onSuccess'])

const { selected, save } = defineProps({
  // Pinned first, as the list shows them
  items: {
    type: Array,
    default: () => [],
  },
  valueKey: {
    type: String,
    required: true,
  },
  selected: {
    type: Array,
    default: () => [],
  },
  logos: Boolean,
  save: {
    type: Function,
    required: true,
  },
})

const toast = useToast()

const state = ref({ pins: [...selected] })

const onSubmit = () =>
  save(state.value.pins)
    .then(() => {
      toast.add(noticeToast('pins_saved'))
      emit('onSuccess')
    })
    .catch((error) => toast.add(errorToast(error)))
</script>
