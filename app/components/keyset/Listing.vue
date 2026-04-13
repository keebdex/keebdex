<template>
  <UDashboardPanel id="keyset-sets">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #right>
          <UModal v-model:visible="visible" title="Add Keyset">
            <UButton
              v-if="isAdmin"
              color="primary"
              icon="hugeicons:keyboard"
              label="Add"
            />

            <template #body="{ close }">
              <KeysetModalKeysetForm
                :metadata="formData"
                @on-success="
                  () => {
                    close()
                    $emit('update:keysets')
                  }
                "
              />
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid
        v-if="keysets.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-6 4xl:grid-cols-6 gap-4"
      >
        <UPageCard
          v-for="keyset in keysets"
          :key="keyset.id"
          :to="`/keyset/${keyset.profile_keyset_id}`"
          :title="
            keyset.profile
              ? `${keyset.profile?.name} ${keyset.name}`
              : keyset.name
          "
          :description="
            keyset.profile
              ? formatDateRange(keyset.start_date, keyset.end_date) || ''
              : keyset.description || ''
          "
          reverse
          spotlight
          :ui="{
            root: 'h-full flex flex-col',
            container: 'h-full grid grid-rows-[auto_minmax(0,1fr)]',
            // wrapper: 'h-full min-h-0 flex flex-col',
            // body: 'flex-1 min-h-0',
            footer: 'mt-auto',
            description: !keyset.profile && 'line-clamp-4',
          }"
        >
          <UBadge
            v-if="
              keyset.status === 'Cancelled' || keyset.status === 'Scheduled'
            "
            :label="keyset.status"
            :color="keysetStatusColors[keyset.status]"
            variant="solid"
            class="absolute top-6 right-6 z-20"
          />

          <NuxtImg
            loading="lazy"
            :alt="keyset.name"
            :src="keyset.img || keyset.render_img || '/keyset.png'"
            class="aspect-[16/9] w-full object-cover"
          />

          <template #footer>
            <SharedSaveToCollection
              v-if="authenticated"
              :item="keyset"
              category="keyset"
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
            'Currently, there are no keysets available. Check back soon for fresh additions!',
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
  title: {
    type: String,
    default: 'Keysets',
  },
  description: {
    type: String,
    default: '',
  },
  page: {
    type: Number,
    default: 1,
  },
  size: {
    type: Number,
    default: 10,
  },
  total: {
    type: Number,
    default: 0,
  },
  keysets: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()
const { manufacturers } = useKeysetProfiles()

const formData = computed(() => {
  const { profile: profile_id } = route.params

  return {
    profile_id: manufacturers.value[profile_id] && profile_id,
  }
})

defineEmits(['update:page', 'update:keysets'])

const userStore = useUserStore()
const { authenticated, isAdmin, user } = storeToRefs(userStore)
const toast = useToast()

const visible = ref(false)

const saveTo = (collection, keyset) => {
  const item = {
    uid: user.value.uid,
    collection_id: collection.id,
    keyset_item_id: keyset.profile_keyset_id,
  }

  $fetch(`/api/users/${user.value.uid}/collections/${collection.id}/items`, {
    method: 'post',
    body: item,
  })
    .then(() => {
      toast.add(handleSuccess('add', keyset.name, undefined, collection.name))
    })
    .catch((error) => {
      toast.add(handleError(error))
    })
}
</script>
