<template>
  <Form
    v-slot="$form"
    :initial-values="maker"
    :resolver
    class="flex flex-col gap-6"
    @submit="onSubmit"
  >
    <div class="flex flex-col gap-2">
      <label for="maker_name">Name</label>
      <IconField>
        <InputIcon class="pi pi-pencil" />
        <InputText
          id="maker_name"
          v-model.trim="maker.name"
          name="name"
          type="text"
          fluid
        />
        <InputIcon
          v-if="maker.verified"
          v-tooltip="'Verified'"
          class="pi pi-verified !text-[#22c55e] !dark:text-[#4ade80]"
        />
      </IconField>
      <Message
        v-if="$form.name?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.name.error.message }}
      </Message>
    </div>

    <div v-if="isAdmin" class="flex items-center gap-2">
      <Checkbox
        v-model="maker.verified"
        name="verified"
        input-id="maker_verified"
        binary
      />
      <label for="maker_verified">Verified</label>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="flex flex-col gap-2">
        <label for="maker_nationality">Nationality</label>
        <Select
          v-model="maker.nationality"
          name="nationality"
          :options="continents"
          option-group-label="continent"
          option-group-children="countries"
          option-label="name"
          option-value="code"
        >
        </Select>
        <Message
          v-if="$form.nationality?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.nationality.error.message }}
        </Message>
      </div>
      <div class="flex flex-col gap-2">
        <label for="maker_founded">Founded</label>
        <IconField>
          <InputIcon class="pi pi-calendar" />
          <InputText
            id="maker_founded"
            v-model.trim="maker.founded"
            name="founded"
            type="text"
            fluid
            placeholder="e.g., 2024, Feb 2024"
          />
        </IconField>
        <Message
          v-if="$form.founded?.invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.founded.error.message }}
        </Message>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label for="maker_doc_id">Document ID</label>
      <IconField
        v-for="(docId, idx) in maker.document_ids"
        id="maker_doc_id"
        :key="docId"
      >
        <InputIcon class="pi pi-file-word" />
        <InputText :key="idx" v-model.trim="maker.document_ids[idx]" fluid />
        <InputIcon
          v-tooltip="'Remove'"
          class="pi pi-minus-circle cursor-pointer"
          @click="removeDocId(docId)"
        />
      </IconField>
      <Message
        v-if="$form.document_ids?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.document_ids.error.message }}
      </Message>
      <Button
        severity="secondary"
        outlined
        label="Add Document Id"
        icon="pi pi-file-plus"
        @click="addDocId"
      />
    </div>

    <div class="flex flex-col gap-2">
      <label for="maker_website">Website</label>
      <IconField>
        <InputIcon class="pi pi-globe" />
        <InputText
          id="maker_website"
          v-model.trim="maker.website"
          name="website"
          type="url"
          fluid
        />
      </IconField>
      <Message
        v-if="$form.website?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.website.error.message }}
      </Message>
    </div>

    <div class="flex flex-col gap-2">
      <label for="maker_instagram">Instagram</label>
      <IconField>
        <InputIcon class="pi pi-instagram" />
        <InputText
          id="maker_instagram"
          v-model.trim="maker.instagram"
          name="instagram"
          type="url"
          fluid
        />
      </IconField>
      <Message
        v-if="$form.instagram?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.instagram.error.message }}
      </Message>
    </div>

    <div class="flex flex-col gap-2">
      <label for="maker_discord">Discord</label>
      <IconField>
        <InputIcon class="pi pi-discord" />
        <InputText
          id="maker_discord"
          v-model.trim="maker.discord"
          name="discord"
          type="url"
          fluid
        />
      </IconField>
      <Message
        v-if="$form.discord?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.discord.error.message }}
      </Message>
    </div>

    <div class="flex flex-col gap-2">
      <label for="maker_artisancollector">ArtisanCollector</label>
      <IconField>
        <InputIcon class="pi pi-globe" />
        <InputText
          id="maker_artisancollector"
          v-model.trim="maker.artisancollector"
          name="artisancollector"
          type="url"
          fluid
        />
      </IconField>
      <Message
        v-if="$form.artisancollector?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.artisancollector.error.message }}
      </Message>
    </div>

    <div class="flex flex-col gap-2">
      <label for="maker_bio">Bio</label>
      <Textarea
        id="maker_bio"
        v-model.trim="maker.bio"
        name="bio"
        :rows="5"
        auto-resize
      />
      <Message severity="secondary" size="small" variant="simple">
        Keep it concise and under 400 characters for optimal display.
      </Message>
    </div>

    <div class="flex flex-col gap-2">
      <Button label="Save" type="submit" :disabled="!$form.valid" />
    </div>

    <Toast />
  </Form>
</template>

<script setup>
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import country from 'flag-icons/country.json'
import groupBy from 'lodash.groupby'
import slugify from 'slugify'

const emit = defineEmits(['onSuccess'])

const userStore = useUserStore()
const { isAdmin } = storeToRefs(userStore)

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

const continents = Object.entries(
  groupBy(
    country.filter((c) => c.continent),
    'continent',
  ),
).map(([continent, countries]) => ({
  continent,
  countries,
}))

const discordInviteRegex = /discord\.gg\/[a-zA-Z0-9]+/
const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/

const resolver = ref(
  zodResolver(
    z.object({
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
    }),
  ),
)

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

const onSubmit = async ({ valid }) => {
  if (!valid) return

  const { sculpts, ...rest } = maker.value

  const makerId = isEdit ? rest.id : slugify(maker.value.name, { lower: true })

  $fetch(`/api/makers/${makerId}`, {
    method: 'post',
    body: {
      ...rest,
      id: makerId,
    },
  })
    .then(() => {
      if (isEdit) {
        toast.add({
          severity: 'success',
          summary: `[${rest.name}] updated successfully!`,
          life: 3000,
        })
        emit('onSuccess', true)
      } else {
        toast.add({
          severity: 'success',
          summary: `[${rest.name}] added successfully!`,
          life: 3000,
        })
        emit('onSuccess', true)
      }
    })
    .catch((error) => {
      toast.add({ severity: 'error', summary: error.message, life: 3000 })
    })
}
</script>
