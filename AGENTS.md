# Keebdex Agent Instructions

This is the canonical instruction file for every AI coding agent working in this repository (Claude Code, OpenAI Codex, Cursor, GitHub Copilot, and others). Keep it as the single source of truth: `CLAUDE.md` imports it, and `.github/copilot-instructions.md` points here. Update this file instead of creating agent-specific copies.

## Project Overview

Keebdex is a Nuxt 4 application for keyboard collectors. It uses Vue 3, TypeScript, Nuxt UI, Tailwind CSS, Pinia, Nuxt Nitro/H3, and Supabase PostgreSQL.

Use Bun for local commands. The repository contains a `bun.lock` file.

## Quick Start for Agents

1. Read this file, then the task plan in `.ai/plan/` if one applies.
2. Locate the closest existing pattern (same domain, same kind of file) and follow it before inventing a new one.
3. Keep the diff focused. Do not refactor unrelated code or touch generated files.
4. Verify with the narrowest relevant check first (see "Formatting and Validation"), and report only the checks that actually ran.
5. Do not commit, branch, or open a PR unless the user asks (see "Git and Documentation").

## Important Commands

- `bun run dev`: start the Nuxt development server. The `predev` hook generates database field metadata first.
- `bun run build`: build for production. The `prebuild` hook generates database field metadata first.
- `bun run generate`: generate the static site; this also runs the metadata generation hook.
- `bun run generate:table-fields`: regenerate `server/utils/table-fields.generated.ts` from the database types.
- `bunx eslint .`: run ESLint. Use `bunx eslint . --fix` for automatic fixes; there is currently no `lint` script in `package.json`.
- `bun run preview`: preview a production build.

There is no test script or test suite currently defined in `package.json`. Do not claim tests passed unless a relevant check was actually run.

## Repository Layout

- `app/pages/`: Nuxt file-based pages and routes.
- `app/components/`: Vue components, organized by domain (`artisan`, `keyboard`, `keyset`, `collection`, `brand`, `shared`, and `modal`).
- `app/composables/`: reusable reactive application logic.
- `app/stores/`: Pinia stores, including the user store.
- `app/middleware/`: route guards such as authentication and admin access.
- `app/types/database.types.ts`: generated Supabase database types; treat this as generated source and do not edit it manually.
- `app/utils/`: client-side helpers and utilities.
- `app/utils/theme-presets/`: theme preset system with registry, type definitions, and preset configs (see `index.ts` for the registered presets).
- `app/composables/useAppTheme.ts`: reactive theme management with cookie persistence.
- `app/composables/useSyncAppearance.ts`: synchronizes the signed-in user's appearance preferences with the profile API and refreshes them when the tab becomes visible.
- `app/plugins/theme.ts`: runtime theme application engine; merges preset UI config into `appConfig`, generates CSS, and handles font variables.
- `server/api/`: Nitro/H3 file-based API handlers. The filename suffix defines the HTTP method, such as `.get.ts`, `.post.ts`, `.patch.ts`, or `.delete.ts`.
- `server/utils/`: server-side database, authorization, grouping, and response helpers.
- `scripts/`: repository maintenance scripts, including table-field metadata generation.
- `supabase/`: Supabase project configuration and database-related files (gitignored; not tracked in this repo).
- `public/`: static assets.
- `.ai/plan/`: task plan files (Markdown) written for agents; see "Plans, PR Notes, and Keeping Instructions Current". `.ai/` is gitignored, so these files exist only in the working copy where they were written.
- `.ai/pr/`: pull request notes (title and summary), one file per executed plan (also gitignored).
- `.github/`: GitHub metadata (`FUNDING.yml`) and the Copilot pointer file. Agent instructions live in this file, not here.

Preserve Nuxt file-based routing paths when moving or renaming pages and API handlers.

## Vue and Nuxt Conventions

- Follow the existing Vue 3 Composition API style with `<script setup>`.
- Keep Vue single-file component blocks in this order: `<template>`, then `<script setup>` (or `<script>` when required), then `<style>`.
- Use TypeScript for new application code unless the surrounding file is intentionally JavaScript.
- Keep components in PascalCase. Keep variables and functions in camelCase. Use snake_case for database identifiers.
- Keep domain-specific components in their existing domain folders; put genuinely reusable components in `app/components/shared/`.
- Prefer existing Nuxt UI components and the established slots/configuration over custom replacements.
- Use `NuxtImg` for optimized images where appropriate.
- Follow the existing mobile-first Tailwind styling and the design tokens in `app/app.config.ts` and `app/assets/main.css`.
- Use the centralized icon names configured in `app/app.config.ts` rather than introducing arbitrary icon sets.

