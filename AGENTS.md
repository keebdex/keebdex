# Keebdex Agent Instructions

This is the canonical instruction file for every AI coding agent working in this repository (Claude Code, OpenAI Codex, Cursor, GitHub Copilot, and others). Keep it as the single source of truth: `CLAUDE.md` imports it, and `.github/copilot-instructions.md` points here. Update this file instead of creating agent-specific copies. A tool-specific file only points here and holds what is specific to that tool; it is never a bare `@AGENTS.md` line, but says in a sentence where the shared instructions live and how the tool loads them.

Keebdex is a Nuxt 4 application for keyboard collectors, backed by Supabase. Use Bun for local commands.

## Quick Start for Agents

1. Read this file, then the task plan in `.ai/plan/` if one applies, and the matching file under "Feature Reference".
2. Locate the closest existing pattern (same domain, same kind of file) and follow it before inventing a new one.
3. Keep the diff focused. Do not refactor unrelated code or touch generated files.
4. Verify with the narrowest relevant check first (see "Formatting and Validation"), and report only the checks that actually ran.
5. Do not commit, branch, or open a PR unless the user asks (see "Git and Documentation").

## Important Commands

- `bunx eslint .` (or `--fix`): there is no `lint` script in `package.json`.
- `bun run dev`, `build`, and `generate` regenerate `server/utils/table-fields.generated.ts` first (`pre*` hooks). Never run `bun run generate:table-fields` yourself (see "Generated Data and Database Types").

There is no test script or test suite. Do not claim tests passed unless a relevant check was actually run.

## Repository Notes

