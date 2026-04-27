import { serverSupabaseClient } from '#supabase/server'
import type { TablesInsert } from '~/types/database.types'

type ColorInsert = Pick<
  TablesInsert<'colors'>,
  'system' | 'code' | 'name' | 'hex'
>

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function parseCsv(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine)
}

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

  const rawCsv = await file.text()
  const rows = parseCsv(rawCsv)
  const [headerRow, ...dataRows] = rows

  if (!headerRow) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CSV file is empty',
    })
  }

  const headers = headerRow.map((header) => header.toLowerCase())
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
