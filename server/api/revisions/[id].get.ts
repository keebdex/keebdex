import { createError, defineEventHandler, getRouterParam } from 'h3'
import {
  REVISION_COLUMNS,
  getRevisionRecord,
  parseRevisionId,
  requireRevisionStaff,
  revisionBefore,
  revisionsTable,
  withRevisionActors,
} from '../../utils/revisions'

/**
 * One revision with its snapshot, the record before it (`before`), and the
 * record as it is now (`current`, null once deleted), so the history can
 * compare the revision with either.
 */
export default defineEventHandler(async (event) => {
  const { client } = await requireRevisionStaff(event)
  const id = parseRevisionId(getRouterParam(event, 'id'))

  const { data, error } = await revisionsTable(client)
    .select(`${REVISION_COLUMNS}, snapshot`)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Revision not found' })
  }

  const [[revision], current] = await Promise.all([
    withRevisionActors(client, [data]),
    getRevisionRecord(client, data.entity_type, data.entity_id),
  ])

  return {
    ...revision,
    before: revisionBefore(data),
    current,
  }
})
