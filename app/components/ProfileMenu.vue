<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UUser
      v-if="authenticated"
      :name="collapsed ? undefined : user.name"
      :description="collapsed ? undefined : roleLabel"
      :avatar="avatar"
      class="cursor-pointer w-full"
    >
      <!-- Supporters: a glowing ring and a heart on the avatar, and the badge
        in its own color after the role -->
      <template v-if="supporter" #avatar="{ ui }">
        <span class="relative inline-flex shrink-0">
          <span class="supporter-glow" />
          <UAvatar
            v-bind="avatar"
            :class="ui.avatar({ class: 'supporter-ring' })"
          />
          <span
            class="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-donator ring-2 ring-(--ui-bg)"
          >
            <UIcon :name="SUPPORTER_BADGE.filledIcon" class="size-2.5 text-white" />
          </span>
        </span>
      </template>

      <template v-if="supporter && !collapsed" #description>
        <span class="inline-flex items-center gap-1">
          <template v-if="roleOnlyLabel">{{ roleOnlyLabel }} ·</template>
          <span class="supporter-label font-medium">
            {{ SUPPORTER_BADGE.label }}
          </span>
        </span>
      </template>
    </UUser>
    <UButton
      v-else
      :label="collapsed ? undefined : 'Sign In'"
      icon="solar:login-2-line-duotone"
      :trailing-icon="
        collapsed ? undefined : 'solar:sort-vertical-line-duotone'
      "
      variant="ghost"
      block
      :ui="{ label: 'block' }"
    />

    <UModal v-model:open="visible">
      <template #content>
        <UPageCard>
          <ModalLogin />
        </UPageCard>
      </template>
    </UModal>
  </UDropdownMenu>
</template>

<script setup>
const { collapsed } = defineProps({
  collapsed: Boolean,
})

const userStore = useUserStore()
const { authenticated, user, role, supporter, isAdmin, isModerator } =
  storeToRefs(userStore)

const avatar = computed(() => userAvatar(user.value.picture, user.value.name))
const roleLabel = computed(() => userRoleLabel(role.value, supporter.value))
// Supporters' trigger draws the badge itself, after the role alone
const roleOnlyLabel = computed(() => userRoleLabel(role.value))

const client = useSupabaseClient()
const toast = useToast()

const { colorModeItems, paletteItems } = useThemeMenu()

// Keep the dropdown open so users can compare several options in a row.
const keepOpen = (items) =>
  items.map((item) => ({
    ...item,
    onSelect(e) {
      e.preventDefault()
      item.onSelect()
    },
  }))

const items = computed(() => {
  // Admin pages share one submenu so they don't lengthen the profile menu.
  const management = isAdmin.value
    ? {
        label: 'Management',
        icon: 'solar:widget-5-line-duotone',
        children: [
          {
            label: 'Users',
            icon: 'solar:users-group-two-rounded-line-duotone',
            to: '/admin/users',
          },
          {
            label: 'Announcements',
            icon: 'solar:bell-bing-line-duotone',
            to: '/admin/announcements',
          },
          {
            label: 'Feedback',
            icon: 'solar:chat-round-question-mark-line-duotone',
            to: '/admin/feedbacks',
          },
          {
            label: 'Shoutouts',
            icon: 'solar:quote-line-duotone',
            to: '/admin/shoutouts',
          },
        ],
      }
    : null

  // Light/dark mode and the palette in one submenu, a labeled group each,
  // named as on the Appearance settings page
  const appearance = {
    label: 'Appearance',
    icon: 'solar:palette-line-duotone',
    children: [
      [{ type: 'label', label: 'Theme' }, ...keepOpen(colorModeItems.value)],
      [{ type: 'label', label: 'Palette' }, ...keepOpen(paletteItems.value)],
    ],
  }

  // Staff tools: the revisions of the pages they manage, and for admins the
  // management pages
  const staff = [isModerator.value && RECENT_CHANGES_LINK, management].filter(
    Boolean,
  )

  // Rarely needed, so folded into one submenu (Feedback sits in the sidebar)
  const about = {
    label: 'About',
    icon: 'solar:info-square-line-duotone',
    children: ABOUT_LINKS,
  }

  return authenticated.value
    ? [
        [
          {
            type: 'label',
            label: user.value.name,
            // The role and Supporter badge, when the trigger shows only the avatar (phones and the
            // collapsed sidebar); otherwise the trigger already shows it
            description: collapsed ? roleLabel.value : undefined,
          },
        ],
        [
          {
            label: 'Settings',
            icon: 'solar:settings-line-duotone',
            to: '/account/settings',
          },
          appearance,
          about,
        ],
        ...(staff.length ? [staff] : []),
        [
          {
            label: 'Sign Out',
            icon: 'solar:logout-2-line-duotone',
            onSelect() {
              logout()
            },
          },
        ],
      ]
    : [
        [
          {
            label: 'Sign In',
            icon: 'solar:login-2-line-duotone',
            onSelect() {
              toggleShowLogin()
            },
          },
        ],
        [appearance, about],
      ]
})

const visible = ref(false)
const toggleShowLogin = () => {
  visible.value = !visible.value
}

const logout = async () => {
  const { error } = await client.auth.signOut()
  if (error) {
    toast.add(errorToast(error))
  } else {
    userStore.$reset()
    toast.add(noticeToast('signed_out'))

    navigateTo('/')
  }
}
</script>

<style scoped>
/* A ring of the Supporter color around the avatar, with a soft glow that
   pulses: only the glow's opacity animates, so the browser never repaints */
.supporter-ring {
  box-shadow: 0 0 0 2px var(--color-donator);
}

.supporter-glow {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  box-shadow: 0 0 10px 4px
    color-mix(in oklab, var(--color-donator) 55%, transparent);
  opacity: 0;
  animation: supporter-glow 2.4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes supporter-glow {
  50% {
    opacity: 1;
  }
}

/* The Supporter label shimmers once in a while */
.supporter-label {
  background: linear-gradient(
      100deg,
      var(--color-donator) 40%,
      color-mix(in oklab, var(--color-donator) 35%, white) 50%,
      var(--color-donator) 60%
    )
    0 0 / 250% 100%;
  background-clip: text;
  color: transparent;
  animation: supporter-shimmer 4s ease-in-out infinite;
}

@keyframes supporter-shimmer {
  0%,
  40% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .supporter-glow,
  .supporter-label {
    animation: none;
  }
}
</style>
