<template>
  <UForm :schema="schema" :state="sculpt" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="sculpt.name"
        icon="hugeicons:text-font"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Release" name="release">
      <UInput
        v-model.trim="sculpt.release"
        icon="hugeicons:calendar-02"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Profile" name="profile">
      <UTabs v-model="sculpt.profile" size="sm" :items="profiles" />
    </UFormField>

    <UFormField label="Cast" name="cast">
      <UTabs v-model="sculpt.cast" size="sm" :items="casts" />
    </UFormField>

    <UFormField label="Design" name="design">
      <UTabs v-model="sculpt.design" size="sm" :items="designs" />
    </UFormField>

    <UFormField
      label="Storyline"
      name="story"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="sculpt.story" :rows="5" class="w-full" />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'
import slugify from 'slugify'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
})

const toast = useToast()

const route = useRoute()
const sculpt = ref({
  maker_id: route.params.maker,
  sculpt_id: route.params.sculpt,
})

onBeforeMount(() => {
  const { colorways, ...rest } = metadata

  Object.assign(sculpt.value, rest)
})

const profiles = [
  { label: 'Sculpted', value: 'sculpted' },
  { label: 'Blank', value: 'blank' },
]
const casts = [
  { label: 'Resin', value: 'resin' },
  { label: 'Mixed', value: 'mixed' },
]
const designs = [
  { label: 'Physical', value: 'physical' },
  { label: 'Digital', value: 'digital' },
  { label: 'Hybrid', value: 'hybrid' },
]

const schema = z.object({
  name: z.string().min(1),
  release: z.string().nullish(),
  profile: z.enum(profiles.map((p) => p.value)).nullish(),
  cast: z.enum(casts.map((c) => c.value)).nullish(),
  design: z.enum(designs.map((d) => d.value)).nullish(),
  // story: z.string(),
})

const onSubmit = async () => {
  const makerId = String(sculpt.value.maker_id || route.params.maker || '')
  const sculptId = isEdit
    ? String(sculpt.value.sculpt_id || route.params.sculpt || '')
    : slugify(sculpt.value.name, { lower: true })

  await $fetch(`/api/makers/${makerId}/sculpts/${sculptId}`, {
    method: 'post',
    body: {
      ...sculpt.value,
      maker_id: makerId,
      sculpt_id: sculptId,
    },
  })
    .then(() => {
      toast.add(
        handleSuccess(isEdit ? 'update' : 'add', sculpt.value.name, 'Sculpt'),
      )
      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
