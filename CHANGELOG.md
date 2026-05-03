# Changelog

## [Unreleased]

### ✨ What's New

- Added brand guidelines page at `/brand` with logo variants, favicon mark, color palette, typography scale, and usage do's & don'ts.
- Rebranded accent color from rose to teal (`teal-500` light / `teal-400` dark) across the wordmark, app icon, and the following Nuxt UI theme color assignments: `primary: teal`, `secondary: violet`, `success: emerald`, `info: sky`, `error: red`, `warning: amber`.
- Added CSV color import with preview and a matching system filter for narrowing results.
- Added RAL code auto-fill support to fetch hex and name automatically, with a manual refetch action for supported systems.
- Added admin feedback management so feedback can be reviewed, resolved, and turned into shoutouts more easily.
- Added public shoutouts page at `/shoutouts` so users can browse community feedback and stories about Keebdex.
- Added admin shoutouts management at `/admin/shoutouts` with controls to manage featured shoutouts and feedback conversions.

### 🐛 Bug Fixes

- Prevented duplicate color entries via conflict handling and fixed unsafe CSV header parsing for malformed files.

### 🚀 Improvements

- Enhanced color creation with code suggestions, duplicate hints, and helper text for display name.
- Introduced `useGuardedSearch` and `useAdvancedSearch` composables to centralize API search logic across form components, with consistent minimum term length handling, filtering, and pagination support.