## Theme Preset System

- Presets are stored in `app/utils/theme-presets/` and registered in `index.ts`. Each preset exports a `ThemePreset` object defining `id`, `label`, `icon`, `font`, `ui` (Nuxt UI config), and `css` (semantic token overrides).
- The CSS shape supports `root`, `html`, `body`, and `headings` blocks plus `light`/`dark` mode variants. The `presetToCss()` function serializes these into inline style blocks injected at runtime via the theme plugin.
- `useAppTheme()` composable persists the selected theme to a cookie (`app-theme`) and provides `themeId`, `preset`, `presets`, and `setTheme(id)` for reactive switching.
- The theme plugin (`app/plugins/theme.ts`) watches the preset and applies its UI overrides to `appConfig`, merging font/color/variant defaults while preserving the app's base icon pack and component config. Font variables from the preset are applied as CSS custom properties and referenced by Nuxt Fonts configuration.
- `useAppTheme()` resolves ids through `findPreset()`, so an unknown or removed id falls back to `DEFAULT_THEME_ID`. Apply themes only through `setTheme(id)`; both the Appearance settings tab and the profile menu (`ProfileMenu.vue`) switch themes with `setTheme` and color mode with `useColorMode().preference` (`system | light | dark`), so new theme or color-mode behavior should hook into those two values rather than into each component.
- Theme switching does not reload the page; the selected theme is persisted in the `app-theme` cookie. Color mode uses `useColorMode().preference` and is persisted in a cookie through `colorMode.storage`.
- Signed-in appearance preferences are stored in `public.users.appearance` as a JSON object with optional `theme` and `colorMode` keys. `app.vue` invokes `useSyncAppearance()` once; it applies server values after `GET /api/users/:id`, seeds the server from local preferences when empty, and refreshes on tab visibility. Changes are saved by `userStore.saveAppearance()` through `PATCH /api/users/:id/appearance` with a 500 ms debounce. The endpoint validates both fields and merges into the existing JSON object. Store `system` as the preference, not a resolved light/dark value.
- When adding a new preset: create a `.ts` file in `theme-presets/`, export a `ThemePreset` satisfying the interface, register it in `index.ts`, and ensure `presetToCss()` generates valid CSS for all your root/headings/light/dark blocks.

## Form Architecture

- New entity forms must follow the Atomic Form + Composite Wrapper pattern: atomic forms own the field UI for one entity and accept `mode: 'standalone' | 'embedded'` with a default of `'standalone'`.
- In `standalone` mode, atomic forms may wrap themselves in `UForm`, render their own Submit/Cancel actions, and perform direct admin/edit API saves. In `embedded` mode, they must expose state through `v-model`/`update:modelValue`, hide their standalone actions, and let the parent composite own validation, navigation, and submit actions.
- Each domain's `SubmissionWizard.vue` is the composite wrapper for both create and review (`mode: 'create' | 'review'`). It owns navigation and actions; its paired `use*SubmissionWizard` composable owns hydration, validation, and API orchestration. Do not reintroduce flat `*SubmissionForm.vue` review composites or duplicate atomic fields.
- Define shared Zod schemas in `app/utils/schemas/` and reuse them in standalone atomic forms and wizard composables. Use `entitySelectionSchema` for existing-entity selections; keep component-local refinements only when they depend on runtime data.

### Nested submission wizards

- Wizards live in `app/components/{artisan,keyset,keyboard}/modal/SubmissionWizard.vue`, use `UStepper`, and embed the same atomic forms in create and review. Per-domain steps and review behavior are in "Community Submission Workflows".
- Maker/Profile/Brand is select-existing only and locked in review. In create mode, reusable intermediate entities (Sculpt/Keyset/Keyboard/Release) use a step-level `UTabs` toggle between `'existing'` and `'new'`, never a toggle inside an atomic form.
- Render that toggle only when options are loaded and non-empty. Treat only a successful empty response as evidence for proposing a new entity; never discard a preselected existing entity because options are empty, paginated, pending, or failed.
- Create mode supports repeatable Colorways/Kits/Variants. Artisan, keyset, and keyboard review each edit exactly one colorway/kit/variant (the table row) with no Add/Remove controls.
- Validate each step before advancing and validate the applicable entity/child data before saving or approving. Reuse existing create APIs in parent-to-child order; creating a Pending parent establishes ownership for subsequent child inserts.
- Selection context belongs in computed `StepperItem.description` values using selected option labels or in-progress entity names. Do not add redundant "Selected: ..." paragraphs next to pickers or repeat context inside step slots.

