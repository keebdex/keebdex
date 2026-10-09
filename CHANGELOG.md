# Changelog

## [Unreleased]

### ✨ What's New

- Searches with many artisan colorway matches now offer a _View all_ link to a new **colorway search page** that updates as you type, with exact-term matching, grouping by maker, and _Save to Collection_.

### 🐛 Bug Fixes

- Keyset pages with no kits now still show the set's details instead of an empty page.
- Paging past the last page of a keyset list now shows an empty page instead of a server error.

### 🚀 Improvements

- Artisan colorways in the search palette are now a single list with the closest name matches first, instead of nested groups by maker.
- Colorway search now matches the colorway's own name (every word you type) and hides deleted colorways; makers and sculpts keep their own result groups.
- **About** and **Changelog** moved from the sidebar into the profile menu.
- The **Keysets** sidebar now leads with the catalog: the Keysets home (`/keyset`) is now a catalog of manufacturers grouped by profile, group buy stages share one _Group Buys_ page with Interest Check / Live / Ended tabs, and _Color Swatches_ is now _Colors_. Old `/keyset?status=…` links redirect to the matching tab.
- **Keyset pages** now read like a catalog entry: a fixed cover instead of an autoplay carousel, set details kept apart from group buy history, a grid of kits you can click to enlarge, a full-width color palette, and a _Save_ button.
- The _Save_ button is now available to every signed-in user, with a _New Collection_ option (its category fixed to the item's) to start a collection right from the item.
- Dark logos now invert reliably in dark mode, including when the color mode follows the system setting.
