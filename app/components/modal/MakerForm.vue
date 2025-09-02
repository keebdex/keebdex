<template>
  <UForm :schema="schema" :state="maker" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="maker.name"
        icon="hugeicons:text"
        :trailing-icon="maker.verified && 'hugeicons:id-verified'"
        class="w-full"
        :ui="{
          trailingIcon: 'text-primary',
        }"
      />
    </UFormField>

    <UFormField>
      <UCheckbox v-model="maker.verified" label="Verified" />
    </UFormField>

    <UFormField label="Nationality" name="nationality">
      <USelectMenu
        v-model="maker.nationality"
        :items="country"
        label-key="name"
        value-key="code"
        icon="hugeicons:global"
        class="w-full"
      >
        <template #item-leading="{ item }">
          <span :class="`fi fi-${item.code}`"></span>
        </template>
      </USelectMenu>
    </UFormField>

    <UFormField label="Founded" name="founded">
      <UInput
        v-model.number="maker.founded"
        placeholder="e.g., 2024, Feb 2024"
        icon="hugeicons:calendar-03"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Document ID"
      name="document_ids"
      :ui="{
        container: 'flex flex-col gap-2',
      }"
    >
      <UInput
        v-for="(docId, idx) in maker.document_ids"
        :key="docId"
        v-model.trim="maker.document_ids[idx]"
        icon="hugeicons:file-01"
        :trailing-icon="maker.verified && 'hugeicons:id-verified'"
        class="w-full"
      >
        <template #trailing>
          <UButton
            color="error"
            variant="link"
            icon="hugeicons:file-remove"
            @click="removeDocId(docId)"
          />
        </template>
      </UInput>

      <UButton
        label="Add Document Id"
        icon="hugeicons:file-add"
        variant="outline"
        class="w-full"
        @click="addDocId"
      />
    </UFormField>

    <UFormField label="Website" name="website">
      <UInput
        v-model="maker.website"
        icon="hugeicons:globe-02"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Instagram" name="instagram">
      <UInput
        v-model.trim="maker.instagram"
        icon="hugeicons:instagram"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Discord" name="discord">
      <UInput
        v-model.trim="maker.discord"
        icon="hugeicons:discord"
        class="w-full"
      />
    </UFormField>

    <UFormField label="ArtisanCollector" name="artisancollector">
      <UInput
        v-model.trim="maker.artisancollector"
        icon="hugeicons:globe-02"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Bio"
      name="bio"
      help="Keep it concise and under 400 characters for optimal display."
    >
      <UTextarea v-model.trim="maker.bio" :rows="5" class="w-full" />
    </UFormField>

    <UButton block color="primary" type="submit" loading-auto> Save </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'
import country from 'flag-icons/country.json'
import slugify from 'slugify'

const emit = defineEmits(['onSuccess'])

const toast = useToast()

const { metadata, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isKeeb: Boolean,
  isEdit: Boolean,
})

const maker = ref({
  name: '',
})

onBeforeMount(() => {
  if (Object.keys(metadata).length) {
    maker.value = { ...metadata }
  }
})

const discordInviteRegex = /discord\.gg\/[a-zA-Z0-9]+/
const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/

const schema = z.object({
  name: z.string().min(1),
  nationality: z.string().nullish().or(z.string().min(0).max(0)),
  founded: z.string().nullish().or(z.string().min(0).max(0)),
  document_ids: z.string().array(),
  website: z.string().url().nullish().or(z.string().min(0).max(0)),
  instagram: z
    .string()
    .url()
    .regex(instagramRegex, 'Invalid Instagram profile URL')
    .nullish()
    .or(z.string().min(0).max(0)),
  discord: z
    .string()
    .url()
    .regex(discordInviteRegex, 'Invalid Discord invite link')
    .nullish()
    .or(z.string().min(0).max(0)),
  artisancollector: z.string().url().nullish().or(z.string().min(0).max(0)),
})

const addDocId = () => {
  if (!Array.isArray(maker.value.document_ids)) {
    maker.value.document_ids = ['']
  } else {
    maker.value.document_ids.push('')
  }
}

const removeDocId = (docIdx) => {
  maker.value.document_ids = maker.value.document_ids.filter(
    (d) => d !== docIdx,
  )
}

const onSubmit = async () => {
  const { sculpts, ...rest } = maker.value

  const makerId = isEdit ? rest.id : slugify(maker.value.name, { lower: true })

  await $fetch(`/api/makers/${makerId}`, {
    method: 'post',
    body: {
      ...rest,
      id: makerId,
    },
  })
    .then(() => {
      if (isEdit) {
        toast.add({
          color: 'success',
          title: `[${rest.name}] updated successfully!`,
        })
        emit('onSuccess')
      } else {
        toast.add({
          color: 'success',
          title: `[${rest.name}] added successfully!`,
        })
        emit('onSuccess')
      }
    })
    .catch((error) => {
      toast.add({ color: 'error', title: error.message })
    })
}
</script>
