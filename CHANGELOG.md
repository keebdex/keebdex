# Changelog

## [Unreleased]

### ✨ What's New

- Introduced a new **Keyboard** module to support **Brands**, **Keyboards**, **Releases**, and **Variants**, featuring built-in design lineage tracking and standardized technical hardware specifications.
- Enabled **ollection management** support for Keyboards, allowing users to track and catalog their personal hardware and builds.
- Added a dedicated **User Management** page for managing user access.

### 🐛 Bug Fixes

- None

### ⚠️ Breaking Changes

- Renamed the **Keycap** domain to **Keyset** across database schema/types, API paths, app routes/components, and related UI copy for consistent naming.

### 🚀 Improvements

- Combined full-text search with partial matching to better handle incomplete queries (e.g. searching "gundam" now finds "GUNDAMHAKU").
- Improved page headers by moving profile details into a drawer in the navbar across maker, brand, sculpt, and keyboard pages.
- Migrated application-level enums to native **PostgreSQL types** to ensure 100% data accuracy and eliminate mismatches between the code and database.