- `app/layouts/default.vue`: the page wrapper beside the sidebar is `flex-1 min-w-0` (never `w-full`, which overflows the window by the sidebar's width). Sidebar, footer links, and profile menu are in "App layout" in `docs/agents/catalog-pages.md`.
- `app/pages/keyset/`: never add a static `profile.vue` here; it collides with the `keyset-profile` route of `[profile]/index.vue`.
- `app/utils/date.ts`: format every date with its helpers (`formatDate`, `formatDateTime`, `formatDateRange`, `formatTimeAgo`, `toISODate`, `startOfDay`, `daysAgo`, `isoToday`: today as a UTC `YYYY-MM-DD` for date-only columns), never inline with `toLocaleDateString` or `Intl.DateTimeFormat`. They use one `en-US` locale and replace the no-break spaces ICU emits with plain ones, since Node and browsers disagree on them and the text would not hydrate. Other formatters (`formatPrice`, `formatNumber`, `formatEstimate`, `keysetProfileLabel`) live in `index.ts`.
- `app/utils/keeb-modules.ts`: the `KeebModule` type (from the database's `module` enum), `KEEB_MODULES` (`artisan`, `keyboard`, `keyset`, sidebar order), `isKeebModule`, and `KEEB_MODULE_LABELS` / `KEEB_MODULE_ICONS`. Use them wherever a value is one of the modules (`domain` in submissions, suggestions, and revisions; image upload `category`; the sidebar) instead of writing the union or list again. Records that are a page of their own (sculpt, keyset, keyboard) are `PAGE_ENTITY_TYPES` in `suggestions.ts`. Server code imports both explicitly.
- `package.json` `description` is the one description of Keebdex: `runtimeConfig.public.site.description` serves it as the default meta description and OG text, and the home hero, `/about`, and `/brand` show it. Read it from there instead of writing it again; the README's first line, the GitHub repository and organization descriptions, the press kit (its README and banner tagline), and the project card on the owner's blog (`content/projects/1.keebdex.json` in the `blog` repository, followed by the home page's second meta sentence) repeat it by hand, so change them with it.
- `supabase/`: a separate Git repository (gitignored here) holding the SQL migrations and seed files, with its own `AGENTS.md` and Conventional Commits.
- `.ai/plan/` and `.ai/pr/`: task plans and PR notes for agents (see "Plans, PR Notes, and Keeping Instructions Current"). `.ai/` is gitignored, so these files exist only in the working copy where they were written.
- Preserve Nuxt file-based routing paths when moving or renaming pages and API handlers.

## Vue and Nuxt Conventions

- Follow the existing Vue 3 Composition API style with `<script setup>`. Keep single-file component blocks in this order: `<template>`, then `<script setup>` (or `<script>` when required), then `<style>`.
- Use TypeScript for new application code unless the surrounding file is intentionally JavaScript.
- Build URL slugs (sculpt, keyset, keyboard, maker, and brand slugs, download filenames) with `urlSlugify` (`app/utils/slug.ts`, import it explicitly on the server), never `slugify` directly: it drops punctuation (`'`, `.`, `:`, `+`) the same way catalog-sync's `urlSlugify` does, so synced and app-made slugs match. Colorway ids are the exception: `colorways.post.ts` hashes a plain `slugify` slug into `colorway_id`, and changing it would change existing ids.
- lodash is not a dependency: use native JavaScript or `es-toolkit`. Import `sortBy` from `es-toolkit/compat`, which keeps lodash behavior (nested paths such as `'artisan.maker_id'`, several keys, `null` last); take the rest (`groupBy`, `keyBy`, `omit`) from `es-toolkit` with a key callback, since its main entry does not accept key strings.
- Keep domain-specific components in their existing domain folders; put genuinely reusable components in `app/components/shared/`.
- Prefer existing Nuxt UI components and the established slots/configuration over custom replacements, e.g. `UPageCard` and `UUser` with the theme's rounding instead of hand-built cards.
- Images: use `NuxtImg` with a preset from `nuxt.config.ts` (`square`, `cover`, `thumb`) or its own `sizes`, plus `loading="lazy"` and `decoding="async"` in grids; logos never get a preset. The custom Cloudflare Images provider, presets, eager images, logos, and capture rules are in `docs/agents/images.md`.
- Cards with an image above the title (`UPageCard` with `reverse`) use `imageCardContainerClass` (`app/utils/index.ts`) as their `container`, which pins the grid column to the card so footer actions cannot widen it; footers wrap (`pageCard.slots.footer` in `app/app.config.ts`), and a custom action row inside the footer needs its own `flex-wrap`. Artisan grids use `artisanGridClass`.
- Detail pages (maker, sculpt, brand, keyboard, keyset profile, keyset) share one card (`SharedCatalogCard`), one set of record actions (`SharedRecordActions`), one header action order, and one delete confirmation (`useConfirmDelete`), and the keyboard, keyset, and sculpt pages open with one `SharedDetailHero`; read "Detail page conventions" in `docs/agents/catalog-pages.md` before adding a card, header action, or detail page.
- Empty states use `UEmpty` (naked by default; Carbon overrides it to `subtle`; its default `md` size keeps the `size-10` circle but draws a larger 28px icon in it, through `empty.variants` in `app/app.config.ts`, so don't pass `size` or icon classes) with an `icon`, a Title Case `title`, a one-sentence `description`, and `actions` for a next step, unless the page header (or navbar) already shows that action to the same viewer: then leave it out, or show it only to the viewers the header hides it from (e.g. `authenticated ? undefined : [...]`). Keep `UPageSection` / `UPageCTA` for content sections and calls to action (e.g. `SharedProtectedPage`). In-page view switchers in the toolbar `UNavigationMenu` take icons or not per page, whichever reads better there.
- Page content widths: every page shares one width. Each `UDashboardPanel` body stops at `--container-panel` (96rem, `app/assets/main.css`), centered, on very wide screens (`dashboardPanel.slots.body` in `app/app.config.ts`: side padding, so the scrollbar stays at the edge), and pages fill it: never cap a page's content with its own `max-w-*`. Tables, queues, settings, and the submit forms (the submissions lists, `SharedSuggestionQueue`, every `/admin/**` page including Manage Users, and `/account/settings`) sit in a `UPageCard variant="subtle"` with `min-w-0`. Only the changelog entries (`max-w-xl`, inside `UChangelogVersion`), the leaderboard (`max-w-4xl`: a podium and a ranked list read best narrow), the Wishlist preview (its panel has no body), modals, and slideovers keep widths of their own.
- Follow the existing mobile-first Tailwind styling, the design tokens in `app/app.config.ts` and `app/assets/main.css`, and the centralized icon names in `app/app.config.ts`. Icons are Solar in its `line-duotone` style (`solar:*-line-duotone`, `i-solar-*-line-duotone`); large illustrative icons use `bold-duotone` instead: `UEmpty` icons, `SharedProtectedPage` icons and features, and the `features` of the info pages, plus the Support icon (sidebar and modal), which stands out on purpose, and the sidebar item of the page you are on (each item names its `activeIcon` literally, so the bundle scan picks it up). Interface icons stay `line-duotone`, except arrows, chevrons, and the menu, drag, sort, and stop icons, which stay `linear` (their `bold-duotone` forms are filled arrowheads or boxed lines); this covers every Nuxt UI icon key in `app.config.ts` (add new keys there so none fall back to Lucide); brand logos Solar lacks (Discord, Instagram, Reddit, QQ, Google Docs) come from `simple-icons`.
- Do not pass props that repeat a component's configured default. `UButton` and `UBadge` default to `color: 'neutral'` and `variant: 'soft'` (`app/app.config.ts`), so never write `color="neutral"` on them. Check the theme presets before treating a prop as a default: Carbon sets the button and badge `variant` to `solid`, so an explicit `variant="soft"` stays where soft is wanted in every theme.
- Buttons with an icon hide their label below `md` (`app/app.config.ts`). Pass `ui: { label: 'block' }` (or use the default slot) when the text must stay visible on phones, e.g. empty-state actions.
- Copied/downloaded images must not depend on the screen size: render what is captured inside `SharedSnapshot` and use the helpers in `app/utils/screenshot.ts` (details in `docs/agents/images.md`).
- Page meta: pages call `useSeoMeta` with only `title` (suffixed ` - Keebdex` by `app/app.vue`) and `description`, through getters or computeds when they depend on loaded data; public pages always set a description. Never set `ogTitle`, `ogDescription`, or `twitter*`: `app/plugins/seo.ts` infers them and makes the canonical link and og:url absolute, without query parameters. Detail pages add `defineOgImage` (`Module` with the owner's logo, or `Base`) and fall back to a generated description; other pages keep the site's `Base` image, which takes the page title. Missing records answer 404 (`throwIfNotFound`, see `docs/agents/catalog-pages.md`). Private pages use `privatePage` (`nuxt.config.ts`: client-rendered, `noindex`, out of the sitemap) and still set a `title`. Client-rendered pages send crawlers an empty shell, so the ones worth sharing get their title, description, and `Base` OG image from a row in `server/plugins/spa-social-preview.ts`, kept in sync with their `useSeoMeta`. The OG components size long titles down themselves; the home page's image shows only the wordmark (`Base` with an empty `title`). A new `server/plugins/` file loads only once the dev server restarts.
- Page tops have three layers: the navbar says where the page is (a module's name, or `SharedBreadcrumbNavbar`: a breadcrumb ending at the parent page, a back button on phones), the toolbar how to view it (tabs, search, filters), and the first `UPageHeader` what it is (title, description, every page action in `#links`). Tool pages (admin, submissions, notifications) skip the page header and keep their actions in the navbar's `#right`. Info pages (`/about`, `/why-choose-keebdex`, `/privacy`, `/shoutouts`, `/changelog`) keep their own style: `SharedInfoHero` (a keycap row linking the five, then a left-aligned title and description) instead of a page header, with the navbar only on phones. The sidebar toggle sits on the right by default (`toggleSide` in `app/app.config.ts`); never pass `toggle-side`. Read "Page header layers" in `docs/agents/catalog-pages.md` before adding a page.
- Signed-out gates use `SharedProtectedPage` (`icon`, `title`, `description`, optional `features`, `navTitle` for the mobile navbar, and `signInLabel`).
- Users' profile pictures (Google or Discord) go through `userAvatar(src, name)` (`app/utils/index.ts`), which loads them with `referrerpolicy="no-referrer"`: Google refuses most avatar requests that carry a referrer once a page shows several.
- Invert dark logos with the Tailwind `dark:invert` class (e.g. `ui.image: invertible && 'dark:invert'`), never with a `useColorMode().value === 'dark'` check: with a `system` preference SSR cannot know the mode and the class mismatch is not patched on hydration.
- Tooltips open without delay app-wide (`UApp`'s `tooltip: { delayDuration: 0 }`), since they name icon-only buttons; don't set `delay-duration` per tooltip.

## Form Architecture

- New entity forms must follow the Atomic Form + Composite Wrapper pattern: atomic forms own the field UI for one entity and accept `mode: 'standalone' | 'embedded'` with a default of `'standalone'`.
- In `standalone` mode, atomic forms may wrap themselves in `UForm`, render their own Submit/Cancel actions, and perform direct admin/edit API saves. In `embedded` mode, they must expose state through `v-model`/`update:modelValue`, hide their standalone actions, and let the parent composite own validation, navigation, and submit actions.
- Each domain's `SubmissionWizard.vue` is the composite wrapper for both create and review (`mode: 'create' | 'review'`). It owns the step slots; its paired `use*SubmissionWizard` composable owns hydration, validation, and API orchestration; navigation and footer actions come from the shared `useSubmissionWizardActions`. Review reuses the wizard and its atomic forms; there is no separate review form. Read "Nested submission wizards" and "Direct links and response contracts" in `docs/agents/submissions.md` before changing a wizard step.
- Atomic forms double as the Suggest Edit form (`SharedSuggestionForm`, see `docs/agents/edit-suggestions.md`): a field added to a form becomes suggestable automatically, so only fields a suggestion must never change need hiding behind the form's `suggest` prop (and listing as protected).
- Define shared Zod schemas in `app/utils/schemas/` and reuse them in standalone atomic forms and wizard composables. Use `entitySelectionSchema` for existing-entity selections; keep component-local refinements only when they depend on runtime data.

## Server and Supabase Rules

- Define API handlers with `defineEventHandler` and use H3 helpers such as `getQuery`, `readBody`, and `createError` consistently with nearby code. Obtain the server Supabase client with `serverSupabaseClient(event)` and the authenticated user with `serverSupabaseUser(event)`.
- `PATCH /api/users/:id/appearance` and the general `POST /api/users/:id` profile endpoint are session-owner-only; the profile endpoint must not accept `role` or `assignments` (admin changes use the separate admin endpoint), and the appearance endpoint accepts only registered theme ids and `system | light | dark`.
- Use `requireAdminClient(event)` for admin-only server-side operations. For staff operations scoped to a specific assignment (editor/maker restricted to their assigned pages), use `getActorProfile(event)` plus `canManageAssignment`/`canManageAnyAssignment` from `~/utils/permissions` (also re-exported as `canModerateAssignment` in `server/utils/admin.ts`) instead of duplicating role checks.
- Preserve the existing middleware checks for protected pages (`app/middleware/admin.ts` for admin-only routes). For staff-but-not-admin pages, follow the existing pattern of a client-side guard (`<SharedRedirectPage v-if="!canX" to="..." />`) backed by a Pinia getter, rather than adding new route middleware.
- Makers and profiles are keyed by text: `artisan_makers.maker_id` and `keyset_profiles.profile_id` (the slugs in URLs, logo file names, and assignments, and the primary keys the children's `maker_id` / `profile_id` point at). Their `id` is a numeric identity column that nothing writes (`pickTableFields(..., ['id', 'maker_id'])` in the maker save, which keys on the route param); never read `maker.id` or `profile.id` as a slug. Brands follow the keyboard module's naming instead: `id` plus `slug`. The key changes only while the record is under review (a reviewer fixing a proposed slug, `rename()` in `useSubmissionOwner`); once published it is the address, the logo file, assignments, pins, and what catalog-sync writes, so `saveOwnerSubmission` refuses it (409) and `guard_owner_key()` (`20261026000400_owner_key_guard`) blocks it in the database. Forms show the slug, with that warning, only when adding or reviewing.
- Page keys are built by the database, never by code: the app sets the record's own slug (`artisan_sculpts.sculpt_id`, `keysets.slug`, `keyboards.slug`, from the name with `urlSlugify`) and the `update_maker_sculpt_id`, `update_profile_keyset_id`, and `update_brand_keyboard_slug` triggers join it to the parent (`maker_sculpt_id`, `profile_keyset_id`, `brand_keyboard_slug`). Children reference page keys with on update cascade, so renaming a page, or the maker, profile, or brand above it, moves them in the same statement. Writers that send only the key (catalog-sync's vendor adapters) still work: the trigger takes the slug from it. Children still send their parent's key as a reference (`maker_sculpt_id` on colorways, `profile_keyset_id` on kits).
- For insert, update, or patch payloads, use `pickTableFields(table, body)` from `server/utils/database.ts`. It validates that the body is an object and whitelists fields from generated metadata; generated columns (`fts`) are always dropped, so `omitSensitive()` is only for responses; its optional third argument lists columns clients must never write (`pickTableFields('keysets', body, ['profile_keyset_id'])`), such as the page keys and `source_slug` the database sets, instead of deleting or omitting them afterwards.
- Use `omitSensitive()` and existing response helpers when returning database records so internal fields such as `fts` are not exposed. It is shallow: strip nested embedded rows too (e.g. `colors.color` in `GET /api/keysets/[profile]/[keyset]`).
- Select only the columns a response uses when it is built from a few of them (e.g. `GET /api/search`, `GET /api/marketplace`, `GET /api/statistics`).
- Follow the existing pagination convention with `getQuery(event)` and Supabase `.range(from, to)`, and preserve existing full-text search behavior using `.textSearch()` where the endpoint already uses it.
- Public list reads of submittable tables filter with `PUBLISHED_FILTER` (`server/utils/index.ts`): `.or(PUBLISHED_FILTER)` after `.select()`, or with `referencedTable` for embedded rows (grep for its users). Never use `.neq('review_status', …)`, which also drops `null` rows. The maker, profile, and brand lists (`GET /api/makers`, `/api/keysets/profiles`, `/api/keyboards/brands`) take `?own=1` (`publishedOrOwnFilter`) to add the caller's own proposals, for the submission wizards only; detail endpoints of a maker, profile, or brand under review rely on RLS (404 for everyone but its submitter and staff).
- Artisan colorway search (`server/utils/colorway-search.ts`) matches published colorways by their own name only; see "Colorway search" in `docs/agents/artisan.md`.
- Use `createError({ statusCode, statusMessage })` for expected API errors and match nearby status codes and messages.
- Do not expose service-role credentials or bypass authorization checks from client code.
- For submitter-owned records (e.g. `artisan_colorways.submitted_by`), grant the original submitter limited edit/delete rights in addition to staff permissions, scoped by the record's status (e.g. only while still `Pending`, or not once `Approved`). Always re-check ownership and status server-side; never trust a client-supplied owner id.
- Image uploads (`server/api/images/upload.post.ts`) require staff permission via `canManageAssignment`, except the `artisan`, `keyset`, and `keyboard` module categories, which any authenticated user may upload to (community submissions and edit suggestions); the underlying record save still enforces its own permission checks.
- For schema changes, draft an idempotent SQL migration under `supabase/migrations/` for the user to review and run in the Supabase SQL editor. `supabase/` is its own repository: commit there only when asked, following `supabase/AGENTS.md`.

## Cloudflare Worker Budget

Production runs on Cloudflare Workers, where CPU time per request is capped (`limits.cpu_ms` in `wrangler.jsonc`, Error 1102 when exceeded), so keep Worker work small:

- Add new private or list-heavy pages to the `ssr: false` group in `routeRules` (`nuxt.config.ts`); public catalog pages keep SSR. Do not cache rendered HTML: it depends on the theme and color-mode cookies and the device.
- Keep SSR payloads small: trim with `pick`/`transform` in `useAsyncData` or select fewer columns on the server.
- `nuxt.config.ts` runs only at build time, so `process.env` there bakes values into the bundle: never read secrets that way. Runtime values use `NUXT_` names matching `runtimeConfig` and are set as Worker Secrets.
- Read `docs/agents/cloudflare.md` before touching route rules, the sitemap, environment variables, the Nitro preset, `wrangler.jsonc`, icons, or global CSS imports.

## Generated Data and Database Types

`app/types/database.types.ts` is generated from the Supabase schema, and `server/utils/table-fields.generated.ts` is generated from those types via `bun run generate:table-fields`. Never hand-edit either file or run that script directly; the `pre*` hooks of `dev`, `build`, and `generate` rerun it from the committed types, which leaves it unchanged. Both files are refreshed outside of your changes once the user applies any related migration against their Supabase project. When a migration adds/changes columns, just describe the expected shape in the migration's comments and leave the generated files untouched.

Keep database relationships and table names aligned with the generated `Database` type. Do not silently invent columns, tables, or enum values.

## State and Auth

- Use the existing Pinia user store (`app/stores/user.js`, plain JavaScript) and composables before adding new global state. Sign-out calls `userStore.$reset()`; theme and color-mode cookies remain untouched. `useSyncAppearance()` (called once from `app/app.vue`) owns syncing appearance preferences (see `docs/agents/theme-presets.md`).
- Role/assignment rules (`admin`, `editor`, `maker`, `designer`) are centralized in `app/utils/permissions.ts` (`canManageAssignment`, `canManageAnyAssignment`) and reused by the client (`userStore.isEditable()`, `userStore.isModerator`) and the server (`server/utils/admin.ts`); `can_manage(scope)` mirrors them in the database. Assignments match a page exactly: a maker's `maker_id` covers its sculpts and colorways, a brand slug its keyboards, releases, and variants, and a keyset's `profile_keyset_id` (e.g. `gmk/olivia`, never the profile alone) the keyset, its kits, and its colors. Do not reimplement role branching inline; extend or call the shared utility instead. Keep `app/middleware/auth.ts`, `app/middleware/admin.ts`, and server-side authorization checks aligned.
- Form components that need to know whether the current user is staff read `useUserStore().isModerator` directly; don't add a `moderator` prop for it.

### Toast messages

Every toast has a short Title Case title (like HTTP status text: `Not Found`, `Session Expired`) and a full-sentence description. Build toasts with the helpers in `app/utils/toast.ts` (auto-imported) and pass the result to `useToast().add()`; do not hand-write success/error toast objects.

- `successToast(action, { entity, name, target })` covers record changes with a fixed set of actions: `add` (create, or add to a collection via `target`), `update`, `delete` (permanent), `remove` (take out of a collection), `move`, `approve`, `reject`. Pass `scope` for the parent of bulk results and `plural` for plural entity names that are not counted labels; use `countLabel(n, 'kit')` as the `entity` for bulk results (the count appears only in the description).
- `notificationToast(view)` turns a rendered notification into a toast with a _View_ action.
- `noticeToast(key)` covers fixed app events that are not record changes; add a key there instead of an inline toast.
- `validationToast(message, title?)` is for client-side checks and shows the message verbatim; never route validation through `errorToast`.
- `errorToast(error, { showOriginalMessage })` is for caught errors: it logs and maps by status, and `showOriginalMessage` shows the server `statusMessage` (use it where endpoints return user-facing messages, as the submission flows do).
- Site-wide news lives in the database as announcements, never as toasts written in code. Add toasts on mount through one `useToast()` instance and never reorder `toasts`; why is in "Toasts and the toaster" in `docs/agents/announcements.md`.

## Feature Reference

Read the matching file before working on one of these features; each holds its schema, endpoints, components, and rules.

- Community Submission Workflows, including the nested wizards and their direct links: `docs/agents/submissions.md`
- Edit Suggestions: `docs/agents/edit-suggestions.md`
- Revision History: `docs/agents/revision-history.md`
- Notifications: `docs/agents/notifications.md`
- Announcements and the toaster: `docs/agents/announcements.md`
- Theme Preset System and appearance sync: `docs/agents/theme-presets.md`
- Catalog Pages (home, catalog lists and the maker, brand, and profile pages, keyset pages, keyset, keyboard, and sculpt detail pages, the colorway drawer, shared detail-page heroes, cards, and header actions, and the app layout and sidebar): `docs/agents/catalog-pages.md`
- Artisan Forms, Wishlist, Share Card, and Colorway Search (sculpt renames, colorway stems, Wishlist Image builder, the trading cards, the palette group and `/artisan/search`): `docs/agents/artisan.md`
- Collections, Save to Collection, and the Trading Hub: `docs/agents/collections.md`
- Leaderboard: `docs/agents/leaderboard.md`
- Images (the Cloudflare Images provider, presets, logos, `SharedSnapshot` captures): `docs/agents/images.md`
- Cloudflare Workers (route rules, sitemap, environment variables, Nitro preset, `wrangler.jsonc`, icons): `docs/agents/cloudflare.md`
- Changelog and Releases (the changelog files and page, cutting a release, the release-notes style): `docs/agents/releases.md`

## Formatting and Validation

- Match the repository's Prettier style: single quotes and no semicolons.
- After editing, run the narrowest relevant check first, then `bunx eslint .` or `bunx eslint . --fix` when appropriate.
- For server or schema-related changes, run a production build when practical; do not run `bun run generate:table-fields` or edit the generated files yourself.
- Review route filenames in the final diff.
- Never commit secrets or `.env` files.

## Git and Documentation

- Commit messages follow Conventional Commits through commitlint. Do not create commits, branches, or pull requests unless explicitly requested; a request to commit also covers the branch the commit goes on. Writing the PR notes file described below is not a commit.
- Write user-facing notes for unreleased changes in `content/changelog/unreleased.md` (create it with `title: Unreleased` frontmatter when it is missing); `CHANGELOG.md` only points there. Release notes are read by collectors, not developers: each entry is a full, present-tense sentence about what users see or can now do and why it helps, merged with any entry on the same feature, and internal work users never see is left out. Follow "Release notes" in `docs/agents/releases.md` for the shape, and use its release steps to cut a release. Edit a released version in its `content/changelog/v<version>.md`, never on GitHub, whose releases are copies of those files.

## Plans, PR Notes, and Keeping Instructions Current

- Task plans live in `.ai/plan/`, one Markdown file per task. Read this file and the relevant plan before starting, follow the plan steps in order, and tick each completed step.
- Whenever you execute a plan file, also create (or update) a PR notes file at `.ai/pr/<plan-file-name>.md` with the pull request title and summary:

  ```md
  # <PR title>

  ## Summary

  <one paragraph: what changed and why, as a reader of the merge commit needs it>

  <details: notable decisions, manual steps for the user (e.g. migrations to apply), and the checks that were actually run>
  ```

  Open every pull request body (here and in `supabase/` and catalog-sync) with that one-paragraph summary: it is what the reviewer reads first and what goes into the merge commit's message. Write the title in Conventional Commits style. Do not claim tests, lint, or builds passed unless they were run. Keep the PR notes in sync if the work deviates from the plan.

- After finishing a task, update the instruction file that covers what changed so it reflects the latest state of the code (schema, endpoints, stores, composables, file paths, conventions): the feature's file under `docs/agents/` for feature details, this file only for rules most tasks need. Fix anything outdated or conflicting instead of appending contradictory notes.
- Also update the plan file: tick completed steps and record deviations in its notes section.
- This file is written in English and stays in English.
