<template>
  <!-- The top of a maker, brand, or keyset profile page, laid out like the
       detail pages' catalog entries: the logo beside the name, the page's
       actions, the bio, the specs as rows, and the owner's own links as
       labeled buttons. On phones everything under the name folds into
       `detailsLabel`, closed by default, so the list starts on the first
       screen. -->
  <SharedDetailHero>
    <UPageHeader :ui="detailPageHeaderUi(false)">
      <template #title>
        <span class="flex items-center gap-3">
          <UAvatar
            v-if="slug"
            :src="logoUrl(slug)"
            :alt="title"
            size="xl"
            :ui="{
              root: 'bg-transparent rounded-none shrink-0',
              image: ['rounded-none object-contain', invertible && 'dark:invert'],
            }"
          />
          <span class="min-w-0 wrap-break-word">{{ title }}</span>
        </span>
      </template>

      <template v-if="$slots.actions" #links>
        <slot name="actions" />
      </template>

      <template v-if="description && !$device.isMobile" #description>
        <SharedDescription :description="description" class="max-w-4xl" />
      </template>
    </UPageHeader>

    <UCollapsible v-if="$device.isMobile && hasDetails">
      <UButton
        :label="detailsLabel"
        :trailing-icon="appConfig.ui.icons.chevronDown"
        block
        class="group justify-between"
        :ui="{
          label: 'block',
          trailingIcon:
            'transition-transform duration-200 group-data-[state=open]:rotate-180',
        }"
      />

      <template #content>
        <div class="space-y-4 pt-4">
          <SharedDescription
            v-if="description"
            :description="description"
            class="text-sm text-muted"
          />
          <SharedSpecList v-if="specs.length" :items="specs" layout="rows" />
          <div v-if="links.length" class="flex flex-wrap gap-2">
            <UButton
              v-for="link in links"
              :key="link.label"
              v-bind="link"
              :ui="{ label: 'block' }"
            />
          </div>
        </div>
      </template>
    </UCollapsible>

    <template v-else-if="!$device.isMobile">
      <SharedSpecList v-if="specs.length" :items="specs" layout="rows" />

      <div v-if="links.length" class="flex flex-wrap gap-2">
        <UButton
          v-for="link in links"
          :key="link.label"
          v-bind="link"
          :ui="{ label: 'block' }"
        />
      </div>
    </template>
  </SharedDetailHero>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

const {
  slug = '',
  invertible = false,
  description = '',
  specs = [],
  links = [],
} = defineProps<{
  title: string
  // The logo's key (`logoUrl`)
  slug?: string
  invertible?: boolean
  description?: string | null
  specs?: {
    term: string
    description?: string | number | null
    icon?: string
  }[]
  // External links (website, socials, catalogues), opened in a new tab
  links?: ButtonProps[]
  detailsLabel: string
}>()

defineSlots<{ actions?(): any }>()

const appConfig = useAppConfig()

const hasDetails = computed(
  () => !!description || specs.length > 0 || links.length > 0,
)
</script>
