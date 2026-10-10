<template>
  <UForm :schema :state="feedback" class="space-y-4" @submit="onSubmit">
    <UFormField v-if="!authenticated" label="Name" name="name" required>
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
      v-if="!authenticated"
      label="Email"
      name="email"
      help="Leave your email if you want us to follow up, or sign in to get notified when it's resolved."
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
      :title="
        authenticated
          ? 'Your feedback is invaluable to us. We will notify you when it is resolved.'
          : 'Your feedback is invaluable to us. Thank you for sharing it!'
      "
      :ui="{ root: 'rounded-none p-0', title: 'font-bold' }"
    />

    <UButton block color="primary" type="submit" loading-auto>
      Send Feedback
    </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const toast = useToast()
const { authenticated } = storeToRefs(useUserStore())

const feedback = ref({ name: '', message: '', email: '' })

const message = z.string().trim().min(1, 'Message is required.')

// Signed-in users only write a message: the server links the feedback to
// their account, so their name and email come from their profile.
const schema = computed(() =>
  authenticated.value
    ? z.object({ message })
    : z.object({
        name: z.string().trim().min(1, 'Name is required.'),
        message,
        email: z
          .string()
          .trim()
          .refine((v) => !v || z.email().safeParse(v).success, {
            message: 'Please enter a valid email address.',
          }),
      }),
)

const onSubmit = async () => {
  const { name, message, email } = feedback.value

  await $fetch('/api/feedbacks', {
    method: 'post',
    body: authenticated.value
      ? { message }
      : { name, message, email: email || null },
  })
    .then(() => {
      toast.add(noticeToast('feedback_sent'))
      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(errorToast(error, { showOriginalMessage: true }))
    })
}
</script>
