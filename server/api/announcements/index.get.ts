import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

/**
 * Live announcements for the caller, highest priority first. RLS returns only
 * live rows and hides audience `mods` from non-staff; guests get `all` and
 * `guest`, signed-in users everything but `guest`. Signed-in users also get
 * their id, their dismissed keys, and whether announcement toasts are on.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  const now = new Date().toISOString()

  let request = client
    .from('announcements')
    .select(ANNOUNCEMENT_FIELDS)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt."${now}"`)
    .order('priority', { ascending: false })
    .order('starts_at', { ascending: false })

  request = user
    ? request.neq('audience', 'guest')
    : request.in('audience', ['all', 'guest'])

  if (!user) {
    const { data, error } = await request

    if (error) {
      throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return {
      data: data || [],
      signedIn: false,
      userId: null,
      dismissed: [],
      toasts: true,
    }
  }

  const [announcements, dismissals, preference] = await Promise.all([
    request,
    client.from('announcement_dismissals').select('announcement_key'),
    client
      .from('notification_preferences')
      .select('enabled')
      .eq('preference', ANNOUNCEMENT_TOASTS_PREFERENCE)
      .maybeSingle(),
  ])

  const error =
    announcements.error || dismissals.error || preference.error

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    data: announcements.data || [],
    signedIn: true,
    userId: user.sub,
    dismissed: (dismissals.data || []).map((row) => row.announcement_key),
    toasts: preference.data?.enabled ?? true,
  }
})
