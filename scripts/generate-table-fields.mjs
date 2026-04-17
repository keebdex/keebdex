import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const inputPath = resolve(process.cwd(), 'app/types/database.types.ts')
const outputPath = resolve(process.cwd(), 'server/utils/table-fields.generated.ts')

function buildTableFieldMap(source) {
    const fieldsByTable = {}
    const tablesBlockMatch = source.match(/Tables:\s*\{([\s\S]*?)\n\s*\}\n\s*Views:/)

    if (!tablesBlockMatch) {
        throw new Error('Could not find Tables block in database types file')
    }

    let currentTable = null
    let currentSection = null

    for (const line of (tablesBlockMatch[1] || '').split('\n')) {
        const tableMatch = line.match(/^\s{6}([a-z_][a-z0-9_]*)\s*:\s*\{$/i)
        if (tableMatch) {
            currentTable = tableMatch[1]
            fieldsByTable[currentTable] = fieldsByTable[currentTable] || []
            currentSection = null
            continue
        }

        const sectionMatch = line.match(/^\s{8}(Insert|Update):\s*\{$/)
        if (sectionMatch) {
            currentSection = sectionMatch[1]
            continue
        }

        if (currentSection && /^\s{8}\}$/.test(line)) {
            currentSection = null
            continue
        }

        if (currentSection && currentTable) {
            const fieldMatch = line.match(/^\s{10}([a-z_][a-z0-9_]*)\??:/i)
            const fieldName = fieldMatch?.[1]

            if (fieldName && !fieldsByTable[currentTable].includes(fieldName)) {
                fieldsByTable[currentTable].push(fieldName)
            }
        }
    }

    return Object.fromEntries(
        Object.entries(fieldsByTable).sort(([a], [b]) => a.localeCompare(b)),
    )
}

const databaseTypesSource = readFileSync(inputPath, 'utf8')
const tableFields = buildTableFieldMap(databaseTypesSource)

const output = `import type { Database, TablesInsert, TablesUpdate } from '~/types/database.types'

type PublicTable = keyof Database['public']['Tables']

type TableField<T extends PublicTable> = Extract<
  keyof TablesInsert<T> | keyof TablesUpdate<T>,
  string
>

export const TABLE_FIELDS = ${JSON.stringify(tableFields, null, 2)} satisfies {
  [K in PublicTable]: readonly TableField<K>[]
}
`

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, output)

console.log(`Updated ${outputPath}`)
