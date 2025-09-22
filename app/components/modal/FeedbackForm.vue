<template>
  <UForm
    :schema="schema"
    :state="feedback"
    class="space-y-4"
    @submit="onSubmit"
  >
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
      :ui="{
        help: 'text-warning',
      }"
    >
      <UTextarea
        v-model.trim="feedback.message"
        :rows="5"
        placeholder="What can we do to make your experience even better?"
        class="w-full"
      />
    </UFormField>

    <USeparator>
      <template #default>
        <b>Help us make {{ $config.app.name }} amazing!</b>
      </template>
    </USeparator>

    <UAlert
      color="neutral"
      variant="ghost"
      title="We welcome your contributions!"
      description="If you encounter any issues or have suggestions for improvement, please feel free to:"
      :ui="{
        root: 'rounded-none p-0',
        title: 'font-bold',
      }"
    />

    <UFormField
      label="Submit a GitHub Issue or Discussion"
      name="github"
      help="Report bugs, request features, or discuss ideas on our GitHub repository"
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

    <UFormField
      label="Get Involved"
      name="email"
      help="Leave your email here if you're interested in supporting our project or receiving exclusive updates. We'll be in touch personally!"
    >
      <UInput
        v-model="feedback.email"
        icon="hugeicons:mail-01"
        placeholder="Share your email to connect with our team."
        class="w-full"
      />
    </UFormField>

    <UAlert
      color="neutral"
      variant="ghost"
      title="Your feedback and support are invaluable to us. Thank you for your help!"
      :ui="{
        root: 'rounded-none p-0',
        title: 'font-bold',
      }"
    />

    <UButton block icon="hugeicons:sent" color="primary" type="submit">
      Send
    </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const toast = useToast()

const feedback = ref({
  name: '',
  message: '',
})

const schema = z.object({
  name: z.string().min(1),
  message: z.string().min(1),
  email: z.email().nullish(),
})

const onSubmit = async () => {
  await $fetch('/api/feedbacks', {
    method: 'post',
    body: feedback.value,
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
      toast.add({
        color: 'error',
        title: 'Oops! Something went wrong',
        description: error.message,
      })
    })
}
</script>