### Direct links and response contracts

- Detail-page links pass `maker`/`sculpt`, `profile`/`keyset`, or `brand`/`keyboard`/`release` query parameters. Jump to Colorway/Kit/Release/Variant as appropriate; derive missing profile/brand from the child's composite slug when available.
- Parent-change watchers reset dependent selections only on actual changes, never with `{ immediate: true }`. Use a separate immediate watcher for initial field synchronization (e.g. `keyset.profile_id`).
- `GET /api/keysets` returns `keysets`, not `data`. Preserve `existingKeyset.id` from direct links and submit kits through its existing-keyset endpoint rather than creating a blank keyset.
- `GET /api/makers/[maker]` returns `sculpts` keyed by ID; unwrap with `Object.values(...)` before mapping options.
- A direct "Submit a Release" link with a keyboard but no release selects `'new'` and hides the release toggle. Variant forms use a synthetic release option with ID `'draft'`, matching new variants' `release_id`; resolve the real release ID only at submit time.
- Embedded `KeysetForm` must bind `v-model:date-range` separately and convert its CalendarDate values to ISO `start_date`/`end_date` on submit. Status and Review Status remain visible; Review Status is disabled for non-moderators, read directly from the user store.

## Server and Supabase Rules

- Define API handlers with `defineEventHandler` and use H3 helpers such as `getQuery`, `readBody`, and `createError` consistently with nearby code.
- Obtain the server Supabase client with `serverSupabaseClient(event)` and the authenticated user with `serverSupabaseUser(event)`.
- `GET /api/users/:id` selects the profile row, including `appearance`. `PATCH /api/users/:id/appearance` is session-owner-only and accepts only registered theme ids and `system | light | dark`; it merges into the existing JSON value. The general `POST /api/users/:id` profile endpoint is also session-owner-only and must not accept `role` or `assignments`; admin changes use the separate admin endpoint.
- Use `requireAdminClient(event)` for admin-only server-side operations. For staff operations scoped to a specific assignment (editor/maker restricted to their assigned pages), use `getActorProfile(event)` plus `canManageAssignment`/`canManageAnyAssignment` from `~/utils/permissions` (also re-exported as `canModerateAssignment` in `server/utils/admin.ts`) instead of duplicating role checks.
- Preserve the existing middleware checks for protected pages (`app/middleware/admin.ts` for admin-only routes). For staff-but-not-admin pages, follow the existing pattern of a client-side guard (`<SharedRedirectPage v-if="!canX" to="..." />`) backed by a Pinia getter, rather than adding new route middleware.
- For insert, update, or patch payloads, use `pickTableFields(table, body)` from `server/utils/database.ts`. It validates that the body is an object and whitelists fields from generated metadata.
- Use `omitSensitive()` and existing response helpers when returning database records so internal fields such as `fts` are not exposed.
- Follow the existing pagination convention with `getQuery(event)` and Supabase `.range(from, to)`.
- Preserve existing full-text search behavior using Supabase `.textSearch()` where the endpoint already uses it.
- Use `createError({ statusCode, statusMessage })` for expected API errors and match nearby status codes and messages.
- Do not expose service-role credentials or bypass authorization checks from client code.
- For submitter-owned records (e.g. `artisan_colorways.submitted_by`), grant the original submitter limited edit/delete rights in addition to staff permissions, scoped by the record's status (e.g. only while still `Pending`, or not once `Approved`). Always re-check ownership and status server-side; never trust a client-supplied owner id.
- Image uploads (`server/api/images/upload.post.ts`) require staff permission via `canManageAssignment`, except the `artisan` and `keyset` module categories, which any authenticated user may upload to (community colorway/keyset submissions); the underlying record save still enforces its own permission checks.
- For schema changes, it's fine to draft a SQL migration under `supabase/migrations/` for the user to review and apply manually (e.g. via `supabase db push`); since `supabase/` is gitignored, these files stay local and are never committed.

