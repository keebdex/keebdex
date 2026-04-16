import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createError } from 'h3'
import type {
  Database,
  TablesInsert,
  TablesUpdate,
} from '~/types/database.types'

type PublicTable = keyof Database['public']['Tables']

export type TableField<T extends PublicTable> = Extract<
  keyof TablesInsert<T> | keyof TablesUpdate<T>,
  string
>

function buildTableFieldMap(source: string) {
  const fieldsByTable: Partial<Record<PublicTable, string[]>> = {}
  const tablesBlockMatch = source.match(
    /Tables:\s*\{([\s\S]*?)\n\s*\}\n\s*Views:/,
  )

  if (!tablesBlockMatch) {
    return fieldsByTable as Record<PublicTable, readonly string[]>
  }

  let currentTable: PublicTable | null = null
  let currentSection: 'Insert' | 'Update' | null = null

  for (const line of (tablesBlockMatch[1] || '').split('\n')) {
    const tableMatch = line.match(/^\s{6}([a-z_][a-z0-9_]*): \{$/i)
    if (tableMatch) {
      currentTable = tableMatch[1] as PublicTable
      fieldsByTable[currentTable] = fieldsByTable[currentTable] || []
      currentSection = null
      continue
    }

    const sectionMatch = line.match(/^\s{8}(Insert|Update): \{$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1] as 'Insert' | 'Update'
      continue
    }

    if (currentSection && line.match(/^\s{8}\}$/)) {
      currentSection = null
      continue
    }

    if (currentSection && currentTable) {
      const fieldMatch = line.match(/^\s{10}([a-z_][a-z0-9_]*)\??:/i)
      const fieldName = fieldMatch?.[1]

      if (fieldName && !fieldsByTable[currentTable]?.includes(fieldName)) {
        fieldsByTable[currentTable]?.push(fieldName)
      }
    }
  }

  return fieldsByTable as Record<PublicTable, readonly string[]>
}

const databaseTypesSource = readFileSync(
  resolve(process.cwd(), 'app/types/database.types.ts'),
  'utf8',
)

const TABLE_FIELDS = buildTableFieldMap(databaseTypesSource)

function getAllowedTableFields<T extends PublicTable>(table: T) {
  const tableFields = TABLE_FIELDS[table] as
    | readonly TableField<T>[]
    | undefined

  if (!tableFields?.length) {
    throw createError({
      statusCode: 500,
      statusMessage: `No database field metadata found for ${table}`,
    })
  }

  return tableFields
}

export function pickTableFields<T extends PublicTable>(
  table: T,
  body: unknown,
) {
  const allowedFields = getAllowedTableFields(table)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must be an object',
    })
  }

  const payload = body as Record<string, unknown>

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) =>
        value !== undefined && allowedFields.includes(key as TableField<T>),
    ),
  ) as Partial<Record<TableField<T>, unknown>>
}
