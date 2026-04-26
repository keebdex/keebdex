# Changelog

## [Unreleased]

We're expanding beyond keysets and entering the **Keyboard Era** — with full support for keyboards, richer collection tracking, and a stronger foundation for everything ahead.

### ✨ What's New

- Introduced a new **Keyboard** module with support for **Brands**, **Keyboards**, **Releases**, and **Variants**, including design lineage tracking and standardized technical specifications.
- Enabled **keyboard collection management**, allowing users to track the boards they own and how they relate to keysets and other items.
- Added a dedicated **User Management** page for managing user access and roles.
- Added designer autocomplete to the keyset form, with suggestions from existing designers while still allowing free-text input.
- Added collection editing and revision autocomplete to the artisan sculpt form.
- Redesigned the Keebdex logo with a new wordmark using the Dosis typeface (bold/extrabold weight), replacing the previous image-based logo.

### 🐛 Bug Fixes

- Fixed artisan sculpt page not jumping to the correct pagination page when `cid` is present in the query string; the colorway card modal now opens automatically on load and closes cleanly.
- Fixed default values in the keyset form for smoother create/edit flow.

### ⚠️ Breaking Changes

- Renamed the **Keycap** domain to **Keyset** across database schema/types, API paths, app routes/components, and related UI copy for consistent naming.

### 🚀 Improvements

- Redesigned the keyset detail page with an archivist-inspired aesthetic and added a thumbnail strip for kit navigation.
- Redesigned the collection share flow with a private/public radio group; Copy Link auto-publishes if needed, and visibility is no longer duplicated in the Edit Collection form.
- Migrated application-level enums to native PostgreSQL types to improve data accuracy and prevent mismatches between the code and database.
- Hardened POST API payload handling with shared database-based field filtering so only schema-defined fields are accepted and persisted.
- Combined full-text search with partial matching to better handle incomplete or slightly misspelled queries; for example, searching "gundam" now finds "GUNDAMHAKU".
- Improved page headers by moving profile details into a drawer in the navbar across maker, brand, sculpt, and keyboard pages for a cleaner layout.
- Applied a shared logo card across all modules and improved card layout consistency with an equal-height grid.
- Extracted `useCollectionItem` and `useCollection` as shared composables to centralize collection operations across collection pages.
- Improved the artisan wishlist builder with configurable column layouts and content-width preview sizing for more consistent card layouts.