## Community Submission Workflows

Signed-in users can propose artisan colorways, keyset kits, and keyboard variants; staff review them before they become public. Every domain uses the same pieces:

- **Routes**: create at `/{domain}/submissions/submit`, review at `/{domain}/submissions` (`artisan`, `keyset`, `keyboard`), both linked from the module's sidebar section in `app/layouts/default.vue` behind `authenticated.value`. Public create/contribute buttons route to the submit page; standalone modals are only for admin CRUD and sub-entity quick edits. Detail-page "Submit a …" links pass the query params described in "Direct links and response contracts".
- **UI**: `SubmissionWizard.vue` + its `use*SubmissionWizard` composable handle both create and review. Review pages are `UTable`s with one row per leaf entity and a status filter (`statusOptions` / `statusColorMap` from `app/utils/index.ts`), scoped to the submitter or to staff for the relevant assignment.
- **Status model**: `review_status` (`Pending` / `Approved` / `Rejected`, plus `submitted_by`, `verified_at`, `verified_by`) lives on every submittable table. A `null` status means a record added directly by staff; it is implicitly approved and never appears in review queues.

| Domain   | Create steps and APIs                                                                                            | Review row (list endpoint)                                              | Review wizard lands on                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| Artisan  | Maker → Sculpt → Colorway; existing sculpt and colorway create APIs                                              | Colorway (`GET /api/submissions/artisan`) with its sculpt               | Sculpt (1) while Pending/Rejected, else Colorway (2)            |
| Keyset   | Profile → Keyset → Kit; `POST /api/submissions/keyset` for a new keyset, then `.../kits`                         | Keyset group of kits (`GET /api/submissions/keyset`), paged by keyset   | Keyset (1) while Pending/Rejected, else Kit (2)                 |
| Keyboard | Brand → Keyboard → Release → Variant; `POST /api/submissions/keyboard` for a new keyboard, then release/variants | Variant (`GET /api/submissions/keyboard`) with its release and keyboard | Keyboard (1) / Release (2) while under review, else Variant (3) |

### Create flow

- Picking an existing, published (null/Approved) sculpt/keyset/keyboard lets any signed-in user add colorways, kits, or releases/variants to it without creating or re-moderating the parent. The proposal is stored `Pending` and is visible only to its submitter and staff.
- Proposing a new parent creates it first (`Pending`, owned by the submitter), which satisfies the RLS ownership needed for the child inserts that follow. The wizard calls the existing single-entity endpoints sequentially; do not describe these multi-write flows as atomic.

### Review flow

