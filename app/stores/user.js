import sortBy from 'lodash.sortby'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: {},
    role: null,
    assignments: null,
    collections: [],
    favorites: [],
    social: {},
  }),
  getters: {
    authenticated: (state) => state.user && state.user.email_verified,
    isAdmin: (state) => state.role === 'admin',
  },
  actions: {
    setCurrentUser(authUser) {
      const {
        app_metadata: { providers },
        id: uid,
        user_metadata: { email, email_verified, picture, name },
        identities,
      } = authUser

      this.user = {
        uid,
        email,
        email_verified,
        name,
        picture,
        providers,
      }

      const discord = identities.find((i) => i.provider === 'discord')
      if (discord) {
        this.social.discord = discord.name
      }

      this.fetchUserPreferences(uid)
      this.fetchUserCollections(uid)
    },
    async fetchUserPreferences(uid) {
      try {
        const { data } = await $fetch(`/api/users/${uid}`)

        if (!data) {
          this.favorites = []
          this.role = null
          this.assignments = []
          return
        }

        this.favorites = data.favorite_makers || []

        this.social = {
          discord: data.discord || this.social.discord,
          reddit: data.reddit,
          qq: data.qq,
        }

        this.role = data.role
        this.assignments = data.assignments
      } catch (error) {
        console.error('fetch user error', uid, error)
      }
    },
    async fetchUserCollections(uid) {
      try {
        const collections = await $fetch(`/api/users/${uid}/collections`)
        this.collections = sortBy(collections, 'name')
      } catch (error) {
        console.error('fetch collections error', uid, error)
      }
    },
    isEditable(page) {
      const { role, assignments, isAdmin } = this
      return (
        isAdmin ||
        (role === 'editor' && (!assignments || assignments?.includes(page))) ||
        (role === 'maker' && assignments?.includes(page)) ||
        role === 'designer'
      )
    },
  },
})
