<template>
  <UForm
    :schema="schema"
    :state="colorway"
    class="space-y-6"
    @submit="onSubmit"
  >
    <div class="space-y-4">
      <p class="text-sm font-medium text-highlighted uppercase tracking-wide">
        Colorway Info
      </p>

      <ArtisanModalColorwayForm v-model="colorway" mode="embedded" />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        label="Submit Colorway"
        type="submit"
        color="primary"
        :loading="uploading"
      />
    </div>
  </UForm>
</template>

<script setup>
import { colorwaySchema } from '~/utils/schemas/artisan'

const emit = defineEmits(['onSuccess'])

const props = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
})

const schema = colorwaySchema
const { colorway, uploading, submit } = useArtisanSubmission(props.metadata)

const onSubmit = async () => {
  await submit()
  emit('onSuccess')
}
</script>
