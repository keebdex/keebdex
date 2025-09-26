<template>
  <UDashboardPanel id="keycap-sets">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #right>
          <UModal v-model:visible="visible" title="Add Keycap">
            <UButton v-if="isAdmin" color="primary" icon="hugeicons:keyboard">
              Add
            </UButton>

            <template #body="{ close }">
              <ModalKeycapForm
                :metadata="query"
                @on-success="
                  () => {
                    close()
                    $emit('update:keycaps')
                  }
                "
              />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- <UPageHeader :title="title">
        <template #description>
          <PageHeaderDescription :description="description" />
        </template>
      </UPageHeader> -->

      <UPageGrid
        v-if="keycaps.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 gap-4"
      >
        <UPageCard
          v-for="keycap in keycaps"
          :key="keycap.id"
          :to="`/keycap/${keycap.profile_keycap_id}`"
          :title="
            keycap.profile
              ? `${keycap.profile?.name} ${keycap.name}`
              : keycap.name
          "
          :description="
            keycap.profile
              ? formatDateRange(keycap.start_date, keycap.end_date)
              : keycap.description || '\u00A0'
          "
          :icon="statusIconMap[keycap.status]"
          reverse
          spotlight
          :ui="{
            leadingIcon: 'text-info',
            /**
             * applied to card descriptions to normalize card height
             * and ensure titles align across grid items
             */
            description: !keycap.profile && 'line-clamp-4 min-h-[5rem]',
          }"
        >
          <NuxtImg
            loading="lazy"
            :alt="keycap.name"
            :src="keycap.img || keycap.render_img"
            class="aspect-[16/9] w-full object-cover"
          />

          <template #footer>
            <SaveToCollection
              v-if="authenticated"
              :item="keycap"
              category="keycap"
              label="Save"
              class="z-10"
              @on-select="saveTo"
            />
          </template>
        </UPageCard>
      </UPageGrid>
      <UError
        v-else
        :error="{
          statusCode: 404,
          statusMessage: 'Not Found',
          message:
            'Currently, there are no keycaps available. Check back soon for fresh additions!',
        }"
      />

      <UPagination
        v-if="total > size"
        :page="page"
        :items-per-page="size"
        :total="total"
        class="border-t border-default pt-4 mt-auto"
        :ui="{
          list: 'justify-center',
        }"
        @update:page="$emit('update:page', $event)"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  page: Number,
  size: Number,
  total: Number,
  keycaps: Array,
})

defineEmits(['update:page', 'update:keycaps'])

const userStore = useUserStore()
const { authenticated, isAdmin, user } = storeToRefs(userStore)
const toast = useToast()

const statusIconMap = {
  Live: 'hugeicons:live-streaming-01',
  Scheduled: 'hugeicons:appointment-01',
  'In Production': 'hugeicons:product-loading',
  Shipping: 'hugeicons:shipping-truck-01',
}

const visible = ref(false)

const saveTo = (collection, keycap) => {
  const item = {
    uid: user.value.uid,
    collection_id: collection.id,
    keycap_item_id: keycap.profile_keycap_id,
  }

  $fetch(`/api/users/${user.value.uid}/collections/${collection.id}/items`, {
    method: 'post',
    body: item,
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: `${keycap.name} has been added to ${collection.name}.`,
      })
    })
    .catch((error) => {
      toast.add({
        color: 'error',
        title: 'Oops! Something went wrong',
        description: error.message,
      })
    })
}
</script>
