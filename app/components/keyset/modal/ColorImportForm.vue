<template>
  <UModal
    v-model:visible="visible"
    title="Import Colors"
    :ui="{
      body: 'space-y-4',
    }"
  >
    <UButton icon="hugeicons:file-import" label="Import" />

    <template #body>
      <p class="text-sm text-muted">
        Upload a CSV file with headers:
        <strong>system, code, hex</strong> and optional <strong>name</strong>
        (max 2MB)
      </p>

      <UFileUpload
        v-model="importFile"
        accept=".csv,text/csv"
        icon="hugeicons:file-attachment"
        layout="list"
        label="Click to browse or drag & drop a CSV file"
      />

      <div v-if="preview.headers.length" class="space-y-2">
        <UTable :data="preview.rows" :columns="preview.columns" />
        <p class="text-xs text-muted">
          Showing {{ preview.rows.length }} of {{ preview.total }} data rows
        </p>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" @click="close" />
      <UButton
        label="Import"
        icon="hugeicons:file-import"
        :loading="isImporting"
        @click="importColors(close)"
      />
    </template>
  </UModal>
</template>

<script setup>
import Papa from 'papaparse'

const emit = defineEmits(['onSuccess'])

const toast = useToast()

const visible = ref(false)
const importFile = ref(null)
const isImporting = ref(false)

const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024

const preview = ref({ headers: [], columns: [], rows: [], total: 0 })

watch(importFile, async (val) => {
  const file = getSingleFile(val)
  preview.value = { headers: [], columns: [], rows: [], total: 0 }

  if (!file) return

  if (file.size > MAX_CSV_SIZE_BYTES) {
    toast.add(
      handleError({
        statusCode: 413,
        statusMessage: 'CSV file is too large. Maximum size is 2MB.',
      }),
    )
    importFile.value = null
    return
  }

  const text = await file.text()
  const { data: rows, errors } = Papa.parse(text, {
    skipEmptyLines: true,
  })

  if (errors.length) {
    toast.add(
      handleError({
        statusCode: 400,
        statusMessage: `CSV preview parse error: ${errors[0]?.message ?? 'Unknown error'}`,
      }),
    )
    return
  }

  const [headerRow, ...dataRows] = rows

  if (!headerRow?.length || !dataRows.length) return

  const headers = headerRow.map((h) => h?.toString().trim() || '')

  preview.value = {
    headers,
    columns: headers.map((h) => ({ accessorKey: h, header: h })),
    rows: dataRows
      .slice(0, 10)
      .map((row) =>
        Object.fromEntries(headers.map((h, i) => [h, row?.[i] ?? ''])),
      ),
    total: dataRows.length,
  }
})

const getSingleFile = (file) => {
  if (!file) return null
  if (Array.isArray(file)) return file[0] || null
  return file
}

const importColors = async (close) => {
  const file = getSingleFile(importFile.value)

  if (!file) {
    toast.add(
      handleError({
        statusCode: 400,
        statusMessage: 'Please select a CSV file before importing.',
      }),
    )
    return
  }

  if (file.size > MAX_CSV_SIZE_BYTES) {
    toast.add(
      handleError({
        statusCode: 413,
        statusMessage: 'CSV file is too large. Maximum size is 2MB.',
      }),
    )
    return
  }

  const formData = new FormData()
  formData.append('file', file, file.name)

  isImporting.value = true

  await $fetch('/api/colors/import', {
    method: 'post',
    body: formData,
  })
    .then((result) => {
      toast.add(handleSuccess('add', `${result?.inserted || 0} colors`))
      importFile.value = null
      preview.value = { headers: [], columns: [], rows: [], total: 0 }
      close()
      emit('onSuccess')
    })
    .catch((error) => {
      toast.add(handleError(error, { showOriginalMessage: true }))
    })
    .finally(() => {
      isImporting.value = false
    })
}
</script>
