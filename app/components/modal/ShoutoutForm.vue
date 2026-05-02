<template>
  <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput v-model.trim="form.name" class="w-full" />
    </UFormField>

    <UFormField label="Role" name="role">
      <UInput v-model.trim="form.role" class="w-full" />
    </UFormField>

    <UFormField label="Avatar URL" name="avatar_url">
      <UInput v-model.trim="form.avatar_url" class="w-full" />
    </UFormField>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Status" name="status" required>
        <USelect v-model="form.status" :items="statusOptions" class="w-full" />
      </UFormField>

      <UFormField label="Featured" name="featured">
        <div class="flex h-10 items-center">
          <USwitch v-model="form.featured" />
        </div>
      </UFormField>
    </div>

    <UFormField label="Content" name="content" required>
      <UTextarea v-model.trim="form.content" :rows="6" class="w-full" />
    </UFormField>

    <UButton type="submit" block color="primary" :loading="saving">
      Save
    </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'
import { Constants } from '~/types/database.types'

const emit = defineEmits(['onSuccess'])

const { metadata, isEdit } = defineProps({
  metadata: {
    type: Object,
    default: () => ({}),
  },
  isEdit: Boolean,
})

const toast = useToast()
const statusOptions = Constants.public.Enums.review_status

const createEmptyForm = () => ({
  name: '',
  role: '',
  avatar_url: '',
  content: '',
  status: 'Approved',
  featured: false,
})

const form = ref(createEmptyForm())
const saving = ref(false)

const schema = z.object({
  name: z.string().min(1),
  role: z.string().nullish(),
  avatar_url: z.url().nullish().or(z.string().min(0).max(0)),
  content: z.string().min(1),
  status: z.enum(statusOptions),
  featured: z.boolean(),
})

onBeforeMount(() => {
  Object.assign(form.value, createEmptyForm(), metadata)
  form.value.role = metadata?.role || ''
  form.value.avatar_url = metadata?.avatar_url || ''
  form.value.featured = !!metadata?.featured
  form.value.status = metadata?.status || 'Approved'
})

const onSubmit = async () => {
  const payload = {
    name: form.value.name.trim(),
    role: form.value.role.trim() || null,
    avatar_url: form.value.avatar_url.trim() || null,
    content: form.value.content.trim(),
    status: form.value.status,
    featured: !!form.value.featured,
  }

  saving.value = true

  try {
    if (isEdit && metadata?.id) {
      await $fetch(`/api/admin/testimonials/${metadata.id}`, {
        method: 'post',
        body: payload,
      })
    } else {
      await $fetch('/api/admin/testimonials', {
        method: 'post',
        body: payload,
      })
    }

    toast.add(handleSuccess('save', 'Shoutout'))
    emit('onSuccess')
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    saving.value = false
  }
}
</script>
