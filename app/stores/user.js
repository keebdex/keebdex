import { sortBy } from 'es-toolkit/compat'
import { defineStore } from 'pinia'
import { canManageAnyAssignment, canManageAssignment } from '~/utils/permissions'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: {},
    role: null,
    // users.supporter: the Supporter badge, independent of the role
    supporter: false,
    assignments: null,
    collections: [],
    // users.pins: per catalog (`artisan`, `keyboard`), each pinned maker or
    // brand mapped to its pinned sculpts or keyboards
    pins: {},
    social: {},
    leaderboardHidden: false,
    appearance: {},
    appearanceLoaded: false,
    appearanceSaveTimer: null,
  }),
  getters: {
    authenticated: (state) => state.user && state.user.email_verified,
    isAdmin: (state) => state.role === 'admin',
    isModerator: (state) => canManageAnyAssignment(state),
    pinnedMakers: (state) => state.pins.artisan || {},
    pinnedBrands: (state) => state.pins.keyboard || {},
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
          this.pins = {}
          this.role = null
          this.supporter = false
          this.assignments = []
          this.appearance = {}
          this.appearanceLoaded = true
          return
        }

        this.pins = data.pins || {}

        this.social = {
          discord: data.discord || this.social.discord,
          reddit: data.reddit,
          qq: data.qq,
        }

        this.leaderboardHidden = !!data.leaderboard_hidden
        this.role = data.role
        this.supporter = !!data.supporter
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
    async savePins(pins) {
      await $fetch(`/api/users/${this.user.uid}`, {
        method: 'post',
        body: { pins },
      })

      this.pins = pins
    },
    // A catalog's pinned makers or brands, keeping each one's pinned children
    savePinnedOwners(module, ids) {
      const current = this.pins[module] || {}

      return this.savePins({
        ...this.pins,
        [module]: Object.fromEntries(ids.map((id) => [id, current[id] || []])),
      })
    },
    // A pinned maker's sculpts or a pinned brand's keyboards
    savePinnedChildren(module, owner, ids) {
      return this.savePins({
        ...this.pins,
        [module]: { ...this.pins[module], [owner]: ids },
      })
    },
    isEditable(page) {
      return canManageAssignment(this, page)
    },
  },
})
