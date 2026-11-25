import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getActorProfile } from '../../../../utils/admin'
import { MODERATION_FIELDS } from '../../../../utils/child-submissions'
import {
  candidateId,
  candidatesTable,
  getCandidate,
} from '../../../../utils/ingest'
import { urlSlugify } from '~/utils/slug'
import { canManageAssignment } from '~/utils/permissions'

type KeysetRow = { id: number; profile_keyset_id: string }

const fail = (error: { message: string } | null) => {
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

/**
 * Approves a discovered keyset with what staff checked in the approve wizard
 * (`{ keyset, kits }`, see `useIngestApproveWizard`):
 *   - no `match_key`: inserts the keyset and its kits Approved, verified by
 *     the caller, with no submitter (like the keysets the syncs add);
 *   - `match_key`: updates that keyset with the changed columns only (never
 *     its profile; its slug only with its name), updates each kit that names
 *     a listed kit by `id`, and inserts the others Approved.
 * Then marks the candidate promoted. Thread images are stored as their URLs;
 * the image sync copies them to Cloudflare Images.
 */
export default defineEventHandler(async (event) => {
  const id = candidateId(getRouterParam(event, 'id'))
  const { client, user, profile } = await getActorProfile(event)
  const body = await readBody(event)
  const candidate = await getCandidate(client, id)

  if (candidate.module !== 'Keyset') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only keysets can be approved here.',
    })
  }

  if (candidate.state !== 'new') {
    throw createError({
      statusCode: 409,
      statusMessage: 'This keyset was already reviewed; reload to see it.',
    })
  }

  if (!Array.isArray(body?.kits) || body.kits.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid kits' })
  }

  const kits = body.kits.map((kit: unknown) =>
    pickTableFields('keyset_kits', kit, [
      'profile_keyset_id',
      ...MODERATION_FIELDS,
    ]),
  )

  if (kits.some((kit: Record<string, unknown>) => !kit.kit_id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pick the kit of every card.',
    })
  }

  const verified = {
    review_status: 'Approved' as const,
    verified_by: user.sub,
    verified_at: new Date().toISOString(),
    submitted_by: null,
  }

  let keyset: KeysetRow

  if (candidate.match_key) {
    if (!canManageAssignment(profile, candidate.match_key)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const changes: Record<string, unknown> = pickTableFields(
      'keysets',
      body?.keyset || {},
      ['id', 'profile_keyset_id', 'profile_id', 'slug', ...MODERATION_FIELDS],
    )

    // The slug is the page key: it follows a new name, never the old one.
    if (changes.name) changes.slug = urlSlugify(String(changes.name))

    const { data, error } = Object.keys(changes).length
      ? await client
          .from('keysets')
          .update(changes)
          .eq('profile_keyset_id', candidate.match_key)
          .select('id, profile_keyset_id')
      : await client
          .from('keysets')
          .select('id, profile_keyset_id')
          .eq('profile_keyset_id', candidate.match_key)

    if (error) {
      throw createError(
        error.code === '23505'
          ? {
              statusCode: 409,
              statusMessage: 'Keebdex already has a keyset with this name.',
            }
          : { statusCode: 500, statusMessage: error.message },
      )
    }

    if (!data?.length) {
      throw createError({
        statusCode: 404,
        statusMessage: `Keebdex no longer has ${candidate.match_key}.`,
      })
    }

    keyset = data[0] as KeysetRow
  } else {
    const fields = pickTableFields('keysets', body?.keyset || {}, [
      'id',
      'profile_keyset_id',
      'slug',
      ...MODERATION_FIELDS,
    ])

    if (!fields.name || !fields.profile_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing keyset name or profile',
      })
    }

    const slug = urlSlugify(String(fields.name))

    if (!canManageAssignment(profile, `${fields.profile_id}/${slug}`)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const { data, error } = await client
      .from('keysets')
      .insert({ ...fields, slug, ...verified } as any)
      .select('id, profile_keyset_id')
      .single()

    if (error) {
      throw createError(
        error.code === '23505'
          ? {
              statusCode: 409,
              statusMessage:
                'Keebdex already has this keyset; dismiss this one or approve the matched page.',
            }
          : { statusCode: 500, statusMessage: error.message },
      )
    }

    keyset = data as KeysetRow
  }

  const listed = kits.filter((kit: Record<string, unknown>) => kit.id)
  const added = kits.filter((kit: Record<string, unknown>) => !kit.id)

  try {
    for (const { id: kitId, ...kit } of listed) {
      const { data, error } = await client
        .from('keyset_kits')
        .update(kit)
        .eq('id', kitId as number)
        .eq('profile_keyset_id', keyset.profile_keyset_id)
        .select('id')

      fail(error)

      if (!data?.length) {
        throw createError({
          statusCode: 404,
          statusMessage: `${keyset.profile_keyset_id} no longer lists kit #${kitId}.`,
        })
      }
    }

    if (added.length) {
      const { error } = await client.from('keyset_kits').insert(
        added.map((kit: Record<string, unknown>) => ({
          ...kit,
          profile_keyset_id: keyset.profile_keyset_id,
          ...verified,
        })) as any,
      )

      fail(error)
    }

    const { error: promoteError } = await candidatesTable(client)
      .update({
        state: 'promoted',
        promoted_kind: 'keyset',
        promoted_id: keyset.id,
      })
      .eq('id', id)
      .eq('state', 'new')

    fail(promoteError)
  } catch (error) {
    // A new keyset goes with its kits or not at all, so approving again
    // starts clean; a matched keyset keeps what was already saved.
    // Kits do not cascade with their keyset.
    if (!candidate.match_key) {
      await client
        .from('keyset_kits')
        .delete()
        .eq('profile_keyset_id', keyset.profile_keyset_id)
      await client.from('keysets').delete().eq('id', keyset.id)
    }

    throw error
  }

  return keyset
})
