<template>
  <Panel
    header="Artisan Makers"
    pt:root:class="!border-0 !bg-transparent"
    pt:title:class="flex items-center gap-4 font-medium text-3xl"
    pt:header-actions:class="flex gap-2"
  >
    <template #icons>
      <Button
        v-if="isAdmin"
        label="Add"
        icon="pi pi-user-plus"
        @click="toggleAddMaker"
      />

      <Button
        v-if="authenticated"
        icon="pi pi-sliders-v"
        label="Pins"
        severity="secondary"
        @click="toggleCustomizePins"
      />
    </template>

    <div
      v-if="authenticated && favoriteMakers.length"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
    >
      <MakerCard
        v-for="maker in favoriteMakers"
        :key="maker.id"
        :maker="maker"
      />
    </div>

    <DataView
      :value="otherMakers"
      layout="grid"
      paginator
      :rows="rowsPerPage"
      :total-records="otherMakers.length"
      :always-show-paginator="false"
      :pt="{
        header: '!bg-transparent !border-0 text-lg font-medium',
        content: '!bg-transparent',
        pcPaginator: {
          paginatorContainer: '!border-0 pt-4',
          root: '!bg-transparent',
        },
      }"
    >
      <template v-if="Object.keys(favorites).length" #header>
        <div class="flex items-center justify-between">
          Other Makers

          <ToggleButton
            v-model="showAll"
            size="small"
            off-label="Show All"
            off-icon="pi pi-angle-double-down"
            on-label="Paginate"
            on-icon="pi pi-angle-double-up"
          />
        </div>
      </template>
      <template #grid="{ items }">
        <div
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
        >
          <MakerCard v-for="maker in items" :key="maker.id" :maker="maker" />
        </div>
      </template>
    </DataView>

    <Dialog
      v-model:visible="visible"
      modal
      header="Add Maker"
      class="w-[36rem]"
      dismissable-mask
    >
      <ModalMakerForm @on-success="toggleAddMaker" />
    </Dialog>

    <Dialog
      v-model:visible="customize"
      modal
      header="Pins"
      class="w-[36rem]"
      dismissable-mask
    >
      <ModalPinMaker
        :makers="favoriteMakers.concat(otherMakers)"
        @on-success="toggleCustomizePins"
      />
    </Dialog>
  </Panel>
</template>

<script setup>
useSeoMeta({
  title: 'Artisan Makers',
})

const { data, refresh } = await useAsyncData('artisan-makers', () =>
  $fetch('/api/makers'),
)

const userStore = useUserStore()
const { authenticated, isAdmin, favorites } = storeToRefs(userStore)

const visible = ref(false)
const toggleAddMaker = (shouldRefresh) => {
  visible.value = !visible.value
  if (shouldRefresh) {
    refresh()
  }
}

const customize = ref(false)
const toggleCustomizePins = () => {
  customize.value = !customize.value
}

const favoriteMakers = computed(() => {
  return data.value.filter((m) => Object.keys(favorites.value).includes(m.id))
})

const otherMakers = computed(() => {
  return data.value.filter((m) => !Object.keys(favorites.value).includes(m.id))
})

const showAll = ref(false)
const rowsPerPage = computed(() => {
  if (showAll.value) {
    return otherMakers.value.length
  } else {
    return authenticated.value && favoriteMakers.value.length ? 54 : 60
  }
})
</script>
