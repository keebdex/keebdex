# Changelog

## [Unreleased]

We're expanding beyond keysets and entering the **Keyboard Era** — with full support for keyboards, richer collection tracking, and a stronger foundation for everything ahead.

### ✨ What's New

- Introduced a new **Keyboard** module with support for **Brands**, **Keyboards**, **Releases**, and **Variants**, including built-in design lineage tracking and standardized technical hardware specifications.
- Enabled **collection management** for keyboards, letting users track which boards they own and how they relate to keysets and other items.
- Added a dedicated **User Management** page for managing user access and roles.

### 🐛 Bug Fixes

- None

### ⚠️ Breaking Changes

- Renamed the **Keycap** domain to **Keyset** across database schema/types, API paths, app routes/components, and related UI copy for consistent naming.

### 🚀 Improvements

- Migrated application-level enums to native PostgreSQL types to improve data accuracy and prevent mismatches between the code and database.
- Combined full-text search with partial matching to better handle incomplete or slightly misspelled queries (for example, searching "gundam" now finds "GUNDAMHAKU").
- Improved page headers by moving profile details into a drawer in the navbar across maker, brand, sculpt, and keyboard pages for a cleaner layout.
- Applied a shared logo card across all modules, and improved card layout consistency with equal-height grid.
- Added designer autocomplete in keyset form with suggestions from existing designers to prevent duplicate names with typo issues; new designers can still be added as free-text input.
