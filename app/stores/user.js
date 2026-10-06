/* eslint-disable @typescript-eslint/no-unused-vars */
import sortBy from 'lodash.sortby'
import { defineStore } from 'pinia'
import { canManageAnyAssignment, canManageAssignment } from '~/utils/permissions'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: {},
    role: null,
    assignments: null,
    collections: [],
    favorites: [],
    social: {},
    appearance: {},
    appearanceLoaded: false,
    appearanceSaveTimer: null,
  }),
  getters: {
    authenticated: (state) => state.user && state.user.email_verified,
    isAdmin: (state) => state.role === 'admin',
    isModerator: (state) => canManageAnyAssignment(state),
  },
  actions: {
    setCurrentUser(authUser) {
      if (this.appearanceSaveTimer) {
        clearTimeout(this.appearanceSaveTimer)
        this.appearanceSaveTimer = null
      }

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

      this.appearance = {}
      this.appearanceLoaded = false

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

        if (this.user.uid !== uid) return

        if (!data) {
          this.favorites = []
          this.role = null
          this.assignments = []
          this.appearance = {}
          this.appearanceLoaded = true
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
        this.appearance =
          data.appearance &&
            typeof data.appearance === 'object' &&
            !Array.isArray(data.appearance)
            ? data.appearance
            : {}
        this.appearanceLoaded = true
      } catch (error) {
        console.error('fetch user error', uid, error)
      }
    },
    saveAppearance(patch) {
      this.appearance = {
        ...this.appearance,
        ...patch,
      }

      if (!this.user.uid) return

      if (this.appearanceSaveTimer) {
        clearTimeout(this.appearanceSaveTimer)
      }

      this.appearanceSaveTimer = setTimeout(async () => {
        this.appearanceSaveTimer = null
        if (!this.user.uid || !this.appearanceLoaded) return

        try {
          await $fetch(`/api/users/${this.user.uid}/appearance`, {
            method: 'patch',
            body: {
              theme: this.appearance.theme,
              colorMode: this.appearance.colorMode,
            },
          })
        } catch (error) {
          console.error('save appearance error', this.user.uid, error)
        }
      }, 500)
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
      return canManageAssignment(this, page)
    },
  },
})
