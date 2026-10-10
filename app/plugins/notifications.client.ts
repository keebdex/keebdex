import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AppNotification } from '~/utils/notifications'

/**
 * Starts notifications for the signed-in user: loads the newest ones and the
 * unread count, subscribes to realtime inserts/updates of their rows (RLS
 * keeps other users' rows out), and refreshes when the tab becomes visible
 * again. Signing out or switching accounts drops the channel and the state.
 */
export default defineNuxtPlugin(() => {
  const client = useSupabaseClient()
  const userStore = useUserStore()
  const notifications = useNotifications()

  let channel: RealtimeChannel | null = null
  let currentUid: string | null = null

  const stop = () => {
    if (channel) client.removeChannel(channel)
    channel = null
  }

  const start = (uid: string) => {
    const filter = `user_id=eq.${uid}`

    channel = client
      .channel(`notifications:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter },
        ({ new: row }) => notifications.receive(row as AppNotification),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter },
        ({ new: row }) => notifications.sync(row as AppNotification),
      )
      .subscribe()

    notifications.load()
  }

  watch(
    () => (userStore.authenticated ? userStore.user.uid : null),
    (uid) => {
      if (uid === currentUid) return

      stop()
      notifications.reset()
      currentUid = uid || null

      if (uid) start(uid)
    },
    { immediate: true },
  )

  // Realtime can drop while the tab sleeps; catch up when it is back.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUid) {
      notifications.load()
    }
  })
})
