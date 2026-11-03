<template>
  <!-- The navbar of a page inside a module: the breadcrumb on desktop and
       tablets, and on phones, where a trail does not fit, a back button to
       the parent page (the last item with a link). A trail that ends at the
       parent shows the parent's name on the button; one that ends at the page
       itself (manual sort) keeps the button icon-only beside its title. -->
  <UDashboardNavbar>
    <template #left>
      <UBreadcrumb
        v-if="$device.isDesktopOrTablet"
        :items="items"
        class="min-w-0"
      />

      <template v-else>
        <UButton
          v-if="parent"
          :to="parent.to"
          :icon="appConfig.ui.icons.arrowLeft"
          :label="current ? undefined : parent.label"
          :aria-label="`Back to ${parent.label}`"
          variant="ghost"
          class="-ms-1.5 min-w-0"
          :ui="{ label: 'block truncate' }"
        />

        <h1 v-if="current" class="truncate font-semibold text-highlighted">
          {{ current.label }}
        </h1>
      </template>
    </template>

    <template v-if="$slots.right" #right>
      <slot name="right" />
    </template>
  </UDashboardNavbar>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const props = defineProps<{
  items: BreadcrumbItem[]
}>()

const appConfig = useAppConfig()

const parent = computed(() => props.items.findLast((item) => item.to))

// The page itself, when the trail ends with it rather than at the parent
const current = computed(() => {
  const last = props.items.at(-1)
  return last && !last.to ? last : undefined
})
</script>
