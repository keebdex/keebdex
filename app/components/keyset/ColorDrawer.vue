<template>
  <!-- One color in full: the swatch, its codes, and the keysets that use it,
       with Edit and Delete for staff where colors are managed (`manage`, the
       Colors page). One drawer serves a page: the Colors page, or a keyset's
       palette, which leaves its own keyset out (`exclude`). -->
  <USlideover
    v-model:open="open"
    :title="color ? `${color.system} ${color.code}` : 'Color'"
    :description="color?.name || undefined"
    :ui="{
      // Nuxt UI sets the width as sm:max-w-md, so override it at sm too
      content: 'sm:max-w-lg',
      wrapper: 'min-w-0 flex-1',
      body: 'space-y-6',
      close: 'static',
    }"
  >
    <!-- Edit and Delete beside the close button (kept in the row) -->
    <template v-if="color && manage && editable" #actions>
      <UTooltip text="Edit">
        <UButton
          icon="solar:pen-new-square-bold-duotone"
          variant="ghost"
          aria-label="Edit"
          @click="$emit('edit', color)"
        />
      </UTooltip>
      <!-- A color a keyset uses cannot be deleted (keyset_colors restricts it) -->
      <UTooltip
        v-if="isAdmin && color.keysets && !color.keysets.length"
        text="Delete"
      >
        <UButton
          icon="solar:trash-bin-minimalistic-bold-duotone"
          color="error"
          variant="ghost"
          aria-label="Delete"
          @click="$emit('delete', color)"
        />
      </UTooltip>
    </template>

    <template #body>
      <template v-if="color">
        <div
          class="flex aspect-video w-full items-end justify-between gap-2 rounded-lg p-4 ring-1 ring-default ring-inset"
          :style="{ backgroundColor: color.hex }"
        >
          <span
            class="font-mono text-sm uppercase"
            :class="contrastTextClass(color.hex)"
          >
            {{ color.hex }}
          </span>

          <UButton
            icon="solar:copy-bold-duotone"
            variant="ghost"
            aria-label="Copy hex"
            :class="contrastTextClass(color.hex)"
            @click="copyHex"
          />
        </div>

        <SharedSpecList :items="specs" layout="rows" />

        <section class="space-y-3">
          <UPageHeader
            :title="exclude ? 'Also Used In' : 'Used In'"
            :as="detailSectionHeaderAs"
            :ui="detailSectionHeaderUi"
          />

          <div v-if="!color.keysets" class="space-y-2">
            <USkeleton v-for="row in 2" :key="row" class="h-12 w-full" />
          </div>

          <!-- UPageList is role="list", so each row is its listitem; `relative`
               anchors the divider it draws under the row -->
          <UPageList v-else-if="keysets.length" divide>
            <div
              v-for="keyset in keysets"
              :key="keyset.id"
              role="listitem"
              class="relative"
            >
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
                  <span
                    v-if="keyset.dates"
                    class="block truncate text-xs text-muted"
                  >
                    {{ keyset.dates }}
                  </span>
                </span>
              </ULink>
            </div>
          </UPageList>

          <p v-else class="text-sm text-muted">
            {{
              exclude
                ? 'No other keyset in the catalog uses this color yet.'
                : 'No keyset in the catalog uses this color yet.'
            }}
          </p>
        </section>
      </template>

      <UEmpty
        v-else-if="status === 'error'"
        icon="solar:palette-bold-duotone"
        title="Color Not Found"
        description="This color is not in the catalog. It may have been removed."
      />
    </template>
  </USlideover>
</template>

<script setup>
const props = defineProps({
  // The color's id, from the page's `?color=` query (kept while closing)
  colorId: {
    type: Number,
    default: null,
  },
  // The swatch as the grid has it, shown while the full color loads
  preview: {
    type: Object,
    default: null,
  },
  // Show Edit and Delete to staff
  manage: Boolean,
  // A keyset's `profile_keyset_id` to leave out of the list (its own page)
  exclude: {
    type: String,
    default: '',
  },
})

defineEmits(['edit', 'delete'])

const open = defineModel('open', { type: Boolean, default: false })

const userStore = useUserStore()
const { isAdmin } = storeToRefs(userStore)
const editable = computed(() => userStore.isEditable())

const toast = useToast()

// The key follows the id, so each color loads when it is opened (in the
// browser only: the drawer opens there, and SSR would only store a null)
const { data, status } = useAsyncData(
  () => `keyset-color-${props.colorId}`,
  () =>
    props.colorId
      ? $fetch(`/api/colors/${props.colorId}`)
      : Promise.resolve(null),
  { server: false },
)

const color = computed(() =>
  data.value?.id === props.colorId ? data.value : props.preview,
)
const keysets = computed(() =>
  (color.value?.keysets || [])
    .filter((keyset) => keyset.profile_keyset_id !== props.exclude)
    .map((keyset) => ({ ...keyset, dates: keysetDateLabel(keyset) })),
)

const specs = computed(() => {
  const rgb = hexToRgb(color.value?.hex || '')

  return [
    { term: 'System', description: color.value?.system },
    { term: 'Code', description: color.value?.code },
    { term: 'Hex', description: color.value?.hex?.toUpperCase() },
    { term: 'RGB', description: rgb?.join(', ') },
  ]
})


const copyHex = async () => {
  try {
    await navigator.clipboard.writeText(color.value.hex)
    toast.add(noticeToast('copied'))
  } catch (error) {
    toast.add(errorToast(error))
  }
}

</script>
