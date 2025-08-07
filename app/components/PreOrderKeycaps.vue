<template>
  <Fieldset pt:legend:class="w-auto">
    <template #legend>
      <div class="flex items-center gap-2">
        <span class="pi pi-megaphone" />
        <span class="font-semibold"> Pre-Order Keycaps </span>
      </div>
    </template>
    <DataView
      :value="keycaps"
      paginator
      :rows="5"
      :total-records="keycaps.length"
      :always-show-paginator="false"
    >
      <template #list="{ items }">
        <div
          v-for="(keycap, index) in items"
          :key="index"
          :class="{
            'border-t border-zinc-100 dark:border-zinc-700': index !== 0,
          }"
        >
          <nuxt-link :to="`/keycap/${keycap.profile_keycap_id}`">
            <div class="flex items-center">
              <Avatar
                :image="`/logo/${keycap.profile_id}.png`"
                size="large"
                :class="{ invert: $colorMode.value === 'dark' }"
                pt:image:class="object-contain"
              />
              <Card class="!shadow-none">
                <template #title>
                  {{ `${keycap.profile.name} ${keycap.name}` }}
                </template>
                <template #content>
                  {{ formatDateRange(keycap.start_date, keycap.end_date) }}
                </template>
              </Card>
            </div>
          </nuxt-link>
        </div>
      </template>
    </DataView>
  </Fieldset>
</template>

<script setup>
const { keycaps } = defineProps({
  keycaps: {
    type: Object,
    default: () => ({}),
  },
})
</script>
