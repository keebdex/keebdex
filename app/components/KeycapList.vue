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

      <UPageColumns v-if="keycaps.length">
        <UPageCard
          v-for="keycap in keycaps"
          :key="keycap.id"
          v-bind="keycap"
          :to="`/keycap/${keycap.profile_keycap_id}`"
          :title="
            keycap.profile
              ? `${keycap.profile?.name} ${keycap.name}`
              : keycap.name
          "
          reverse
          spotlight
        >
          <NuxtImg
            loading="lazy"
            :alt="keycap.name"
            :src="keycap.img || keycap.render_img"
            class="w-full h-full object-cover"
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
      </UPageColumns>
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
