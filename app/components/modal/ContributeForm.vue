<template>
  <UForm :schema :state="contribute" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="contribute.name"
        icon="hugeicons:user-circle-02"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="How would you like to contribute?"
      name="message"
      required
      help="Tell us what you want to help with: catalog updates, code, content, moderation, testing, or anything else."
      :ui="{ help: 'text-info' }"
    >
      <UTextarea
        v-model.trim="contribute.message"
        :rows="5"
        placeholder="Example: I can help update keyset listings and verify keyboard specs weekly."
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Email"
      name="email"
      required
      help="Share your email so we can follow up and coordinate with you directly."
    >
      <UInput
        v-model.trim="contribute.email"
        icon="hugeicons:mail-01"
        placeholder="you@domain.com"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="GitHub"
      name="github"
      help="For bugs or feature requests, opening a GitHub issue/discussion is still the fastest route."
    >
      <UInput
        value="https://github.com/keebdex/keebdex"
        icon="hugeicons:github"
        disabled
        class="w-full"
      >
        <template #trailing>
          <UButton
            icon="hugeicons:link-square-02"
            variant="ghost"
            to="https://github.com/keebdex/keebdex"
            target="_blank"
            external
          />
        </template>
      </UInput>
    </UFormField>

    <UAlert
      color="neutral"
      variant="ghost"
      title="Thank you for helping us build Keebdex together."
      :ui="{ root: 'rounded-none p-0', title: 'font-bold' }"
    />

    <UButton
      block
      icon="hugeicons:sent"
      color="primary"
      type="submit"
      loading-auto
    >
      Send Contribution Interest
    </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const toast = useToast()

const contribute = ref({ name: '', message: '', email: '' })

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  message: z
    .string()
    .trim()
    .min(1, 'Please tell us how you would like to contribute.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
})

const onSubmit = async () => {
  await $fetch('/api/feedbacks', {
    method: 'post',
    body: {
      name: contribute.value.name,
      message: ['[Contribute]', contribute.value.message].join('\n\n'),
      email: contribute.value.email,
    },
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Contribution Interest Sent',
        detail:
          'Thanks for offering to help. Our team will follow up with you soon.',
      })
      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
