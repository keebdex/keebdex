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
      label="Revision Of"
      name="is_revision_of"
      help="Pick an existing sculpt from this maker."
    >
      <UInputMenu
        v-model="sculpt.is_revision_of"
        :items="
          sculpts.filter((s) => s.maker_sculpt_id !== sculpt.maker_sculpt_id)
        "
        value-key="maker_sculpt_id"
        label-key="name"
        clear
        icon="hugeicons:hierarchy-square-10"
        placeholder="Search sculpts..."
        class="w-full"
      />
    </UFormField>

    <UFormField label="Collection" name="collection">
      <UInputMenu
        v-model.trim="sculpt.collection"
        :items="collectionOptions"
        autocomplete
        clear
        icon="hugeicons:dashboard-square-02"
        placeholder="Collection name"
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

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'
import slugify from 'slugify'

const emit = defineEmits(['onSuccess'])

const { metadata, sculpts, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  sculpts: {
    type: Array,
    default: () => [],
  },
  isEdit: Boolean,
})

const toast = useToast()

const route = useRoute()
const sculpt = ref({
  maker_id: route.params.maker,
  sculpt_id: route.params.sculpt,
  collection: undefined,
  is_revision_of: undefined,
})

onBeforeMount(() => {
  const { colorways, ...rest } = metadata

  Object.assign(sculpt.value, rest)
})

const collectionOptions = computed(() => {
  return Array.from(
    new Set(sculpts.map((item) => item.collection).filter(Boolean)),
  ).sort()
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
  collection: z.string().nullish(),
  is_revision_of: z.string().nullish(),
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
      collection: sculpt.value.collection || null,
      is_revision_of: sculpt.value.is_revision_of || null,
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
