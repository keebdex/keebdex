<template>
  <AutoComplete
    v-model="searchText"
    v-focustrap
    :suggestions="dataSources"
    fluid
    option-label="title"
    option-group-label="title"
    option-group-children="options"
    placeholder="What are you looking for today?"
    @option-select="onSelect"
    @complete="handleSearch"
  >
  </AutoComplete>
</template>

<script setup>
const emit = defineEmits(['onSuccess'])

const searchText = ref('')
const dataSources = ref([])

const handleSearch = async ({ query }) => {
  const { data } = await useAsyncData(() =>
    $fetch('/api/search', { params: { query } }),
  )

  dataSources.value = data.value.data
}

const router = useRouter()
const onSelect = async (option) => {
  searchText.value = ''
  dataSources.value = []

  emit('onSuccess', true)

  router.push(option.value.value)
}
</script>
