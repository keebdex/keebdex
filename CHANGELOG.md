# Changelog

## [Unreleased]

### ✨ What's New

- Introduced a new **Keyboard** module to support **Brands**, **Keyboards**, **Releases**, and **Variants**, featuring built-in design lineage tracking and standardized technical hardware specifications.
- Enabled **collection management** support for Keyboards, allowing users to track and catalog their personal hardware and builds.

### 🐛 Bug Fixes

- None

### ⚠️ Breaking Changes

<!-- - Standardized artisan-related table names using the `artisan_*` prefix for more consistent and predictable schema design. -->

### 🚀 Improvements

- Combined full-text search with partial matching to better handle incomplete queries (e.g. searching "gundam" now finds "GUNDAMHAKU").
- Migrated application-level enums to native **PostgreSQL types** to ensure 100% data accuracy and eliminate mismatches between the code and database.
