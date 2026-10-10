# Changelog

## [Unreleased]

### ✨ What's New

- **Notifications**: you now get notified when a moderator approves or rejects one of your submissions. A _Notifications_ item in the sidebar shows your unread count, toasts appear as reviews happen, and the _Notifications_ page lists everything by day with All / Unread views, read/unread toggles, and _Mark all as read_.
- New **Notification settings** under Account Settings let you choose which notifications you get, e.g. only rejections for your submissions.
- Moderators now write a short note (up to 280 characters) when rejecting a submission, and the submitter reads it in the notification.
- Searches with many artisan colorway matches now offer a _View all_ link to a new **colorway search page** that updates as you type, with exact-term matching, grouping by maker, and _Save to Collection_.

### 🐛 Bug Fixes

- Keyset pages with no kits now still show the set's details instead of an empty page.
- Paging past the last page of a keyset list now shows an empty page instead of a server error.
- Keyset profile pages no longer show _Not Found_ when opened directly, and their title now names the manufacturer and profile (e.g. _GMK CYL Keysets_).

### 🚀 Improvements

- Status colors now match each theme's palette instead of bright default red, green, and blue: error in Carbon, EVA-01, Parchment, and Taro, and success and info in Analog Dreams, Carbon, EVA-01, Parchment, and Taro (where success and info were also hard to tell apart).
- Artisan colorways in the search palette are now a single list with the closest name matches first, instead of nested groups by maker.
- Colorway search now matches the colorway's own name (every word you type) and hides deleted colorways; makers and sculpts keep their own result groups.
- **About** and **Changelog** moved from the sidebar into the profile menu.
- The **Keysets** sidebar now leads with the catalog: the Keysets home (`/keyset`) is now a catalog of manufacturers grouped by profile, group buy stages share one _Group Buys_ page with Interest Check / Live / Ended tabs, and _Color Swatches_ is now _Colors_. Old `/keyset?status=…` links redirect to the matching tab.
- **Keyset pages** now read like a catalog entry: a fixed cover instead of an autoplay carousel, set details kept apart from group buy history, Geekhack / Order Graph / Order History icon links beside the title, a grid of kits you can click to enlarge, a full-width color palette, and a _Save_ button. Each kit card shows its group buy price beside the name and its unit count below it, and sets without a usable cover image spread their details across the page instead.
- The _Save_ button is now available to every signed-in user, with a _New Collection_ option (its category fixed to the item's) to start a collection right from the item.
- Dark logos now invert reliably in dark mode, including when the color mode follows the system setting.
