<template>
  <!-- One color in full: the swatch, its codes, and the keysets that use it,
       with Edit and Delete for staff. One drawer serves the Colors page. -->
  <USlideover
    v-model:open="open"
    :title="color ? `${color.system} ${color.code}` : 'Color'"
    :description="color?.name || undefined"
    :ui="{
      // Nuxt UI sets the width as sm:max-w-md, so override it at sm too
      content: 'sm:max-w-lg',
      body: 'space-y-6',
      footer: 'flex flex-wrap gap-2',
    }"
  >
    <template #body>
      <template v-if="color">
        <div
          class="flex aspect-video w-full items-end justify-between gap-2 rounded-lg p-4 ring-1 ring-default ring-inset"
          :style="{ backgroundColor: color.hex }"
        >
          <span
            class="font-mono text-sm uppercase"
            :class="light ? 'text-black/70' : 'text-white/80'"
          >
            {{ color.hex }}
          </span>

          <UButton
            icon="hugeicons:copy-01"
            variant="ghost"
            aria-label="Copy hex"
            :class="light ? 'text-black/70' : 'text-white/80'"
            @click="copyHex"
          />
        </div>

        <SharedSpecList :items="specs" layout="rows" />

        <section class="space-y-3">
          <UPageHeader
            title="Used In"
            :as="detailSectionHeaderAs"
            :ui="detailSectionHeaderUi"
          />

          <div v-if="!color.keysets" class="space-y-2">
            <USkeleton v-for="row in 2" :key="row" class="h-12 w-full" />
          </div>

          <ul v-else-if="keysets.length" class="divide-y divide-default">
            <li v-for="keyset in keysets" :key="keyset.id">
              <ULink
                :to="`/keyset/${keyset.profile_keyset_id}`"
                class="group flex items-center gap-3 py-2.5"
              >
                <NuxtImg
                  :src="keyset.img || '/keyset.png'"
                  :alt="keyset.name"
                  preset="thumb"
                  loading="lazy"
                  decoding="async"
                  class="aspect-video w-20 shrink-0 rounded border border-default bg-elevated object-cover"
                />
                <span class="min-w-0">
                  <span
                    class="block truncate text-sm font-medium text-highlighted group-hover:text-primary"
                  >
                    {{ keyset.profile?.name }} {{ keyset.name }}
                  </span>
                  <span class="block truncate text-xs text-muted">
                    {{ keysetDates(keyset) }}
                  </span>
                </span>
              </ULink>
            </li>
          </ul>

          <p v-else class="text-sm text-muted">
            No keyset in the catalog uses this color yet.
          </p>
        </section>
      </template>

      <UEmpty
        v-else-if="status === 'error'"
        icon="hugeicons:paint-board"
        title="Color Not Found"
        description="This color is not in the catalog. It may have been removed."
      />
    </template>

    <template v-if="color && editable" #footer>
      <UButton
        icon="hugeicons:dashboard-circle-edit"
        label="Edit"
        :ui="{ label: 'block' }"
        @click="$emit('edit', color)"
      />
      <!-- A color a keyset uses cannot be deleted (keyset_colors restricts it) -->
      <UButton
        v-if="isAdmin && color.keysets && !color.keysets.length"
        icon="hugeicons:delete-02"
        label="Delete"
        color="error"
        variant="ghost"
        :ui="{ label: 'block' }"
        @click="$emit('delete', color)"
      />
    </template>
  </USlideover>
</template>

<script setup>
const props = defineProps({
  // The color's id, from the page's `?color=` query
  colorId: {
    type: Number,
    default: null,
  },
  // The swatch as the grid has it, shown while the full color loads
  preview: {
    type: Object,
    default: null,
  },
})

defineEmits(['edit', 'delete'])

const open = defineModel('open', { type: Boolean, default: false })

const userStore = useUserStore()
const { isAdmin } = storeToRefs(userStore)
const editable = computed(() => userStore.isEditable())

const toast = useToast()

// The key follows the id, so each color loads when it is opened
const { data, status, refresh } = useAsyncData(
  () => `keyset-color-${props.colorId}`,
  () =>
    props.colorId
      ? $fetch(`/api/colors/${props.colorId}`)
      : Promise.resolve(null),
)

const color = computed(() => {
  if (!props.colorId) return null

  return data.value?.id === props.colorId ? data.value : props.preview
})
const keysets = computed(() => color.value?.keysets || [])
const light = computed(() => isLightColor(color.value?.hex || ''))

const specs = computed(() => {
  const rgb = hexToRgb(color.value?.hex || '')

  return [
    { term: 'System', description: color.value?.system },
    { term: 'Code', description: color.value?.code },
    { term: 'Name', description: color.value?.name },
    { term: 'Hex', description: color.value?.hex?.toUpperCase() },
    { term: 'RGB', description: rgb?.join(', ') },
  ]
})

// The group buy window when there is one, else the interest check date
const keysetDates = (keyset) => {
  const range = formatDateRange(keyset.start_date, keyset.end_date)
  if (range) return range

  return keyset.ic_date ? `IC ${formatDate(keyset.ic_date)}` : keyset.status
}

const copyHex = async () => {
  try {
    await navigator.clipboard.writeText(color.value.hex)
    toast.add(noticeToast('copied'))
  } catch (error) {
    toast.add(errorToast(error))
  }
}

defineExpose({ refresh })
</script>