- Each review table row is one leaf entity (colorway / kit / variant) with its parents resolved alongside it. Keyset and keyboard review are grouped instead: `GET /api/submissions/keyset` returns `{ data: [{ profile_keyset_id, keyset, kits }], count }` and `GET /api/submissions/keyboard` returns `{ data: [{ brand_keyboard_slug, keyboard, variants }], count }`, where `count` and `page`/`size` refer to groups (ordered by their newest matching leaf) and each group holds every leaf of that parent matching the status filter. The pages render one expandable `UTable` row per group (expanded state keyed by the parent key via `getRowId`) with a nested leaf table carrying the per-leaf actions below, plus moderator-only Approve All / Reject All for the group's `Pending` leaves behind `SharedConfirmModal` (`confirmColor` sets the confirm button color); bulk actions post each leaf sequentially to its endpoint so the parent cascade sees every prior result. Row actions: Edit (opens the review wizard with `mode="review"` and `:submission`), moderator-only Approve/Reject (each hidden when the row already has that status), and Delete (moderators, or the submitter while the row is Pending/Rejected) behind `SharedConfirmModal`. Toasts name the row and use the `approve` / `reject` / `delete` actions of `handleSuccess`.
- The wizard edits exactly one leaf (no Add/Remove). Parent levels (sculpt, keyset, keyboard, release) are editable only while under review (Pending/Rejected, or a status-less release following its Pending keyboard) and render as locked summaries once published. Footer actions: Back, Save Changes (submitter), Save & Approve (moderator), Delete.
- Save & Approve saves each parent still under review (keyboard → release, then the leaf) and then the leaf with `action: 'approve'`; approval of the parents rides on the leaf save. Row Approve/Reject post the leaf to its existing endpoint with `action` (the variant endpoint rewrites every field, so send the whole variant row, never a partial body); there are no `/api/submissions/{domain}/[id]` endpoints, only the three list endpoints and the two create endpoints above.
- Server-side cascade (`cascadeSculptReview`, `cascadeKeysetReview`, `cascadeKeyboardReview`): approving a leaf approves its Pending/Rejected parents (status-less sibling kits, or other status-less releases and all status-less variants of the keyboard, are first set to `Pending` under the parent's submitter so they stay in the queue instead of being published unreviewed); rejecting a leaf rejects a Pending parent only once none of its children is still alive. Deleting the last leaf of a parent under review deletes that parent (variant → release → keyboard), so no orphan Pending parents remain.
- A submitter editing their own `Rejected` leaf/parent resets it to `Pending` (server-side), and the page switches its filter to Pending via `onSuccess({ resubmitted })`.

### Shared server contract (`server/utils/child-submissions.ts`)

- Kit, release, variant, and colorway endpoints call `getChildSubmissionContext(event, domain, parentKey)` (parent keys: `profile_keyset_id`, `brand_keyboard_slug`, `maker_sculpt_id`). Client moderation fields are always stripped (`omitModerationFields`) and re-applied by `attribute()`: official parent + staff → `Approved` with `verified_*`; otherwise `Pending` owned by `auth.uid()`. Keyset kits, keyboard variants, and artisan colorways always carry their own status; keyboard releases only when the parent keyboard is published, otherwise they follow their Pending keyboard.
- Staff may send `action: 'approve' | 'reject'` (`getModerationOverride`); non-staff get 403. Resubmission after rejection uses `getResubmissionPatch()`. `parseReviewStatus` / `inFilter` whitelist the list endpoints' status filter.
- Updates and deletes must check the affected row count: RLS filters silently, so return a 403 with a message when nothing changed.
- `GET /api/keysets/[profile]/[keyset]` lists only official kits (null/Approved); kits under review are reachable only through the review queue. `GET /api/keyboards/[brand]/[keyboard]` still returns releases/variants under review because the keyboard wizard needs them, so the public keyboard page filters out non-official releases and variants client-side.
- Artisan colorways use `review_status` like every other table (the former `status` column was renamed); sculpt proposals live in `artisan_sculpts` and have no separate queue.

### Database & RLS conventions for submissions

- A table that supports submissions needs the four control columns, added through a migration under `supabase/migrations/` (never by hand-editing generated types).
- Target RLS: public reads Approved/null rows; submitters read their own Pending/Rejected rows; authorized staff read and manage their scope. Non-staff inserts must be `Pending`, attributed to `auth.uid()`, with null `verified_*`; only staff may insert null/approved rows or change moderation fields. Submitters update their rows while `Pending` (also `Rejected`, which resubmits as `Pending`) and delete while `Pending`/`Rejected`, never `Approved` or `null`.
- Child tables combine the parent's state (via `exists` subqueries) with their own: community inserts need an official parent, or the submitter's own Pending parent (kits → own Pending keyset; variants → own Pending keyboard plus an official release or own Pending release). Staff scope comes from `can_manage` (keyset: `profile_keyset_id`; keyboard: the parent's `brand_slug`, not the child's column; artisan: `maker_id`). Never broaden child INSERT permissions without controlling visibility and moderation. Verify the deployed policies; local migration drafts are not proof they are applied.

### Auto-approve rule for staff submissions

- When the actor is staff for the relevant assignment (`canManageAnyAssignment(profile) && canManageAssignment(profile, assignment)`: `brand_slug`, `profile_keyset_id`, `maker_id`), creates through the shared endpoints (`/api/submissions/*`, and the kit/release/variant/colorway create endpoints used by admin and community forms) are written as `Approved` with `verified_by = user.sub` and `verified_at = new Date().toISOString()` in the same insert. Non-staff always get `Pending` with null `verified_*`.
- Admin-only creation endpoints (e.g. `server/api/keyboards/[brand]/[keyboard].post.ts`) never set these columns and stay implicitly approved via `null`.

### Delete cascade rule for submissions

- Delete children before the parent while parent-scoped RLS still applies, using the per-item delete endpoints (never a published parent): keyboard variants → releases → keyboard; keyset kits → keyset; artisan colorways → sculpt. Check every delete result instead of relying on `ON DELETE CASCADE`.
- Delete rights belong to authorized staff or the owner of a `Pending`/`Rejected` submission; never to an owner of an `Approved` or `null` record.

## Generated Data and Database Types

`app/types/database.types.ts` is generated from the Supabase schema, and `server/utils/table-fields.generated.ts` is generated from those types via `bun run generate:table-fields`. Never hand-edit or regenerate either file yourself; they are refreshed outside of your changes once the user applies any related migration against their Supabase project. When a migration adds/changes columns, just describe the expected shape in the migration's comments and leave the generated files untouched.

Keep database relationships and table names aligned with the generated `Database` type. Do not silently invent columns, tables, or enum values.

## State and Auth

Use the existing Pinia user store and composables before adding new global state. The user store (`app/stores/user.js`, plain JavaScript) holds `user`, `role`, `assignments`, `collections`, `favorites`, `social`, and `appearance`; `setCurrentUser()` runs after sign-in and `fetchUserPreferences(uid)` loads the profile row from `GET /api/users/:uid` (including appearance). `appearanceLoaded` distinguishes an empty server value from preferences that have not loaded; `saveAppearance(patch)` updates state immediately and debounces persistence by 500 ms. Sign-out calls `userStore.$reset()`; theme and color-mode cookies remain untouched. `app/composables/useSyncAppearance.ts` is invoked once from `app/app.vue` and owns server-to-client application, local seeding, change watching, and tab-focus refresh. Role/assignment rules (`admin`, `editor`, `maker`, `designer`) are centralized in `app/utils/permissions.ts` (`canManageAssignment`, `canManageAnyAssignment`) and reused by both the client (`userStore.isEditable()`, `userStore.isModerator`) and server (`server/utils/admin.ts`). Do not reimplement role branching inline; extend or call the shared utility instead. Keep `app/middleware/auth.ts`, `app/middleware/admin.ts`, and server-side authorization checks aligned. Form components that need to know whether the current user is staff should read `useUserStore().isModerator` directly instead of accepting a `moderator` prop threaded down from the page — the prop is redundant since every call site already sourced it from the same store, and skipping it removes a layer of prop-drilling.

Site-wide announcements/notices (cookie consent, feature announcements, guides) use persistent toasts added in `app/layouts/default.vue`'s `onMounted`, not a banner component: gate each with its own `useCookie(...)`, set `duration: 0` and `close: false`, and only mark the cookie as acknowledged inside an action's `onClick` so the toast keeps reappearing until the user explicitly dismisses it.

## Formatting and Validation

- Match the repository's Prettier style: single quotes and no semicolons.
- Keep changes focused and avoid unrelated refactors.
- After editing, run the narrowest relevant check first, then `bunx eslint .` or `bunx eslint . --fix` when appropriate.
- For server or schema-related changes, run a production build when practical; do not run `bun run generate:table-fields` or edit the generated files yourself.
- Review route filenames in the final diff.
- Never commit secrets or `.env` files.

## Git and Documentation

Commit messages follow Conventional Commits through commitlint. Fold the `[Unreleased]` entries into a new dated version section in `CHANGELOG.md` along with the release notes when cutting a release. Do not create commits, branches, or pull requests unless explicitly requested; writing the PR notes file described below is not a commit.

## Plans, PR Notes, and Keeping Instructions Current

- Task plans live in `.ai/plan/`, one Markdown file per task. Read this file and the relevant plan before starting, follow the plan steps in order, and tick each completed step.
- Whenever you execute a plan file, also create (or update) a PR notes file at `.ai/pr/<plan-file-name>.md` with the pull request title and summary:

  ```md
  # <PR title>

  ## Summary

  <what changed and why, notable decisions, manual steps for the user (e.g. migrations to apply), and the checks that were actually run>
  ```

  Write the title in Conventional Commits style. Do not claim tests, lint, or builds passed unless they were run. Keep the PR notes in sync if the work deviates from the plan.

- After finishing a task, update this file so it reflects the latest state of the code (schema, endpoints, stores, composables, file paths, conventions). Fix anything outdated or conflicting instead of appending contradictory notes.
- Also update the plan file: tick completed steps and record deviations in its notes section.
- This file is written in English and stays in English.
