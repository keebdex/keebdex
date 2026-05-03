<template>
  <UForm :schema :state="feedback" class="space-y-4" @submit="onSubmit">
    <UFormField label="Name" name="name" required>
      <UInput
        v-model.trim="feedback.name"
        icon="hugeicons:user-circle-02"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Message"
      name="message"
      required
      help="Please don't include any sensitive information like passwords, or personal details."
      :ui="{ help: 'text-warning' }"
    >
      <UTextarea
        v-model.trim="feedback.message"
        :rows="5"
        placeholder="What can we do to make your experience even better?"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Email"
      name="email"
      help="Leave your email if you want us to follow up."
    >
      <UInput
        v-model.trim="feedback.email"
        icon="hugeicons:mail-01"
        placeholder="you@domain.com"
        class="w-full"
      />
    </UFormField>

    <UAlert
      color="neutral"
      variant="ghost"
      title="Your feedback is invaluable to us. Thank you for sharing it!"
      :ui="{ root: 'rounded-none p-0', title: 'font-bold' }"
    />

    <UButton
      block
      icon="hugeicons:sent"
      color="primary"
      type="submit"
      loading-auto
    >
      Send Feedback
    </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const toast = useToast()

const feedback = ref({ name: '', message: '', email: '' })

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  message: z.string().trim().min(1, 'Message is required.'),
  email: z
    .string()
    .trim()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'Please enter a valid email address.',
    }),
})

const onSubmit = async () => {
  await $fetch('/api/feedbacks', {
    method: 'post',
    body: {
      name: feedback.value.name,
      message: feedback.value.message,
      email: feedback.value.email || null,
    },
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Feedback Submitted',
        detail:
          'Your feedback is valuable to us. We appreciate you taking the time to share it!',
      })
      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
