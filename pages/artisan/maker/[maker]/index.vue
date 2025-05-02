<template>
  <div>
    <PanelBreadcrumb :breadcrumbs="breadcrumbs" />

    <Panel v-if="maker" pt:root:class="!border-0 !bg-transparent">
      <template #header>
        <div class="flex items-center gap-4 font-medium text-3xl">
          <Avatar
            :image="`/logo/${maker.id}.png`"
            :class="{
              invert: maker.invertible_logo && $colorMode.value === 'dark',
            }"
            size="large"
            pt:image:class="object-contain"
          />
          {{ maker.name }}
          <i
            v-if="maker.verified"
            v-tooltip="'Verified'"
            class="pi pi-verified text-lg text-[#22c55e] dark:text-[#4ade80]"
          />
        </div>
      </template>

      <div v-if="maker.bio" class="mb-4 leading-6 text-muted-color">
        <p v-for="(line, idx) in maker.bio.split('\n')" :key="idx" class="mb-2">
          {{ line }}
        </p>
      </div>

      <template #icons>
        <MakerProfileActions
          :maker="maker"
          @on-edit-maker="toggleEditMaker"
          @on-add-sale="toggleAddSale"
          @on-customize-pins="toggleCustomizePins"
        />
      </template>

      <div
        v-if="authenticated && favoriteSculpts.length"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
      >
        <SculptCard
          v-for="sculpt in favoriteSculpts"
          :key="sculpt.id"
          :sculpt="sculpt"
        />
      </div>

      <DataView
        :value="otherSculpts"
        layout="grid"
        paginator
        :rows="authenticated && Object.keys(favSculpts).length ? 54 : 60"
        :total-records="otherSculpts.length"
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
        <template v-if="favSculpts.length" #header> Other Sculpts </template>
        <template #grid="{ items }">
          <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4"
          >
            <SculptCard
              v-for="sculpt in items"
              :key="sculpt.id"
              :sculpt="sculpt"
            />
          </div>
        </template>
      </DataView>

      <Dialog
        v-model:visible="visible.edit"
        modal
        header="Edit Maker"
        class="w-[36rem]"
        dismissable-mask
      >
        <ModalMakerForm
          :is-edit="true"
          :metadata="maker"
          @on-success="toggleEditMaker"
        />
      </Dialog>

      <Dialog
        v-model:visible="visible.add_sale"
        modal
        header="Add Upcoming Sale"
        class="w-[36rem]"
        dismissable-mask
      >
        <ModalSaleForm
          :is-edit="true"
          :metadata="sculptLst"
          @on-success="toggleAddSale"
        />
      </Dialog>

      <Dialog
        v-model:visible="visible.customize_pins"
        modal
        header="Customize Your Pins"
        class="w-[36rem]"
        dismissable-mask
      >
        <ModalPinSculpt
          :sculpts="favoriteSculpts.concat(otherSculpts)"
          @on-success="toggleCustomizePins"
        />
      </Dialog>
    </Panel>
    <BackToArtisanMakers v-else />
  </div>
</template>

<script setup>
const route = useRoute()
const userStore = useUserStore()
const { authenticated, favorites } = storeToRefs(userStore)

const visible = ref({
  edit: false,
  add_sale: false,
  customize_pins: false,
})

const { data: maker, refresh } = await useAsyncData(
  `maker:${route.params.maker}`,
  () => $fetch(`/api/makers/${route.params.maker}`),
  {
    watch: [() => route.params.maker],
  },
)

const sculpts = Object.values(maker.value.sculpts)
const favSculpts = computed(() => favorites.value[route.params.maker] || [])
const favoriteSculpts = computed(() => {
  return sculpts.filter((s) => favSculpts.value.includes(s.sculpt_id))
})
const otherSculpts = computed(() => {
  return sculpts.filter((s) => !favSculpts.value.includes(s.sculpt_id))
})

const breadcrumbs = computed(() => {
  return [
    {
      icon: 'pi pi-home',
      route: '/',
    },
    {
      label: 'Makers',
      route: '/artisan/maker',
    },
  ]
})

useSeoMeta({
  title: maker.value?.name,
  description: maker.value?.bio,
  ogDescription: maker.value?.bio,
  twitterDescription: maker.value?.bio,
})

defineOgImageComponent('Artisan', {
  makerId: maker.value?.id,
  invertible: maker.value?.invertible_logo,
})

const toggleEditMaker = (shouldRefresh) => {
  visible.value.edit = !visible.value.edit
  if (shouldRefresh) {
    refresh()
  }
}

const toggleAddSale = () => {
  visible.value.add_sale = !visible.value.add_sale
}

const toggleCustomizePins = () => {
  visible.value.customize_pins = !visible.value.customize_pins
}

const sculptLst = computed(() => {
  return maker && maker.value.sculpts
    ? Object.entries(maker.value.sculpts).reduce((out, [sculptId, sculpt]) => {
        out[sculptId] = sculpt.name
        return out
      }, {})
    : {}
})
</script>
