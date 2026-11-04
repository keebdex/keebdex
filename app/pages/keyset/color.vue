<template>
  <UDashboardPanel id="keyset-color">
    <template #header>
      <UDashboardNavbar title="Keysets" />

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageHeader
        title="Color Swatches"
        description="Every color keycaps are matched to, from GMK and SP codes to Pantone and RAL. Open a swatch for its values and the keysets that use it."
        :ui="listingPageHeaderUi"
      >
        <template v-if="editable" #links>
          <UButton
            color="primary"
            icon="solar:pipette-bold-duotone"
            label="Add Color"
            @click="openForm()"
          />
          <KeysetModalColorImportForm @on-success="refresh" />
        </template>
      </UPageHeader>

      <section class="space-y-6 pt-4">
        <UInput
          v-model="term"
          icon="solar:magnifer-bold-duotone"
          :placeholder="`Search ${systemLabel} by code or name`"
          aria-label="Search colors"
          :loading="pending"
          class="w-full sm:max-w-sm"
        />

        <div
          v-if="colors.length"
          :class="colorSwatchGridClass"
        >
          <KeysetColorTile
            v-for="color in colors"
            :key="color.id"
            :color="color"
            @select="selectColor"
          />
        </div>

        <!-- A first load, before any swatch has come back -->
        <div
          v-else-if="pending"
          :class="colorSwatchGridClass"
        >
          <div v-for="cell in 12" :key="cell" class="space-y-2">
            <USkeleton class="aspect-4/3 w-full rounded-lg" />
            <USkeleton class="h-4 w-2/3" />
          </div>
        </div>

        <UEmpty
          v-else
          icon="solar:palette-bold-duotone"
          title="No Matching Colors"
          :description="
            debouncedTerm
              ? `Nothing in ${systemLabel} matches “${debouncedTerm}”. Try a code such as N9 or a name such as Red.`
              : `No ${systemLabel} colors have been added yet.`
          "
          :actions="
            debouncedTerm
              ? [
                  {
                    label: 'Clear Search',
                    icon: 'solar:close-bold-duotone',
                    onClick: () => (term = ''),
                    ui: { label: 'block' },
                  },
                ]
              : undefined
          "
        />

        <UPagination
          v-if="data.count > size"
          :page="page"
          :items-per-page="size"
          :total="data.count"
          class="border-t border-default pt-4"
          :ui="{
            list: 'justify-center',
          }"
          @update:page="setPage"
        />
      </section>

      <KeysetColorDrawer
        v-model:open="drawerOpen"
        :color-id="selectedId"
        manage
        :preview="colors.find((color) => color.id === selectedId)"
        @edit="openForm"
        @delete="removeColor"
      />

      <UModal
        v-if="editable"
        v-model:open="formOpen"
        :title="editing?.id ? 'Edit Color' : 'Add Color'"
      >
        <template #body>
          <KeysetModalColorForm
            :is-edit="!!editing?.id"
            :metadata="editing"
            @on-success="onSaved"
          />
        </template>
      </UModal>

      <SharedConfirmModal
        v-model:open="deleteTarget.open"
        :title="`Delete ${deleteTarget.entity}`"
        :description="`Are you sure you want to delete ${deleteTarget.entity.toLowerCase()} '${deleteTarget.name}'? This action cannot be undone.`"
        confirm-label="Delete"
        :loading="deleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
import { refDebounced } from '@vueuse/core'
import { Constants } from '~/types/database.types'

const route = useRoute()

const userStore = useUserStore()
const editable = computed(() => userStore.isEditable())

const SYSTEMS = Constants.public.Enums.keyset_color_matching_system

// The matching system is a tab in the URL (`?system=GMK`), like the group
// buy tabs; any other value shows every system
const system = computed(() =>
  SYSTEMS.includes(route.query.system) ? route.query.system : undefined,
)
const systemLabel = computed(() => system.value || 'all colors')

const links = computed(() => [
  {
    label: 'All',
    to: { path: route.path },
    active: !system.value,
  },
  ...SYSTEMS.map((value) => ({
    label: value,
    to: { path: route.path, query: { system: value } },
    active: system.value === value,
  })),
])

// 48 fills whole rows at two, three, four, and six columns
const { page, size, setPage, resetPage } = usePagination(48)

const term = ref('')
const debouncedTerm = refDebounced(
  computed(() => term.value.trim()),
  300,
)

const { data, status, refresh } = useAdvancedSearch('/api/colors', {
  key: 'keyset-colors',
  term: debouncedTerm,
  minLength: 0,
  pagination: { page, size },
  filters: { system, usage: '1' },
})

const colors = computed(() => data.value?.data || [])
const pending = computed(() => status.value === 'pending')

watch(debouncedTerm, resetPage)

// The open color is in the URL too (`?color=<id>`), so a swatch can be linked
const {
  id: selectedId,
  open: drawerOpen,
  select: selectColor,
} = useQuerySelection('color')

const formOpen = ref(false)
const editing = ref({})

const openForm = (color = {}) => {
  editing.value = { ...color }
  formOpen.value = true
}

const onSaved = () => {
  formOpen.value = false
  refresh()
  if (editing.value.id) refreshNuxtData(`keyset-color-${editing.value.id}`)
}

const {
  target: deleteTarget,
  deleting,
  open: openDelete,
  confirm: confirmDelete,
} = useConfirmDelete(() => {
  selectColor(null)
  refresh()
})

const removeColor = (color) => {
  openDelete(
    'Color',
    `${color.system} ${color.code}`,
    `/api/colors/${color.id}`,
  )
}

useSeoMeta({
  title: 'Color Swatches',
  description:
    'Browse keycap colors from GMK, SP, Pantone, and RAL, with hex values and the keysets that use each one.',
})
</script>
