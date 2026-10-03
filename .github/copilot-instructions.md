# Keebdex Copilot Instructions

## Project Overview

Keebdex is a Nuxt 4 application for keyboard collectors. It uses Vue 3, TypeScript, Nuxt UI, Tailwind CSS, Pinia, Nuxt Nitro/H3, and Supabase PostgreSQL.

Use Bun for local commands. The repository contains a `bun.lock` file.

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
- `app/utils/theme-presets/`: theme preset system with registry, type definitions, and preset configs (default, carbon, parchment).
- `app/composables/useAppTheme.ts`: reactive theme management with cookie persistence.
- `app/plugins/theme.ts`: runtime theme application engine; merges preset UI config into `appConfig`, generates CSS, and handles font variables.
- `server/api/`: Nitro/H3 file-based API handlers. The filename suffix defines the HTTP method, such as `.get.ts`, `.post.ts`, `.patch.ts`, or `.delete.ts`.
- `server/utils/`: server-side database, authorization, grouping, and response helpers.
- `scripts/`: repository maintenance scripts, including table-field metadata generation.
- `supabase/`: Supabase project configuration and database-related files (gitignored; not tracked in this repo).
- `public/`: static assets.

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
- Theme switching does not reload the page; all state is client-side and persisted across sessions via cookie.
- When adding a new preset: create a `.ts` file in `theme-presets/`, export a `ThemePreset` satisfying the interface, register it in `index.ts`, and ensure `presetToCss()` generates valid CSS for all your root/headings/light/dark blocks.

## Form Architecture

- New entity forms must follow the Atomic Form + Composite Wrapper pattern: atomic forms own the field UI for one entity and accept `mode: 'standalone' | 'embedded'` with a default of `'standalone'`.
- In `standalone` mode, atomic forms may wrap themselves in `UForm`, render their own Submit/Cancel actions, and perform direct admin/edit API saves. In `embedded` mode, they must expose state through `v-model`/`update:modelValue`, hide their standalone actions, and let the parent composite own validation, navigation, and submit actions.
- Each domain's `SubmissionWizard.vue` is the composite wrapper for both create and review (`mode: 'create' | 'review'`). It owns navigation and actions; its paired `use*SubmissionWizard` composable owns hydration, validation, and API orchestration. Do not reintroduce flat `*SubmissionForm.vue` review composites or duplicate atomic fields.
- Define shared Zod schemas in `app/utils/schemas/` and reuse them in standalone atomic forms and wizard composables. Use `entitySelectionSchema` for existing-entity selections; keep component-local refinements only when they depend on runtime data.

### Nested submission wizards

- Wizards live in `app/components/{artisan,keyset,keyboard}/modal/SubmissionWizard.vue`, use `UStepper`, and embed the same atomic forms in create and review. Domain-specific steps and actions are documented below; do not assume identical review behavior across domains.
- Maker/Profile/Brand is select-existing only and locked in review. In create mode, reusable intermediate entities (Sculpt/Keyset/Keyboard/Release) use a step-level `UTabs` toggle between `'existing'` and `'new'`, never a toggle inside an atomic form.
- Render that toggle only when options are loaded and non-empty. Treat only a successful empty response as evidence for proposing a new entity; never discard a preselected existing entity because options are empty, paginated, pending, or failed.
- Create mode supports repeatable Colorways/Kits/Variants. Keyset review retains repeatable Kits; keyboard review groups repeatable Releases with their Variants; artisan review edits one colorway with no Add/Remove controls.
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

Keebdex supports community-submitted content that waits for staff review before becoming public, using a shared `submitted_by` / `verified_at` / `verified_by` + status pattern:

- Create routes are `/{domain}/submissions/submit`; review pages are `/{domain}/submissions` for artisan, keyset, and keyboard. Review APIs share `server/api/submissions/`. Lists are scoped to the submitter or authorized staff assignments and reuse `statusOptions` / `statusColorMap` from `app/utils/index.ts`.

| Domain   | Create steps / APIs                                                                                                           | Review hydration and entry                                                                                          | Final moderator actions                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Artisan  | Maker → Sculpt → Colorway; existing sculpt/colorway create APIs                                                               | Selected colorway row via `submission`; Sculpt (index 1) only when Pending, otherwise Colorway (index 2)            | Back / Save & Approve / Delete          |
| Keyset   | Profile → Keyset → Kit; `POST /api/submissions/keyset` for a new keyset, then its `/kits` endpoint                            | `submissionId` via `GET /api/submissions/keyset/[id]`; Keyset (index 1), then repeatable Kits                       | Back / Save & Approve / Reject / Delete |
| Keyboard | Brand → Keyboard → Release → Variant; `POST /api/submissions/keyboard` for a new keyboard, then its release/variant endpoints | `submissionId` via `GET /api/submissions/keyboard/[id]`; Keyboard (index 1), then repeatable Releases with Variants | Back / Save & Approve / Reject / Delete |

