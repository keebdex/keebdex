import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getActorProfile } from '../../../utils/admin'
import {
  candidateId,
  candidatesTable,
  getCandidate,
} from '../../../utils/ingest'
import { DISMISS_REASONS, type DismissReason } from '~/utils/ingest'
import { canManageAnyAssignment } from '~/utils/permissions'

const NEWER_WAITING =
  'A newer reading of this thread is waiting for review; review that one instead.'

/**
 * Dismisses a waiting discovered keyset (`{ action: 'dismiss', note? }`) or
 * restores a dismissed one (`{ action: 'restore' }`). RLS limits it to the
 * staff who can read the candidate, and `guard_candidate()` allows only
 * these moves and stamps who and when.
 */
export default defineEventHandler(async (event) => {
  const id = candidateId(getRouterParam(event, 'id'))
  const { client, profile } = await getActorProfile(event)

  if (!canManageAnyAssignment(profile)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const action = body?.action

  if (action !== 'dismiss' && action !== 'restore') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
  }

  const note =
    action === 'dismiss' && typeof body?.note === 'string'
      ? body.note.trim() || null
      : null

  if (note && !DISMISS_REASONS.includes(note as DismissReason)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid dismiss reason.',
    })
  }

  const candidate = await getCandidate(client, id)
  const from = action === 'dismiss' ? 'new' : 'dismissed'

  if (candidate.state !== from) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This keyset was already reviewed; reload to see it.',
    })
  }

  // Only one candidate of a thread waits at a time (candidates_one_new_idx).
  if (action === 'restore') {
    const { count, error } = await candidatesTable(client)
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', candidate.thread_id)
      .eq('module', candidate.module)
      .eq('state', 'new')

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    if (count) {
      throw createError({ statusCode: 409, statusMessage: NEWER_WAITING })
    }
  }

  const { data, error } = await candidatesTable(client)
    .update(
      action === 'dismiss'
        ? { state: 'dismissed', review_note: note }
        : { state: 'new', review_note: null },
    )
    .eq('id', id)
    .eq('state', from)
    .select('id, state')

  if (error) {
    throw createError(
      error.code === '23505'
        ? { statusCode: 409, statusMessage: NEWER_WAITING }
        : { statusCode: 500, statusMessage: error.message },
    )
  }

  // RLS filters rows silently, so an empty result means it was refused.
  if (!data?.length) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This keyset was already reviewed; reload to see it.',
    })
  }

  return data[0]
})
