import { serverSupabaseClient } from '#supabase/server'
import Papa from 'papaparse'
import type { TablesInsert } from '~/types/database.types'

type ColorInsert = Pick<
  TablesInsert<'colors'>,
  'system' | 'code' | 'name' | 'hex'
>

const MAX_CSV_SIZE_BYTES = 2 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing CSV file',
    })
  }

  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please upload a valid CSV file',
    })
  }

  if (file.size > MAX_CSV_SIZE_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'CSV file is too large. Maximum size is 2MB.',
    })
  }

  const rawCsv = await file.text()

  const { data: rows, errors } = Papa.parse<string[]>(rawCsv, {
    skipEmptyLines: true,
  })

  if (errors.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `CSV parse error: ${errors[0]?.message ?? 'Unknown error'}`,
    })
  }

  const [headerRow, ...dataRows] = rows

  if (!headerRow?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CSV file is empty',
    })
  }

  const headers = headerRow.map((h) => h.toLowerCase().trim())
  const requiredHeaders = ['system', 'code', 'hex']

  for (const requiredHeader of requiredHeaders) {
    if (!headers.includes(requiredHeader)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required header: ${requiredHeader}`,
      })
    }
  }

  const records: ColorInsert[] = dataRows.map((row, rowIndex) => {
    const getCell = (key: string) => row[headers.indexOf(key)]?.trim() || ''

    const record = {
      system: getCell('system'),
      code: getCell('code'),
      name: getCell('name') || null,
      hex: getCell('hex').toLowerCase(),
    }

    if (!record.system || !record.code || !record.hex) {
      throw createError({
        statusCode: 400,
        statusMessage: `Row ${rowIndex + 2} is missing required values`,
      })
    }

    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(record.hex)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Row ${rowIndex + 2} has invalid hex value`,
      })
    }

    return pickTableFields('colors', record) as ColorInsert
  })

  if (!records.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CSV has no data rows to import',
    })
  }

  const { data, error } = await client
    .from('colors')
    .upsert(records, {
      onConflict: 'system,code',
      ignoreDuplicates: true,
    })
    .select()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    inserted: data?.length || 0,
  }
})
