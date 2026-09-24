<template>
  <div class="space-y-6">
    <UStepper
      ref="stepper"
      v-model="active"
      :items="items"
      disabled
      class="w-full"
    >
      <template #brand>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Pick the brand this keyboard belongs to.
          </p>

          <USelectMenu
            v-model="brand.id"
            :items="brandOptions"
            :loading="brandsStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a brand"
            class="w-full"
          />
        </div>
      </template>

      <template #keyboard>
        <div class="space-y-4">
          <UTabs
            v-if="keyboardOptions.length"
            v-model="keyboardMode"
            :items="keyboardModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="keyboardMode === 'existing'"
            v-model="existingKeyboard.id"
            :items="keyboardOptions"
            :loading="keyboardsStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a keyboard"
            class="w-full"
          />

          <KeyboardModalKeyboardForm
            v-else
            v-model="keyboard"
            mode="embedded"
          />
        </div>
      </template>

      <template #release>
        <div class="space-y-4">
          <UTabs
            v-if="keyboardMode === 'existing' && releaseOptions.length"
            v-model="releaseMode"
            :items="releaseModeTabs"
            size="sm"
          />

          <USelectMenu
            v-if="releaseMode === 'existing'"
            v-model="existingRelease.id"
            :items="releaseOptions"
            :loading="releasesStatus === 'pending'"
            value-key="value"
            label-key="label"
            placeholder="Select a release"
            class="w-full"
          />

          <KeyboardModalReleaseForm
            v-else
            v-model="release"
            :keyboard="{ releases: [] }"
            mode="embedded"
          />
        </div>
      </template>

      <template #variant>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            Add one or more variants for this release.
          </p>

          <div
            v-for="(variant, index) in variants"
            :key="variant._key"
            class="space-y-4 rounded-lg border border-default p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-dimmed">
                Variant #{{ index + 1 }}
              </p>

              <UButton
                aria-label="Remove variant"
                size="xs"
                color="error"
                variant="ghost"
                icon="hugeicons:delete-02"
                :disabled="variants.length === 1"
                @click="removeVariant(index)"
              />
            </div>

            <KeyboardModalVariantForm
              v-model="variants[index]"
              :keyboard="keyboardForVariantForm"
              mode="embedded"
            />
          </div>

          <UButton
            label="Add Variant"
            size="xs"
            variant="soft"
            icon="hugeicons:plus-sign"
            block
            @click="addVariant"
          />
        </div>
      </template>
    </UStepper>

    <div class="flex items-center justify-between gap-2">
      <UButton
        label="Back"
        variant="soft"
        :disabled="!stepper?.hasPrev"
        @click="stepper?.prev()"
      />

      <UButton
        v-if="stepper?.hasNext"
        label="Next"
        trailing-icon="hugeicons:arrow-right-02"
        @click="onNext"
      />
      <UButton
        v-else
        label="Submit Variants"
        color="primary"
        :loading="uploading"
        @click="onSubmit"
      />
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['onSuccess'])

const stepper = useTemplateRef('stepper')
const active = ref(0)

const items = [
  { slot: 'brand', title: 'Brand', icon: 'hugeicons:user-multiple' },
  { slot: 'keyboard', title: 'Keyboard', icon: 'hugeicons:keyboard' },
  { slot: 'release', title: 'Release', icon: 'hugeicons:package' },
  { slot: 'variant', title: 'Variant', icon: 'hugeicons:layers-01' },
]

const keyboardModeTabs = [
  { label: 'Choose Existing Keyboard', value: 'existing' },
  { label: 'Propose New Keyboard', value: 'new' },
]

const releaseModeTabs = [
  { label: 'Choose Existing Release', value: 'existing' },
  { label: 'Propose New Release', value: 'new' },
]

const {
  brand,
  brandOptions,
  brandsStatus,
  keyboardMode,
  existingKeyboard,
  keyboardOptions,
  keyboardsStatus,
  keyboard,
  releaseMode,
  existingRelease,
  releaseOptions,
  releasesStatus,
  release,
  variants,
  addVariant,
  removeVariant,
  keyboardForVariantForm,
  uploading,
  validateStep,
  submit,
} = useKeyboardSubmissionWizard()

onMounted(() => {
  if (brand.value.id && existingKeyboard.value.id) {
    active.value = 2
  }
})

const onNext = () => {
  if (!validateStep(active.value)) return
  stepper.value?.next()
}

const onSubmit = async () => {
  if (!validateStep(3)) return

  try {
    await submit()
    emit('onSuccess')
  } catch {
    // toasted inside the composable
  }
}
</script>
