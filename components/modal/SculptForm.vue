<template>
  <UForm :schema="schema" :state="sculpt" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name">
      <UInput v-model.trim="sculpt.name" icon="hugeicons:text" class="w-full" />
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

    <UFormField label="URL" name="url">
      <UInput
        v-model.trim="sculpt.href"
        icon="hugeicons:globe-02"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Storyline"
      name="story"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="sculpt.story" :rows="5" class="w-full" />
    </UFormField>

    <UButton type="submit"> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

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
  profile: z.enum(profiles).nullish(),
  cast: z.enum(casts).nullish(),
  design: z.enum(designs).nullish(),
  href: z.string().url().nullish().or(z.string().min(0).max(0)),
  // story: z.string(),
})

const onSubmit = async ({ valid }) => {
  if (!valid) return

  $fetch(`/api/makers/${route.params.maker}/sculpts/${route.params.sculpt}`, {
    method: 'post',
    body: sculpt.value,
  })
    .then(() => {
      if (isEdit) {
        toast.add({
          severity: 'success',
          summary: 'Sculpt updated successfully!',
          life: 3000,
        })
        emit('onSuccess')
      } else {
        toast.add({
          severity: 'success',
          summary: 'New sculpt added successfully!',
          life: 3000,
        })
        emit('onSuccess')
      }
    })
    .catch((error) => {
      toast.add({ severity: 'error', summary: error.message, life: 3000 })
    })
}
</script>
