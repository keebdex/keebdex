<template>
  <UDashboardPanel id="artisan-makers">
    <template #header>
      <UDashboardNavbar title="Artisan Makers">
        <template #right>
          <UModal v-if="isAdmin" v-model:visible="visible" title="Add Maker">
            <UButton color="primary" icon="hugeicons:user-add-02">
              Add
            </UButton>

            <template #body="{ close }">
              <ModalMakerForm
                @on-success="
                  () => {
                    close()
                    refresh()
                  }
                "
              />
            </template>
          </UModal>

          <UModal
            v-if="authenticated"
            v-model:visible="customize"
            title="Customize Pins"
            description="Pin up to 6 makers to the top for easy access."
          >
            <UButton icon="hugeicons:pin" color="secondary"> Pins </UButton>

            <template #body="{ close }">
              <ModalPinMaker
                :makers="favoriteMakers.concat(otherMakers)"
                @on-success="close"
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
          headline: 'text-md',
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
const customize = ref(false)

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
