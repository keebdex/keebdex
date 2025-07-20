<template>
  <UDashboardPanel id="artisan-makers" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Artisan Makers">
        <template #right>
          <UModal v-if="isAdmin" v-model:visible="visible" title="Add Maker">
            <UButton color="primary" icon="hugeicons:user-add-02">
              Add
            </UButton>

            <template #body>
              <ModalMakerForm @on-success="toggleAddMaker" />
            </template>
          </UModal>

          <UModal
            v-if="authenticated"
            v-model:visible="customize"
            title="Customize Pins"
            description="Pin up to 6 makers to the top for easy access."
          >
            <UButton icon="hugeicons:pin" color="secondary"> Pins </UButton>

            <template #body>
              <ModalPinMaker
                :makers="favoriteMakers.concat(otherMakers)"
                @on-success="toggleCustomizePins"
              />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageHeader
        v-if="authenticated && favoriteMakers.length"
        headline="Pinned"
        :ui="{
          root: 'pt-0',
          headline: 'text-lg text-color',
        }"
      >
        <UPageGrid>
          <MakerCard
            v-for="maker in favoriteMakers"
            :key="maker.id"
            :maker="maker"
          />
        </UPageGrid>
      </UPageHeader>

      <UPageGrid>
        <MakerCard
          v-for="maker in otherMakers"
          :key="maker.id"
          :maker="maker"
        />
      </UPageGrid>
    </template>
  </UDashboardPanel>
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

// const showAll = ref(false)
// const rowsPerPage = computed(() => {
//   if (showAll.value) {
//     return otherMakers.value.length
//   } else {
//     return authenticated.value && favoriteMakers.value.length ? 54 : 60
//   }
// })
</script>