Keyset and keyboard wizards also accept proposals against an already-published parent; see "Child proposals in the submission wizards" below.

- Artisan list actions are Edit and moderator quick Approve/Reject, with Release/Qty details. Pending sculpt proposals are hydrated into the embedded Sculpt form and resolved with their colorway; there is no separate sculpt queue.
- Artisan Save & Approve saves sculpt/colorway changes before calling moderation. Keyboard/keyset submit the entity and nested children with `action: 'approve'` or `'reject'`; do not describe these multi-write handlers as atomic transactions. Non-moderators retain Save Changes for keyboard/keyset where permitted.
- `null` review status denotes an implicitly approved direct staff record, excluded from moderation queues. Preserve `artisan_colorways.status`; other submission entities use `review_status`.

### Child proposals in the submission wizards

- Picking an existing, published (null/Approved) Keyset or Keyboard in the keyset/keyboard wizards lets any signed-in user add Kits, or Releases/Variants, to it. Direct "Submit a Kit/Release/Variant" links use the same path. The parent is never created, edited, or re-moderated by this flow.
- `keyset_kits`, `keyboard_releases`, and `keyboard_variants` carry their own `review_status` / `submitted_by` / `verified_at` / `verified_by` (`supabase/migrations/20261003020000_child_submission_moderation.sql`, applied manually; refresh generated files externally). A child's `null` status means it belongs to its parent's lifecycle (a Pending parent's children) or was added directly by staff.
- Child create/edit goes through the existing kit/release/variant endpoints, which call `getChildSubmissionContext` from `server/utils/child-submissions.ts`. Moderation fields are always stripped from client payloads (`omitModerationFields`) and re-applied server-side: official parent + non-staff → `Pending` owned by the actor; official parent + staff → auto-approved; Pending/Rejected parent → no child-level status. Staff may also send `action: 'approve' | 'reject'` in the body to moderate that child (`getModerationOverride`); non-staff get 403. Deletes use the existing per-item delete endpoints.
- The review queue lists a published parent when it has proposed children matching the status filter. `GET /api/submissions/{keyset,keyboard}` marks those rows `child_submission: true`; the page passes `:children-only` and the row's `profile_keyset_id` / `brand_keyboard_slug` as `:parent-key` to the wizard (`mode="review"`).
- With `childrenOnly` (plus the parent's `parentKey`), the wizard locks the parent (a read-only summary, never the atomic form) and lands on the last step (Kits / Releases) instead of index `1`. It has no dedicated API: it hydrates from the public detail endpoints (`GET /api/keysets/[profile]/[keyset]`, `GET /api/keyboards/[brand]/[keyboard]`, filtered client-side to children with a `review_status`, which RLS already scopes to the submitter/staff) and saves, approves, rejects, and deletes by calling the existing per-item endpoints one by one, so the parent is never modified or deleted and the sequence is not atomic. Each proposed child shows its own status badge. Published (null-status) releases stay locked and only host their proposed variants.
- Approve/Reject send `action` only for children not already in the target status. Non-staff may only update/delete their own Pending children (the composable skips the rest). When removing, delete variants before their release, and never delete a release without its own status.
- The sculpt proposal migration `supabase/migrations/20261001000000_artisan_sculpt_submission_status.sql` is also a local schema draft. Wizard support exists, but verify the deployed schema rather than assuming local drafts have been applied.

### Database & RLS conventions for submissions

- Any table that supports community submissions must carry the four control columns: `review_status` (or `status` on `artisan_colorways`, for historical reasons — don't rename it), `submitted_by`, `verified_at`, `verified_by`. Add these via a migration under `supabase/migrations/`, never by hand-editing generated types.
- Target RLS rules: public reads of Approved/null rows; submitters read their own Pending/Rejected rows; authorized staff read/manage their scope. Non-staff inserts must be Pending and attributed to `auth.uid()`; only staff may insert implicitly approved/null records or change moderation fields. Submitters edit Pending records and delete Pending/Rejected records, never Approved or implicitly approved records. Verify actual deployed policies; do not assume draft migrations enforce these rules.
- Kits, releases, and variants combine the parent's state (via `exists` checks) with their own: community inserts must be `Pending`, owned by `auth.uid()`, with null `verified_*`, and only against an official parent (variants also need an official release or the submitter's own Pending release). Submitters update/delete their own children only while `Pending`; staff scope comes from `can_manage` (keyset: `profile_keyset_id`; keyboard: the parent's `brand_slug`, not the child's column). Never broaden child INSERT permissions without controlling visibility and moderation.

### Auto-approve rule for staff submissions

- When the authenticated actor is staff for the relevant assignment (`canManageAnyAssignment(profile) && canManageAssignment(profile, assignment)`, e.g. `brand_slug` for keyboards, `profile_keyset_id` for keysets, `maker_id` for artisan colorways), a **create** through the shared submission form must auto-approve instead of entering the Pending queue: set `review_status`/`status = 'Approved'`, `verified_by = user.sub`, and `verified_at = new Date().toISOString()` in the same insert, rather than requiring the moderator to review/approve their own submission afterwards.
- Regular (non-staff) users always get `review_status = 'Pending'` with `verified_at`/`verified_by` left `null`.
- This check applies to the shared `/api/submissions/*` create endpoints, the shared artisan colorway create endpoint, and the shared kit/release/variant create endpoints used by both admin and community forms (via `getChildSubmissionContext`). Existing admin-only creation endpoints (e.g. `server/api/keyboards/[brand]/[keyboard].post.ts`) are unaffected — they never set these columns and stay implicitly approved via `null`.

### Delete cascade rule for submissions

- Delete child rows before the parent while parent-scoped RLS still applies: keyboard Variants → Releases → Keyboard; keyset Kits → Keyset. Check every delete result instead of relying solely on `ON DELETE CASCADE`.
- Delete rights belong to authorized staff or the owner of a Pending/Rejected submission. Do not treat `null` as an unapproved submission or allow owners to delete Approved records.
- Deleting a child-only submission removes only the proposed children through the per-item delete endpoints, never the published parent.

### Submissions route naming convention

- Each module's moderation/review page lives at `/{module}/submissions` (e.g. `/keyboard/submissions`, `/keyset/submissions`, `/artisan/submissions`) and is linked from the sidebar under that module's section in `app/layouts/default.vue`, gated behind `authenticated.value`.
- The "create a new submission" page lives at `/{module}/submissions/submit` for keyboard, keyset, and artisan (a nested route under the review page). Public user create/contribute buttons for main entities should route there. Standalone modals are reserved for admin dashboard direct CRUD and quick-create/edit of sub-entities inside admin/detail contexts.

## Generated Data and Database Types

`app/types/database.types.ts` is generated from the Supabase schema, and `server/utils/table-fields.generated.ts` is generated from those types via `bun run generate:table-fields`. Never hand-edit or regenerate either file yourself; they are refreshed outside of your changes once the user applies any related migration against their Supabase project. When a migration adds/changes columns, just describe the expected shape in the migration's comments and leave the generated files untouched.

Keep database relationships and table names aligned with the generated `Database` type. Do not silently invent columns, tables, or enum values.

## State and Auth

Use the existing Pinia user store and composables before adding new global state. Role/assignment rules (`admin`, `editor`, `maker`, `designer`) are centralized in `app/utils/permissions.ts` (`canManageAssignment`, `canManageAnyAssignment`) and reused by both the client (`userStore.isEditable()`, `userStore.isModerator`) and server (`server/utils/admin.ts`). Do not reimplement role branching inline; extend or call the shared utility instead. Keep `app/middleware/auth.ts`, `app/middleware/admin.ts`, and server-side authorization checks aligned. Form components that need to know whether the current user is staff should read `useUserStore().isModerator` directly instead of accepting a `moderator` prop threaded down from the page — the prop is redundant since every call site already sourced it from the same store, and skipping it removes a layer of prop-drilling.

Site-wide announcements/notices (cookie consent, feature announcements, guides) use persistent toasts added in `app/layouts/default.vue`'s `onMounted`, not a banner component: gate each with its own `useCookie(...)`, set `duration: 0` and `close: false`, and only mark the cookie as acknowledged inside an action's `onClick` so the toast keeps reappearing until the user explicitly dismisses it.

## Formatting and Validation

- Match the repository's Prettier style: single quotes and no semicolons.
- Keep changes focused and avoid unrelated refactors.
- After editing, run the narrowest relevant check first, then `bunx eslint .` or `bunx eslint . --fix` when appropriate.
- For server or schema-related changes, run a production build when practical; do not run `bun run generate:table-fields` or edit the generated files yourself.
- Review route filenames in the final diff.
- Never commit secrets or `.env` files.

## Git and Documentation

Commit messages follow Conventional Commits through commitlint. Fold the `[Unreleased]` entries into a new dated version section in `CHANGELOG.md` along with the release notes when cutting a release. Do not create commits or branches unless explicitly requested.
