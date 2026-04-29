import type { Database } from '~/types/database.types'

type AdminGuardUserResponse = {
  data?: Pick<Database['public']['Tables']['users']['Row'], 'role'> | null
}

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo('/')
  }

  const userStore = useUserStore()

  if (userStore.isAdmin) {
    return
  }

  try {
    const response = await $fetch<AdminGuardUserResponse>(
      `/api/users/${user.value.id}`,
    )

    if (response?.data?.role !== 'admin') {
      return navigateTo('/account/settings')
    }
  } catch {
    return navigateTo('/account/settings')
  }
})
