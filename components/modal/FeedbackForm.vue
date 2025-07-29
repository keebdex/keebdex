<template>
  <Form
    v-slot="$form"
    :initial-values="feedback"
    :resolver
    class="flex flex-col gap-6"
    @submit="onSubmit"
  >
    <div class="flex flex-col gap-2">
      <label for="feedback_name">Name</label>
      <IconField>
        <InputIcon class="pi pi-user" />
        <InputText
          id="feedback_name"
          v-model.trim="feedback.name"
          name="name"
          type="text"
          fluid
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
    <div class="flex flex-col gap-2">
      <label for="feedback_message">Message</label>
      <Textarea
        id="feedback_message"
        v-model.trim="feedback.message"
        name="message"
        placeholder="What can we do to make your experience even better?"
        :rows="5"
        auto-resize
      />
      <Message
        v-if="$form.message?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.message.error.message }}
      </Message>
      <Message severity="warn" size="small" variant="simple">
        Please don't include any sensitive information like passwords, or
        personal details.
      </Message>
    </div>

    <Divider align="center" pt:content:class="text-xl">
      <b>Help us make {{ $config.app.name }} amazing!</b>
    </Divider>

    We welcome your contributions! If you encounter any issues or have
    suggestions for improvement, please feel free to:

    <div class="flex flex-col gap-2">
      <label for="feedback_github">Submit a GitHub Issue or Discussion</label>
      <IconField>
        <InputIcon class="pi pi-github" />
        <InputText
          id="feedback_github"
          value="https://github.com/keebdex/keebdex"
          type="text"
          fluid
          disabled
        />
        <InputIcon>
          <template #default>
            <NuxtLink
              to="https://github.com/keebdex/keebdex"
              target="_blank"
              external
            >
              <i class="pi pi-external-link" />
            </NuxtLink>
          </template>
        </InputIcon>
      </IconField>
      <Message severity="secondary" size="small" variant="simple">
        Report bugs, request features, or discuss ideas on our GitHub repository
      </Message>
    </div>

    <div class="flex flex-col gap-2">
      <label for="feedback_email">Contact Us</label>
      <IconField>
        <InputIcon class="pi pi-inbox" />
        <InputText
          id="feedback_email"
          v-model.trim="feedback.email"
          name="email"
          placeholder="If you prefer direct communication, leave your contact info here to get started."
          type="text"
          fluid
        />
      </IconField>
      <Message
        v-if="$form.email?.invalid"
        severity="error"
        size="small"
        variant="simple"
      >
        {{ $form.email.error.message }}
      </Message>
    </div>

    Your feedback and support are invaluable to us. Thank you for your help!

    <div class="flex flex-col gap-2">
      <Button label="Send" type="submit" :disabled="!$form.valid" />
    </div>

    <Toast />
  </Form>
</template>

<script setup>
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const emit = defineEmits(['onSuccess'])

const toast = useToast()

const feedback = ref({
  name: '',
  message: '',
})

const resolver = ref(
  zodResolver(
    z.object({
      name: z.string().min(1),
      message: z.string().min(1),
      email: z.string().email().nullish().or(z.string().min(0).max(0)), // to allow empty string
    }),
  ),
)

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
      toast.add({ color: 'error', title: error.message })
    })
}
</script>
