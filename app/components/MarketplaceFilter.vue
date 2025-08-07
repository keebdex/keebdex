<template>
  <Panel header="Filter" pt:root:class="h-full" pt:header:class="text-xl">
    <div class="flex flex-col gap-4">
      <AutoComplete
        v-model="searchText"
        :suggestions="dataSources"
        fluid
        option-label="title"
        option-group-label="title"
        option-group-children="options"
        @option-select="onSelect"
        @complete="handleSearch"
      >
      </AutoComplete>

      <div class="flex flex-col gap-2">
        <label>Type</label>
        <SelectButton
          v-model="marketplaceCfg.type"
          option-label="label"
          option-value="value"
          :options="tradeTypeOptions"
        />
      </div>
      <div class="flex flex-col gap-2">
        <label>Maker</label>
        <InputText v-model="marketplaceCfg.maker_name" disabled />
      </div>
      <div class="flex flex-col gap-2">
        <label>Sculpt</label>
        <InputText v-model="marketplaceCfg.sculpt_name" disabled />
      </div>
      <div class="flex flex-col gap-2">
        <label>Colorway</label>
        <InputText v-model="marketplaceCfg.colorway_name" disabled />
      </div>
      <div class="flex flex-col gap-2">
        <Button
          label="Clear"
          icon="pi pi-eraser"
          severity="primary"
          @click="onClearFilter"
        />
      </div>
    </div>
  </Panel>
</template>

<script setup>
const marketplaceCfg = useState('marketplace-config', () => ({
  type: 'any',
}))

const tradeTypeOptions = [
  { label: 'Any', value: 'any' },
  { label: 'Buying', value: 'to_buy' },
  { label: 'Selling', value: 'for_sale' },
]

const searchText = ref('')
const dataSources = ref([])

const handleSearch = async ({ query }) => {
  const { data } = await useAsyncData(() =>
    $fetch('/api/search', { params: { query } }),
  )

  dataSources.value = data.value.data
}

const onSelect = async (option) => {
  searchText.value = ''
  dataSources.value = []

  const { title, value, ...rest } = option.value

  marketplaceCfg.value = {
    type: marketplaceCfg.value.type,
    ...rest,
  }
}

const onClearFilter = () => {
  marketplaceCfg.value = {
    type: 'any',
  }
}
</script>
