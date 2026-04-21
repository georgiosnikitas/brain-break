---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-04-21'
inputDocuments:
  - path: 'docs/planning-artifacts/mobile/prd.md'
    type: 'mobile-prd'
    note: 'PRIMARY source of truth. 71 FRs, 34 NFRs, phased scope.'
  - path: 'docs/planning-artifacts/mobile/_party-mode-transcript.md'
    type: 'party-mode-transcript'
    note: 'Locked architectural decisions from 2026-04-21 kickoff.'
  - path: 'docs/planning-artifacts/architecture.md'
    type: 'existing-architecture'
    note: 'Terminal architecture. REFERENCE for core extraction. Do not modify.'
  - path: 'docs/planning-artifacts/prd.md'
    type: 'existing-prd'
    note: 'Terminal PRD. Parity source of truth.'
  - path: 'docs/planning-artifacts/epics.md'
    type: 'existing-epics'
    note: 'Terminal epics. Parity checklist for feature coverage.'
  - path: 'docs/planning-artifacts/product-brief.md'
    type: 'product-brief'
  - path: 'docs/planning-artifacts/ux-design-specification.md'
    type: 'existing-ux-spec'
    note: 'Terminal UX. Reference for screen-flow parity.'
workflowType: 'architecture'
scope: 'mobile'
project_name: 'brain-break'
user_name: 'George'
date: '2026-04-21'
---

# Architecture Decision Document — brain-break (Mobile)

**Author:** George
**Date:** 2026-04-21

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements.** The mobile PRD specifies **71 FRs** across 13 capability areas. Architecturally they decompose into three layers:

- **Core-portable logic (platform-agnostic)** — domain schema, AI provider interface and implementations, utility helpers, storage interface. These requirements (FR22–FR34, FR46–FR50, FR54–FR56, FR61–FR65) apply identically to terminal and mobile and must be served from a single shared package.
- **Mobile-only concerns (platform-specific)** — secure-store key lifecycle, haptic feedback, SQLite persistence, expo-router stack navigation, system-browser external links, onboarding gate, zero-state Home. These (FR1–FR21, FR28, FR35–FR45, FR51–FR53, FR57–FR71) live in `packages/mobile`.
- **Parity-contract requirements** — FR70 (divergence transparency link) and FR71 (store-description disclosure) are process/documentation contracts, not code; they shape release workflow, not runtime architecture.

**Non-Functional Requirements.** The **34 NFRs** drive architecture asymmetrically. A few are high-leverage:

- **NFR-P3 (p50 < 4s, p95 < 8s AI generation) + NFR-P4 (loading state within 100ms)** — mandate a latency-tolerant UI wrapper (cancellable AI calls, non-blocking back navigation). Not a simple `await`.
- **NFR-P6 (local reads < 300ms with ≥1000 history entries)** — rules out naive JSON blob storage on mobile; SQLite needs indexed access patterns on `(domain_id, timestamp)`.
- **NFR-S1 / NFR-S5 (secure-store exclusive; launch-time detection of key loss)** — requires an explicit key-lifecycle component that runs before any AI call.
- **NFR-R1 (≥99.5% crash-free) + NFR-PR4 (no third-party SDK)** — dictates an app-level error boundary, global unhandled-rejection handler, and a fatal-error recovery flow; crash attribution is platform-native only.
- **NFR-R4 (forward-only non-destructive migrations from v1)** — elevates the migration framework to a first-class module, not inline DDL.
- **NFR-M1–M3 (single source of truth for core logic and schema)** — binds terminal and mobile to the same `@brain-break/core` package; zero duplicated domain logic is a hard invariant.
- **NFR-M5 (≤ 15 direct runtime deps beyond Expo core)** — every dependency addition is an architectural decision, documented here.

**Scale & Complexity.** Medium. Cross-platform mobile delivered via Expo managed workflow + TypeScript monorepo + local-first SQLite + BYO-key multi-provider AI. No backend. No multi-tenancy. No regulated data. The non-trivial dimensions are the **brownfield core-extraction refactor** (must keep `main` green across every commit) and the **design-for-Phase-2** storage contract (must accommodate a future `GoogleDriveAdapter` without breaking).

- Primary technical domain: cross-platform mobile (Expo / React Native / TypeScript) + shared-core monorepo
- Complexity level: **medium**
- Estimated top-level architectural modules: ~12 (see Module Inventory below, drafted in a later step)

### Technical Constraints & Dependencies

**Locked in prior planning (non-negotiable for Phase 1):**

- **Monorepo:** pnpm workspaces. Three packages: `@brain-break/core` (platform-agnostic), `packages/terminal` (existing app, thinned), `packages/mobile` (new Expo app).
- **Mobile stack:** Expo managed workflow, React Native, TypeScript. expo-router (stack navigator, no tab bar). expo-sqlite. expo-secure-store. expo-haptics. expo-linking. EAS Build + EAS Submit.
- **Target platforms:** iOS 16.0+, Android 10 (API 29)+. Phones only. Portrait only.
- **AI providers Phase 1:** OpenAI, Anthropic, Google Gemini, Ollama, OpenAI-compatible. GitHub Copilot is **terminal-only** and must not leak into `@brain-break/core` common exports.
- **Storage:** `IStorageAdapter` interface in core. `FileSystemAdapter` (terminal), `SQLiteAdapter` (mobile). Future `GoogleDriveAdapter` (Phase 2) must fit the same contract.
- **Secret storage:** expo-secure-store on mobile. Keys never in AsyncStorage, SQLite, logs, crash reports.
- **Observability:** Apple App Store Connect + Google Play Android Vitals only. No in-app crash SDK, no analytics SDK.
- **Chart library (Stats screen):** One of `victory-native` or `react-native-gifted-charts`. Selection deferred to a dedicated architectural decision later in this document.

**Inherited from the terminal codebase (will be respected or deliberately refactored):**

- Existing Zod-based domain schemas in `src/domain/` — good fit for core extraction with minimal change.
- Existing `AiProvider` interface in `src/ai/` — already abstract; Copilot implementation is the only provider with a platform binding (GitHub OAuth device flow) and stays in `packages/terminal`.
- Existing `src/domain/store.ts` — the one module with a filesystem dependency that must be abstracted behind `IStorageAdapter` as part of extraction.
- Existing router model — linear push/pop, conceptually mirrors expo-router's stack navigator, so screen-logic migration is ergonomic.
- Existing terminal-only concerns (`src/screens/`, ANSI rendering, stdin key handling) — stay in `packages/terminal`, not portable.

**Brownfield discipline (PRD-mandated):**

- Core extraction proceeds as a sequence of small additive commits. Each commit leaves `main` green on the terminal test suite.
- **No migration of existing terminal data.** Domains created before core extraction continue to live on the user's filesystem in their current shape; we do not rewrite them. The `id` + `updatedAt` fields mandated by FR64 apply to **newly created records from day one onward**, on both platforms. Existing terminal records without these fields are tolerated by the read path and remain outside the sync surface.
- No destructive migrations ever. All migrations are forward-only and preserve existing data.

### Cross-Cutting Concerns Identified

These concerns span multiple modules and must be designed as first-class architectural primitives, not treated ad hoc in individual features:

1. **Schema source-of-truth and versioning.** `@brain-break/core` owns Zod schemas for all domain data. Both `FileSystemAdapter` and `SQLiteAdapter` validate on read/write. Adding a field requires a single coordinated change in core + both adapters + forward migration for both.
2. **Secure-key lifecycle.** Launch-time validation, paste + validate + persist on setup, re-validate on provider change, detect loss on app restore, route to provider-setup screen on failure. Named component, not scattered logic.
3. **AI call envelope.** Uniform wrapper for every AI call: timeout handling, cancellability, loading-state signalling, user-friendly error translation, retry affordance. Zero naked `fetch` to provider endpoints in the UI layer.
4. **Error boundaries without an SDK.** App-level error boundary (React) + global unhandled-rejection handler (mobile) that surface user-facing fallback UI without swallowing the error from the platform's native crash reporter.
5. **Dependency injection at bootstrap.** Each app entry point (terminal `index.ts`, mobile `_layout.tsx`) wires concrete adapters into core logic. Core exports constructor functions, not platform-aware singletons.
6. **Migration framework.** First-class module in core. Each migration is a versioned, forward-only transformation. Both adapters delegate to the same framework.
7. **Theming tokens layer.** Mobile `theme.ts` defines semantic tokens (background, surface, text, accent, success, error). No hex literals in components. Phase 3 light-theme work is a one-file change.
8. **Offline-aware UI states.** A small set of standard states (loading / offline-blocked / provider-error / empty / populated) applied consistently across every network-dependent surface.
9. **Parity contract surface.** A runtime module in core (e.g. `platform-capabilities.ts`) that exports a typed capability map — which features the current platform supports (`exit`, `copilotProvider`, `themePicker`, `asciiArtMilestone`, `sprintMode`, `challengeMode`, etc.). Terminal and mobile provide concrete implementations at bootstrap. The Settings screen, Home menu, and Domain menu render from this map so a forgotten divergence becomes a compile-time error, not a visual bug.
10. **Build pipeline discipline.** EAS Build + EAS Submit for mobile; existing terminal npm publish pipeline untouched. Both covered by one GitHub Actions workflow gating on a unified core test suite.
11. **Bidirectional sync readiness (Phase 1 → Phase 2 invariant).** Phase 2 introduces Google Drive BYOC sync, and it must be **truly bidirectional**: a domain created on mobile must land in terminal via Drive, a domain created on terminal must land on mobile via Drive, and both platforms must be first-class peers. To keep Phase 2 a pure additive adapter and not a cross-cutting refactor, Phase 1 holds the following invariants:
    - **Canonical record shape.** `@brain-break/core` defines exactly one serialization shape per record type (`Domain`, `QuestionRecord`, `Settings`). Both `FileSystemAdapter` and `SQLiteAdapter` round-trip that shape identically. SQLite is an indexed cache of the canonical document, not a different model.
    - **Platform-neutral identity.** Every newly-created record carries a stable `id` and `updatedAt` from both platforms. IDs are collision-safe across devices (UUID or ULID, not sequential integers, not filesystem paths).
    - **No platform-local fields.** Neither terminal nor mobile adds fields the other cannot read. Extensions go through core schema + both adapters together (reinforces NFR-M2).
    - **No adapter assumes single-writer.** Read/write paths must tolerate the possibility that another device updated a record since last read. Conflict resolution is a Phase 2 concern, but the adapter shape is not allowed to assume exclusivity in Phase 1.
    - **Secrets stay local, always.** API keys and any secrets never enter the canonical record shape and never sync. The secure-store lifecycle (concern #2) is explicitly orthogonal to the storage-adapter lifecycle.

## Starter Template Evaluation

### Primary Technology Domain

**Cross-platform mobile app** (Expo / React Native / TypeScript), scaffolded inside a **pnpm monorepo** alongside an existing terminal package and a new platform-agnostic core package. The mobile package is the only one that benefits from a starter template; the core and terminal packages are authored directly.

### Starter Options Considered

| Option | Outcome |
| --- | --- |
| `create-expo-app` — `default` template | ✅ Selected |
| `create-expo-app` — `tabs` template | Rejected — PRD mandates stack-only navigation, no tab bar |
| Ignite CLI (Infinite Red) | Rejected — over-opinionated, violates NFR-M5 dependency cap, pre-commits to MobX / i18n / Reactotron which we have not chosen |
| T3 Turbo / Solito / similar polyrepo starters | Rejected — designed for web+mobile shared codebases with a backend tier; Phase 1 has no backend and no web target |
| Hand-scaffolded mobile package | Rejected as overkill for the mobile package itself, but applied to `@brain-break/core` |

### Selected Starter — `create-expo-app` (default template) for `packages/mobile` only

**Rationale for Selection.** Minimum viable scaffolding that matches every locked Phase 1 decision (Expo managed, TypeScript, expo-router, no tab bar) without importing opinions we haven't made (state management, UI kit, i18n, analytics). The Expo team maintains this path as their official recommendation; staying on it minimises upgrade friction across future Expo SDK releases. Dependency footprint out of the box is small enough to leave meaningful headroom under NFR-M5 (≤ 15 direct runtime deps beyond Expo core).

**Initialization Command (scaffolding sequence for a fresh clone).**

```bash
# 1. Initialize pnpm workspace at repo root (once, by hand).
#    Adds packages/core, packages/terminal, packages/mobile to workspace.
pnpm init

# 2. Core package — authored by hand, no starter.
mkdir -p packages/core/src
# (package.json, tsconfig.json, src/index.ts created directly in this workflow's later steps.)

# 3. Mobile package — scaffolded with the Expo default template.
cd packages
pnpm create expo-app mobile --template default

# 4. Install additional Expo SDK packages deliberately
#    (each justified in the Dependency Inventory section below).
cd mobile
npx expo install expo-sqlite expo-secure-store expo-haptics expo-linking
```

**Architectural Decisions Provided by the Expo Default Template:**

- **Language & Runtime:** TypeScript (`tsconfig.json` with `strict`), React Native via Expo managed workflow, Hermes JavaScript engine on both iOS and Android.
- **Routing:** `expo-router` pre-installed and configured. File-based routing inside `app/`. Stack navigator is the default; no tab bar is scaffolded.
- **Build Tooling:** Metro bundler (Expo-provided config), Babel with Expo preset. No custom Webpack, no custom Metro config required at scaffold time.
- **Testing Framework:** None shipped by default. Selection (Jest + React Native Testing Library, or Vitest + a React Native renderer) is a separate architectural decision documented later in this document.
- **Code Organization:**
  - `app/` — route files (mirrors URL / navigation hierarchy).
  - `components/` — reusable UI components.
  - `assets/` — static assets (fonts, images).
  - The Brain Break–specific structure (`services/`, `hooks/`, `theme/`, `native-bridges/`) is layered on top and documented in the Module Inventory section later.
- **Development Experience:** `expo start` for dev server with Expo Go or a Dev Client; hot reload; TypeScript intellisense.
- **Not decided by the starter, decided later in this document:**
  - Chart library for the Stats screen
  - Unit and integration testing framework
  - Linting and formatting beyond Expo defaults
  - Icon set
  - Error-boundary library (or hand-rolled)

### Scaffolding Discipline

- The `@brain-break/core` package is authored by hand — no starter. It is a plain TypeScript library: `package.json`, `tsconfig.json`, `src/`, tests. This keeps its surface area minimal and its dependency graph clean (no bundler config, no build step beyond `tsc`).
- The existing `packages/terminal` package is migrated *in place* from the current `src/` tree during core extraction. No starter template is applied to it.
- Initialization of `packages/mobile` is the first concrete implementation task and should be the first implementation story under the mobile epic.

## Core Architectural Decisions

### Decisions Locked in Prior Planning (for reference, not re-decided here)

| Area | Decision | Source |
| --- | --- | --- |
| Language & strictness | TypeScript with `strict: true` everywhere (core, terminal, mobile) | Existing codebase + Step 3 |
| Runtime | Node.js (terminal), Hermes (mobile iOS + Android) | Expo default |
| Repo topology | pnpm monorepo: `@brain-break/core`, `packages/terminal`, `packages/mobile` | Party-mode transcript |
| Mobile navigation | `expo-router` stack navigator, no tab bar | PRD + party mode |
| Mobile persistence | `expo-sqlite` behind `IStorageAdapter` | PRD + party mode |
| Secret storage | `expo-secure-store` (Keychain / Keystore); nowhere else | PRD NFR-S1, FR63 |
| Haptics | `expo-haptics` | PRD |
| External linking | `expo-linking` / `expo-web-browser` | PRD |
| AI providers (Phase 1) | OpenAI, Anthropic, Gemini, Ollama, OpenAI-compatible; Copilot terminal-only | PRD FR3, NFR-M1 |
| Observability | Apple App Store Connect + Google Play Android Vitals only; no in-app SDK | PRD NFR-PR4 |
| Theme | Dark-only; semantic tokens in `theme.ts` | PRD + party mode |
| Build pipeline (mobile) | EAS Build + EAS Submit; `preview` + `production` channels | PRD |
| Mobile starter | `create-expo-app` default template | Step 3 |

### D1 — Canonical Record Identity: **ULID**

**Decision.** Every newly-created record (`Domain`, `QuestionRecord`, future `Bookmark`, etc.) carries an `id: string` field. IDs are **ULIDs** (26-character, Crockford-base32, timestamp-prefixed, lexicographically sortable) generated at creation time on whichever platform creates the record.

**Rationale.** ULID is collision-safe across devices without coordination, sorts chronologically, is URL- and filename-safe (relevant for Phase 2 Drive sync where records may be individual files), and is roughly half the width of a UUID v4 when rendered. Sequential integers were excluded because they require a central counter — incompatible with the no-single-writer invariant (concern #11). UUID v4 was also acceptable but loses the sort-by-creation property for free.

**Impact.** `@brain-break/core` exports a `newId()` helper and a `ulidSchema` Zod schema. Both platforms call `newId()` at record-creation time. ULIDs are treated as opaque by both adapters.

**Library:** `ulid` (npm) — zero-dep, ~1 KB gzipped.

### D2 — Mobile State Management: **React Hooks + Context**

**Decision.** No external state-management library on mobile. Application state lives in:

- React component state (`useState`, `useReducer`) for screen-local state.
- A small number of Context providers for truly app-wide state: `ThemeContext`, `SettingsContext`, `ProviderConfigContext`, `PlatformCapabilitiesContext`.
- The storage adapter is the source of truth for persisted data; screens read from it via dedicated hooks (`useDomains`, `useDomain(id)`, `useHistory(domainId)`, etc.) that are thin wrappers around `IStorageAdapter` calls.

**Rationale.** Screens in Brain Break Mobile are largely independent (no dashboard aggregating across surfaces, no real-time updates, no collaborative state). The storage layer handles persistence. Adding a state-management library would be a pure dependency cost for no structural benefit. Respects NFR-M5.

**Excluded and why.**

- Zustand / Jotai — light but still unnecessary given independent screens.
- Redux Toolkit — over-powered for the data-flow volume.
- MobX — reactivity-heavy; same over-powered verdict.
- TanStack Query — server-cache semantics don't apply; there is no server.

**Impact.** A dedicated `packages/mobile/hooks/` folder hosts data hooks. A `packages/mobile/contexts/` folder hosts the four app-wide providers.

### D3 — Async / AI Call Pattern: **Hand-rolled `useAsyncCall` + AI envelope**

**Decision.** All async operations — AI calls, key validation, storage reads/writes — go through a hand-rolled hook that owns the full lifecycle:

- loading / success / error state
- cancellability via `AbortController`
- user-friendly error translation (maps provider-specific errors to a closed set of UI-facing kinds: `NETWORK`, `RATE_LIMIT`, `INVALID_KEY`, `PROVIDER_ERROR`, `TIMEOUT`, `UNKNOWN`)
- retry affordance surfaced to the caller
- optional minimum loading-state duration to avoid flicker (guarantees NFR-P4 ≥ 100 ms indicator)

The hook is implemented in `packages/mobile/hooks/useAsyncCall.ts` for UI integration; the underlying pure function is in `@brain-break/core` so terminal's text UI can use it too.

**Rationale.** Concern #3 ("AI call envelope") must be honored uniformly. A library like TanStack Query would bring server-cache-invalidation machinery we do not need; the actual requirement is a small, well-shaped hook. Hand-rolling is ~100 lines of code, zero deps, and testable in isolation.

**Excluded and why.**

- TanStack Query — server-cache model does not apply to our local-first model.
- SWR — same reason as TanStack Query.
- `react-use-async` / similar — usually thin wrappers; not worth a dependency.

### D4 — SQLite Schema Shape: **Canonical JSON + Indexed Columns (hybrid)**

**Decision.** On mobile, SQLite stores each record as **the exact canonical JSON document** emitted by `@brain-break/core`'s serializer, plus a small set of indexed columns for query performance. SQLite is a cache of the document, not a competing model.

**Table shape (illustrative — finalized in Module Inventory step).**

```sql
CREATE TABLE domains (
  id           TEXT PRIMARY KEY,           -- ULID from canonical document
  slug         TEXT NOT NULL,              -- indexed for Home list ordering
  archived     INTEGER NOT NULL DEFAULT 0, -- indexed for active/archived split
  updated_at   INTEGER NOT NULL,           -- indexed for sync cursor
  created_at   INTEGER NOT NULL,
  document     TEXT NOT NULL               -- canonical JSON blob (full Domain record)
);

CREATE INDEX idx_domains_archived_updated ON domains (archived, updated_at);
CREATE INDEX idx_domains_slug             ON domains (slug);

CREATE TABLE question_records (
  id           TEXT PRIMARY KEY,
  domain_id    TEXT NOT NULL,
  bookmarked   INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL,
  created_at   INTEGER NOT NULL,
  document     TEXT NOT NULL
);

CREATE INDEX idx_qr_domain_created    ON question_records (domain_id, created_at DESC);
CREATE INDEX idx_qr_domain_bookmarked ON question_records (domain_id, bookmarked);
```

**Rationale.**

- Honors concern #11 bidirectional sync invariant — the `document` column holds exactly what a Google Drive file will contain. The indexed columns exist purely for query speed.
- Satisfies NFR-P6 (local reads < 300 ms at ≥1000 history entries) via `idx_qr_domain_created` and `idx_qr_domain_bookmarked`.
- Eliminates dual-schema drift risk: there is only one schema (the Zod schema in core), never two (Zod + SQL DDL). The DDL exists only for indexes and primary keys.
- Survives future schema additions without destructive migrations — new fields land inside `document`, and new indexed columns can be added via forward-only `ALTER TABLE`.

**Rejected alternatives.**

- Fully normalized relational tables — doubles the schema source-of-truth surface; every field addition requires DDL; high risk of drift with terminal's file-system records.
- Pure JSON blob with no indexed columns — violates NFR-P6 for history-heavy domains.
- NoSQL-style key-value — expo-sqlite is the supported path; a second storage engine is avoidable dependency cost.

### D5 — Charting Library: **`react-native-gifted-charts`**

**Decision.** The Stats screen uses `react-native-gifted-charts`.

**Rationale.** One direct dependency, no native Skia peer dependency, actively maintained, simpler surface area than the Victory family. Fits Brain Break's single-screen chart use case (accuracy and score trends over time) without adding rendering infrastructure we don't need elsewhere. Respects NFR-M5.

**Rejected alternatives.**

- `victory-native` (Skia generation) — pulls in `@shopify/react-native-skia` as peer, materially heavier, unnecessary for our chart complexity.
- `react-native-svg` + hand-rolled charts — higher code-ownership cost without corresponding benefit for one screen.

### D6 — Testing Strategy: **Vitest for core + terminal, Jest + RNTL for mobile**

**Decision.**

- `@brain-break/core` and `packages/terminal` use **Vitest** (already in the terminal codebase).
- `packages/mobile` uses **Jest** + **`@testing-library/react-native`** + **`jest-expo`** preset.

**Rationale.** The React Native ecosystem is Jest-native — `jest-expo` is the official preset and handles RN's transformer + Metro interplay out of the box. Vitest RN support remains experimental. Keeping core/terminal on Vitest preserves zero regression risk on the existing terminal suite.

**Impact.** The monorepo has two test runners. A root `pnpm test` script dispatches to each package. CI runs both. Shared test utilities (fixtures for `Domain`, `QuestionRecord`, fake `AiProvider`, fake `IStorageAdapter`) live in `@brain-break/core/testing/` and are consumed by both runners without framework coupling.

### D7 — Iconography: **`@expo/vector-icons`**

**Decision.** Use `@expo/vector-icons` (bundled with Expo default template). No additional icon library.

**Rationale.** Zero new dependency. Covers every icon Brain Break needs (MaterialCommunityIcons alone is sufficient for the full screen set). No custom SVG pipeline to maintain.

### Decision Priority Summary

**Critical (blocking implementation):** D1 (record identity), D4 (SQLite schema shape), D6 (testing strategy) — these constrain every subsequent module.

**Important (shape architecture):** D2 (state management), D3 (async pattern) — set the idioms every screen will follow.

**Aesthetic / auxiliary:** D5 (charts), D7 (icons) — could be swapped later with limited blast radius.

### Deferred Decisions (revisited later in this document or in Phase 2)

- Migration framework API details → Step 5 (Implementation Patterns).
- Error-boundary library choice → Step 5 (will likely be hand-rolled, trivial).
- Linter/formatter rules beyond Expo defaults → Step 8 (Development Workflow).
- AI-error taxonomy mapping rules → Step 5 (Implementation Patterns).
- CI/CD workflow specifics → Step 9 (Infrastructure).
- Conflict-resolution strategy for Phase 2 Drive sync → Phase 2 architecture pass.
- Onboarding-gate state machine → Step 5 or Step 7 (Module Inventory).

### Cross-Component Dependencies

- D1 (ULID) is assumed by **every** adapter, every schema, and the Phase 2 sync design. First to land.
- D4 (SQLite shape) depends on D1 and on the canonical record shape finalised in Step 7 (Module Inventory). Can be scaffolded in parallel; the DDL finalises when the Zod schemas do.
- D3 (useAsyncCall) depends on the error taxonomy defined in Step 5. Shipping it early with a placeholder error kind is acceptable; the final enum lands with Step 5.
- D2 (hooks + context) depends on nothing; can be implemented as the very first mobile commit after scaffolding.
- D6 (test strategy) must be in place before the first test lands in either core or mobile.

## Implementation Patterns & Consistency Rules

### Purpose of This Section

Brain Break's code will be written by a mix of human (George, solo) and AI coding agents over time. The PRD's maintainability NFRs (M1–M5) require that code produced by different agents looks like it came from the same author. This section documents the patterns every contributor — human or AI — must follow. Anti-patterns are listed alongside to make drift detectable in code review.

**Simplicity rule.** Where a choice exists between two patterns of comparable quality, we take the one with less infrastructure cost. Patterns below are reviewer-enforced; no custom lint rules are added in Phase 1.

---

### Naming Conventions

**TypeScript source files.**

- React components → `PascalCase.tsx` (e.g. `DomainRow.tsx`, `QuizQuestion.tsx`).
- Hooks → `useXxx.ts` (e.g. `useDomains.ts`, `useAsyncCall.ts`).
- Pure logic / utilities / adapters → `camelCase.ts` (e.g. `newId.ts`, `sqliteAdapter.ts`).
- Type/interface-only files → `xxx.types.ts` only when separation is justified; otherwise co-locate types next to code.
- Test files → co-located `xxx.test.ts(x)`; no `__tests__/` folders.
- Route files (mobile) → lowercase kebab-case per `expo-router` convention (`domain/[id]/play.tsx`).

**TypeScript identifiers.**

- Types, interfaces, classes, React components → `PascalCase`.
- Functions, variables, hook names → `camelCase`.
- Constants (true compile-time constants) → `SCREAMING_SNAKE_CASE`. Runtime config values are `camelCase`.
- Booleans → always prefixed: `is`, `has`, `can`, `should`, `was`.
- **Interfaces are not prefixed with `I`.** No exceptions. The storage adapter contract is `StorageAdapter`, the AI provider contract is `AiProvider`.

**Canonical record fields (the Zod schema in `@brain-break/core`).**

- All record fields in camelCase: `id`, `createdAt`, `updatedAt`, `domainId`, `bookmarkedAt`.
- **Timestamps are ISO 8601 strings everywhere** — inside the canonical document, inside SQLite columns, inside filesystem records. ISO 8601 sorts correctly as text, so SQLite indexes on these columns still produce chronological ordering. One representation end to end.
- IDs are ULIDs (D1), always stored in the field literally named `id`.

**SQLite schema.**

- Table names → snake_case plural: `domains`, `question_records`, `settings`.
- Column names → snake_case: `id`, `domain_id`, `updated_at`, `created_at`, `archived`, `bookmarked`, `document`.
- Index names → `idx_<table>_<columns_in_order>` (e.g. `idx_qr_domain_created`).
- `updated_at` / `created_at` columns are `TEXT` holding ISO 8601 strings (not integers). One timestamp format end to end.
- Rationale: snake_case is idiomatic SQL and visually distinguishes SQL identifiers from TS ones during code review.

**Anti-patterns to reject in review.**

- Components named in kebab-case or snake_case files.
- Hooks named without the `use` prefix.
- Boolean fields/variables without `is/has/can/should` prefix.
- Snake_case fields inside the canonical record shape.
- CamelCase SQLite column names.
- `I`-prefixed interface names.
- Epoch millisecond integers or `Date` objects crossing the storage boundary.

---

### Project Structure Patterns

**Tests are co-located** next to the source they test. `useDomains.ts` sits beside `useDomains.test.ts`. No `__tests__/` mirroring.

**Components are organised by domain, not by type.**
- `components/domain/DomainRow.tsx` (feature-scoped)
- `components/quiz/QuizQuestion.tsx`
- `components/common/Button.tsx` (used everywhere)
- **Not** `components/buttons/`, `components/cards/`, `components/lists/`.

**Hooks live in `hooks/`** at the same level as `components/`. Data hooks (`useDomains`, `useHistory`) are separate files from UI hooks (`useKeyboardHeight`).

**Core (`@brain-break/core`) internal structure.**
- `schemas/` — Zod schemas + types (source of truth).
- `storage/` — `StorageAdapter` interface + canonical (de)serialization.
- `ai/` — `AiProvider` interface + concrete providers (per-provider subfolder).
- `identity/` — `newId()`, ULID helpers.
- `migrations/` — forward-only migration framework.
- `parity/` — platform-capabilities map type + helpers.
- `async/` — `runAsyncCall` pure function (UI wrapper hooks live in consumer packages).
- `errors/` — shared error taxonomy (`AiErrorKind`, `StorageErrorKind`).
- `utils/` — small pure helpers (hash, slugify, format). Everything that was in `src/utils/` pre-extraction.
- `testing/` — shared test fixtures and fakes.
- `index.ts` — the public surface. **Everything consumed by terminal or mobile comes through here.** Nothing reaches into core subpaths.

**Mobile (`packages/mobile`) structure.**
- `app/` — expo-router route files.
- `components/` — see convention above.
- `hooks/` — data hooks + UI hooks.
- `contexts/` — the four app-wide Context providers.
- `theme/` — tokens + helpers.
- `services/` — platform-specific adapters (the concrete `SqliteAdapter` that implements `StorageAdapter`, the concrete `SecureStoreKeyRepository`).
- `native-bridges/` — thin wrappers over Expo SDK modules (haptics, linking, browser) exposed as functions, not scattered Expo imports.

**Terminal (`packages/terminal`) structure.**
- Preserves the existing `src/` layout during extraction (router, screens, existing tests). Additions beyond extraction follow the core conventions above.
- Concrete `FileSystemAdapter` implementing `StorageAdapter`.
- Concrete `EnvKeyRepository` (terminal reads keys from env / settings file, not secure-store).

---

### Canonical Record Shape

**The canonical record shape is the contract that makes Phase 2 bidirectional sync possible.** It is owned by `@brain-break/core/schemas/`; neither terminal nor mobile defines record types.

**Rules.**

1. Every new record has `id: ULID`, `createdAt: ISOString`, `updatedAt: ISOString`.
2. Optional fields are explicitly optional (`field?: T` in TS, `.optional()` in Zod). Never use `null` for "not set" — use absence.
3. Dates are ISO 8601 strings everywhere (document, SQLite columns, filesystem records). `Date` objects never cross the storage boundary.
4. Enumerated values are `string` literal unions with named constants in core (e.g. `TONE_NATURAL = 'natural' as const`), not arbitrary strings passed around.
5. Schema evolution: adding a field is a forward-only change. Removing a field is forbidden; deprecate instead.
6. Reading an unknown field silently ignores it (forward compatibility). Writing always emits the full known set.

**Anti-patterns.**

- Defining a `Domain` type inside `packages/mobile` or `packages/terminal`.
- Using `null` as "field not set."
- Returning `Date` objects from the adapter.
- Non-ULID `id`s on new records.
- Schema fields in snake_case.

---

### `StorageAdapter` Contract (detailed rules)

The full TypeScript surface lands in Step 7 (Module Inventory). The *behavioural* rules live here because multiple adapters will implement them and must behave identically.

1. **No single-writer assumption** (cross-cutting concern #11). Every read can find a record newer than the last write issued by this process.
2. **Validate on read AND on write.** Adapters parse with the Zod schema before returning and before persisting. Invalid data at the storage boundary throws a typed `StorageError`.
3. **Atomicity per record.** Updating a record is all-or-nothing. In SQLite, use a single `UPDATE`. In the filesystem, write to a tempfile and rename.
4. **Last-writer-wins on `updatedAt`.** Phase 1 has no concurrent writers in practice, but the contract is defined now so Phase 2 does not have to retrofit it.
5. **Adapters do not emit events.** Consumers re-read when they expect changes. No pub/sub in the Phase 1 storage surface.
6. **Adapters accept ISO-string timestamps.** They persist them as strings in both the `document` JSON and the indexed columns.
7. **Secrets never cross the adapter.** API keys are never arguments to or return values of any `StorageAdapter` method.

---

### AI Call Envelope

Every call to an AI provider — whether for quiz generation, explain, teach-me-more, coach one-liner, or key validation — goes through a single wrapper with uniform shape.

**Shape (conceptual; signatures finalised in Step 7).**

```ts
// In @brain-break/core/async/runAsyncCall.ts
type AsyncCallResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; kind: AiErrorKind; message: string; retryable: boolean };

type AsyncCallOptions = {
  signal?: AbortSignal;            // cancellation
  timeoutMs?: number;              // default 20_000
  minLoadingMs?: number;           // default 150 (anti-flicker, satisfies NFR-P4)
};

// Consumed by mobile via useAsyncCall and by terminal via runAsyncCall directly.
```

**Rules.**

- No `fetch` calls to AI providers outside the `ai/` folder. UI code calls `runAsyncCall(() => provider.generateQuestion(...))`.
- Every AI operation returns `AsyncCallResult<T>` — never throws to the caller. Exceptions are caught inside the envelope and mapped to `AiErrorKind`.
- Loading state is a single boolean the UI binds to. Mobile's `useAsyncCall` hook exposes `{ status, data, error, run, cancel }` and nothing more.
- Retries are always user-initiated. No automatic retry on transient failures — it creates silent latency tax and hides problems.

**`AiErrorKind` (closed union, defined in `@brain-break/core/errors/`).**

| Kind | Meaning | User-facing message template |
| --- | --- | --- |
| `NETWORK` | No connectivity or DNS failure | "Can't reach the AI provider. Check your connection and try again." |
| `TIMEOUT` | Exceeded `timeoutMs` | "The AI took too long to respond. Try again in a moment." |
| `INVALID_KEY` | Provider rejected credentials | "Your API key looks invalid. Update it in Settings." |
| `RATE_LIMIT` | Provider reports throttling | "You've hit your provider's rate limit. Try again shortly." |
| `PROVIDER_ERROR` | Provider returned a non-transient error | "The AI provider reported an error. Try again." |
| `UNKNOWN` | Anything else | "Something went wrong. Try again." |

Provider implementations map their native errors into these kinds inside `ai/<provider>/errorMapper.ts`. UI never sees provider-specific shapes.

**Anti-patterns.**

- UI components `catch`-ing exceptions from AI calls.
- Surfacing HTTP status codes or provider-specific strings to the user.
- Silent retries.

---

### Data Hooks Pattern (mobile)

Every screen that displays persisted data consumes it via a data hook, never directly via the adapter.

**Convention.**

```ts
function useDomains(): {
  status: 'loading' | 'ready' | 'error';
  domains: Domain[];
  error?: StorageError;
  reload: () => void;
}
```

- Every data hook exposes `status`, the data, an optional error, and a `reload` function.
- Components render from `status`. One render per state. No conditional chains on `data && !error && !loading`.
- Hooks own their internal `useEffect` and dependency arrays; components pass primitive arguments, not objects.

---

### Error Taxonomy (two classes, no more)

1. **Expected, user-addressable errors** → typed error objects with a `kind` in a closed union (`AiErrorKind`, `StorageErrorKind`). Surfaced via the `AsyncCallResult` / data-hook `error` field.
2. **Unexpected, program-bug errors** → thrown `Error` instances. Caught by the app-level error boundary (cross-cutting concern #4). Logged to console in dev; allowed to bubble to the platform's native crash reporter in production. No swallowing.

Anti-pattern: a `try/catch` that swallows an error and returns `null` or `undefined`. Every caught error must either be converted to a typed kind or rethrown.

---

### Loading State Pattern

Every screen that can be in a loading state renders from a single discriminated state value (`status`), not from multiple booleans.

```ts
// ✅ Good
switch (status) {
  case 'loading': return <Spinner />;
  case 'error':   return <ErrorPanel onRetry={reload} />;
  case 'ready':   return <DomainList domains={domains} />;
}

// ❌ Bad
if (loading) return <Spinner />;
if (error) return <ErrorPanel />;
if (!data) return null;
return <DomainList />;
```

- Loading indicators appear within 100 ms (NFR-P4), via `minLoadingMs` on the AI envelope or immediately for storage reads.
- Every network-required screen has the full `loading / offline-blocked / provider-error / empty / populated` state family defined (cross-cutting concern #8).

---

### Theme Usage Pattern

- All colors come from `theme.ts` tokens: `theme.colors.background`, `theme.colors.surface`, `theme.colors.text.primary`, `theme.colors.text.secondary`, `theme.colors.accent`, `theme.colors.success`, `theme.colors.error`.
- **Zero hex literals** in component files. Any color not in the token map is a proposal to add a token, not a one-off. (Reviewer-enforced.)
- Typography also flows through `theme.typography.*`.
- Spacing from `theme.spacing.*` (4 / 8 / 12 / 16 / 24 / 32).
- Accessed via `useTheme()` hook, not directly imported, so Phase 3 light-theme is a provider swap.

**Anti-patterns.** `color: '#111'` in a component. `marginTop: 14` (not on the scale). `fontSize: 16` without a token.

---

### Parity Contract Usage Pattern

Features that diverge between terminal and mobile are gated through the parity contract, never through `Platform.OS` checks.

```ts
// ✅ Good
const caps = usePlatformCapabilities();
if (caps.asciiArtMilestone) { /* render terminal-only surface */ }

// ❌ Bad
if (Platform.OS === 'ios' || Platform.OS === 'android') { /* skip */ }
```

Rationale: compile-time breakage when someone adds a new divergent feature without updating the capability map.

---

### Migration Framework Pattern

- Migrations live in `@brain-break/core/migrations/` as individually numbered forward-only transformations: `001-initial.ts`, `002-add-coach-scope.ts`, etc.
- Each migration exports `{ version: number; up: (record: unknown) => unknown }`. Down-migrations are forbidden (NFR-R4).
- Adapters replay migrations in order when reading a record whose embedded `schemaVersion` is lower than the current version. Newly-written records always carry the latest `schemaVersion`.
- No inline `ALTER TABLE` or ad-hoc field transforms in adapter code. All schema evolution goes through a numbered migration.

---

### Enforcement

All of the above patterns are **mandatory** for new code. Enforcement is deliberately low-infrastructure in Phase 1:

- **Tool-enforced (built-in only):** TypeScript `strict` compiler + Expo's default ESLint config + Prettier. No custom lint rules.
- **Reviewer-enforced:** every pattern above — naming, file structure, adapter behaviour, AI envelope usage, data-hook shape, error taxonomy, theme token discipline, parity contract discipline, migration discipline.
- **Review checklist** in `docs/planning-artifacts/mobile/review-checklist.md` — lightweight, produced when implementation begins, not as part of this workflow.

Patterns are amended, not abandoned. Any change to this section is a PR that updates this document first, then the affected code.

## Project Structure & Boundaries

### Repository Root (pnpm monorepo)

```
brain-break/
├── README.md
├── LICENSE
├── package.json                     # workspace root; scripts that fan out to packages
├── pnpm-workspace.yaml              # declares packages/*
├── tsconfig.base.json               # shared strict TS config; packages extend it
├── .gitignore
├── .nvmrc                           # pinned Node version
├── .github/
│   └── workflows/
│       └── ci.yml                   # single workflow covering all three packages
├── docs/
│   ├── planning-artifacts/          # PRD, architecture, UX specs, epics (unchanged)
│   └── implementation-artifacts/    # per-story tech specs (unchanged)
├── _bmad/                           # BMAD tooling (unchanged)
├── packages/
│   ├── core/                        # @brain-break/core — platform-agnostic
│   ├── terminal/                    # existing app, thinned
│   └── mobile/                      # new Expo app
└── patches/                         # pnpm patches (vscode-jsonrpc already present)
```

**Root-level scripts (`package.json`).**

- `pnpm build` → builds core, then terminal, then mobile (Expo typecheck).
- `pnpm test` → runs all package test suites: Vitest for core + terminal, Jest for mobile.
- `pnpm lint` → ESLint + Prettier across all packages.
- `pnpm typecheck` → `tsc --noEmit` across all packages.
- `pnpm -F @brain-break/core <cmd>` for per-package scripts.

---

### `packages/core` — `@brain-break/core`

Platform-agnostic library. Zero runtime dependencies on Node APIs, Expo APIs, filesystem, or React Native. Pure TypeScript + `zod` + `ulid`.

```
packages/core/
├── package.json                     # name: "@brain-break/core", type: "module"
├── tsconfig.json                    # extends ../../tsconfig.base.json; outDir: dist
├── vitest.config.ts
├── src/
│   ├── index.ts                     # public surface — re-exports only
│   ├── schemas/
│   │   ├── domain.ts                # Domain, DomainMeta, DomainFile (canonical record)
│   │   ├── question.ts              # QuestionRecord, Bookmark fields
│   │   ├── settings.ts              # Settings, ToneOfVoice, CoachScope enums
│   │   ├── schemaVersion.ts         # current version constant; used by migrations
│   │   ├── domain.test.ts
│   │   ├── question.test.ts
│   │   └── settings.test.ts
│   ├── identity/
│   │   ├── newId.ts                 # ULID generator
│   │   └── newId.test.ts
│   ├── storage/
│   │   ├── StorageAdapter.ts        # interface + StorageError types
│   │   ├── canonicalSerialize.ts    # JSON.stringify with stable field order
│   │   ├── canonicalParse.ts        # JSON.parse + Zod validate
│   │   ├── canonicalSerialize.test.ts
│   │   └── canonicalParse.test.ts
│   ├── migrations/
│   │   ├── index.ts                 # migration runner
│   │   ├── 001-initial.ts
│   │   ├── migrations.test.ts
│   │   └── types.ts                 # { version, up } type
│   ├── scoring/
│   │   ├── applyAnswer.ts           # moved from src/domain/scoring.ts — pure, implements FR27
│   │   ├── speedTier.ts
│   │   └── scoring.test.ts
│   ├── ai/
│   │   ├── AiProvider.ts            # interface
│   │   ├── prompts.ts               # moved from src/ai/prompts.ts
│   │   ├── prompts.test.ts
│   │   ├── openai/
│   │   │   ├── provider.ts
│   │   │   ├── errorMapper.ts
│   │   │   ├── provider.test.ts
│   │   │   └── errorMapper.test.ts
│   │   ├── anthropic/
│   │   │   ├── provider.ts
│   │   │   ├── errorMapper.ts
│   │   │   ├── provider.test.ts
│   │   │   └── errorMapper.test.ts
│   │   ├── gemini/
│   │   │   ├── provider.ts
│   │   │   ├── errorMapper.ts
│   │   │   ├── provider.test.ts
│   │   │   └── errorMapper.test.ts
│   │   ├── ollama/
│   │   │   ├── provider.ts
│   │   │   ├── errorMapper.ts
│   │   │   ├── provider.test.ts
│   │   │   └── errorMapper.test.ts
│   │   └── openaiCompatible/
│   │       ├── provider.ts
│   │       ├── errorMapper.ts
│   │       ├── provider.test.ts
│   │       └── errorMapper.test.ts
│   ├── async/
│   │   ├── runAsyncCall.ts          # AI call envelope (pure function)
│   │   └── runAsyncCall.test.ts
│   ├── errors/
│   │   ├── AiErrorKind.ts           # closed union + user-facing message map
│   │   ├── StorageErrorKind.ts
│   │   └── errors.test.ts
│   ├── parity/
│   │   ├── PlatformCapabilities.ts  # type + default map
│   │   └── capabilities.test.ts
│   ├── utils/
│   │   ├── hash.ts                  # moved from src/utils/
│   │   ├── slugify.ts
│   │   ├── format.ts
│   │   ├── hash.test.ts
│   │   ├── slugify.test.ts
│   │   └── format.test.ts
│   └── testing/                     # NOT re-exported from index.ts; imported via subpath
│       ├── fakeStorageAdapter.ts
│       ├── fakeAiProvider.ts
│       ├── fixtures.ts              # sample Domain, QuestionRecord, Settings
│       └── index.ts
└── dist/                            # tsc output, gitignored
```

**Public surface (`src/index.ts`) exports ONLY:**

- Record types + schemas: `Domain`, `DomainFile`, `QuestionRecord`, `Settings`, and their Zod schemas.
- Identity: `newId`, `ulidSchema`.
- Storage contract: `StorageAdapter`, `StorageError`, `StorageErrorKind`, `canonicalSerialize`, `canonicalParse`.
- AI contract: `AiProvider`, provider factory functions (`createOpenAiProvider`, etc., excluding Copilot), `AiErrorKind`, `classifyProviderError` (generic core version).
- Scoring: `applyAnswer`, `getSpeedTier`, `SpeedThresholds`, `ApplyAnswerResult` — ensures mobile and terminal score identically (FR27).
- Async: `runAsyncCall`, `AsyncCallResult`, `AsyncCallOptions`.
- Migrations: `runMigrations`, `CURRENT_SCHEMA_VERSION`.
- Parity: `PlatformCapabilities`, `defaultCapabilities`.
- Utils: `hash`, `slugify`, `format`.

Test fixtures and fakes are imported from the **`@brain-break/core/testing`** subpath, never from the main entry.

---

### `packages/terminal` — existing app, thinned

The current `src/` tree moves here in place. Terminal-specific concerns (router, screens, Copilot provider, filesystem adapter, terminal key repository) stay; platform-agnostic concerns are deleted and imported from `@brain-break/core`.

```
packages/terminal/
├── package.json                     # depends on @brain-break/core (workspace:*)
├── tsconfig.json                    # extends root base
├── vitest.config.ts
├── src/
│   ├── index.ts                     # existing entry point, adjusted imports
│   ├── router.ts                    # unchanged behaviour; imports types from core
│   ├── router.test.ts
│   ├── router.challenge.test.ts
│   ├── router.regression.test.ts
│   ├── regression.test.ts
│   ├── index.test.ts
│   ├── storage/
│   │   ├── FileSystemAdapter.ts     # implements StorageAdapter from core
│   │   └── FileSystemAdapter.test.ts
│   ├── ai/
│   │   └── copilot/                 # TERMINAL-ONLY provider (stays here)
│   │       ├── provider.ts
│   │       ├── errorMapper.ts
│   │       └── provider.test.ts
│   ├── keys/
│   │   └── EnvKeyRepository.ts      # reads keys from env / settings.json
│   ├── parity/
│   │   └── terminalCapabilities.ts  # { exit: true, copilot: true, theme: true, asciiArt: true, sprint: true, challenge: true }
│   ├── screens/                     # unchanged; existing 25+ screens
│   │   └── ...
│   ├── __test-helpers__/
│   └── __snapshots__/
└── dist/
```

**Deletions from the pre-extraction tree** (these live in `@brain-break/core` after extraction; no behavioural change):

- `src/ai/providers.ts` (non-Copilot parts) → `core/src/ai/<provider>/provider.ts`.
- `src/ai/prompts.ts` → `core/src/ai/prompts.ts`.
- `src/ai/client.ts` → redistributed between `core/src/async/runAsyncCall.ts` and per-provider modules.
- `src/domain/schema.ts` → `core/src/schemas/`.
- `src/domain/scoring.ts` → `core/src/scoring/`. Pure function, implements FR27 (terminal scoring rules). Mobile must score identically; moving it to core is the only way to guarantee parity without duplication.
- `src/domain/store.ts` → split: filesystem reads/writes become `FileSystemAdapter`, Zod validation moves to `core/src/storage/canonicalParse.ts`.
- `src/utils/hash.ts`, `slugify.ts`, `format.ts` → `core/src/utils/`.
- `src/utils/screen.ts` (terminal-specific ANSI helper) → **stays in terminal** under `src/screens/` or a new `src/terminal-ui/`.

---

### `packages/mobile` — new Expo app

Scaffolded by `create-expo-app` with the default template; Brain Break structure layered on top.

```
packages/mobile/
├── package.json                     # depends on @brain-break/core (workspace:*)
├── tsconfig.json                    # extends root base + Expo types
├── app.json                         # Expo config (name, slug, iOS/Android targets, permissions=none)
├── eas.json                         # EAS Build/Submit config (preview + production)
├── babel.config.js
├── metro.config.js                  # (if monorepo resolution tweak needed)
├── jest.config.js                   # preset: jest-expo
├── .expo/                           # Expo local state, gitignored
├── assets/                          # fonts, icons, splash (Expo-managed)
│   ├── icon.png
│   ├── splash.png
│   └── fonts/
├── app/                             # expo-router routes (file-based)
│   ├── _layout.tsx                  # root stack + providers (Theme, Settings, ProviderConfig, Capabilities)
│   ├── index.tsx                    # Home screen (FR10–FR17)
│   ├── onboarding/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                # provider picker (FR3, FR4)
│   │   └── setup/
│   │       └── [provider].tsx       # per-provider key entry + validation (FR5–FR8)
│   ├── create-domain.tsx            # FR13
│   ├── archived.tsx                 # FR14–FR15
│   ├── settings/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                # FR51
│   │   ├── ai-provider.tsx          # FR52–FR53
│   │   ├── language.tsx             # FR54
│   │   ├── tone.tsx                 # FR55
│   │   ├── coach-scope.tsx          # FR56
│   │   └── welcome-exit.tsx         # FR57
│   └── domain/
│       └── [id]/
│           ├── _layout.tsx
│           ├── index.tsx            # Domain menu (FR18–FR21)
│           ├── play.tsx             # Quiz loop (FR22–FR30)
│           ├── play/
│           │   ├── explain.tsx      # FR31, FR33
│           │   └── teach-more.tsx   # FR32, FR33
│           ├── history.tsx          # FR40–FR42
│           ├── bookmarks.tsx        # FR35–FR39
│           ├── stats.tsx            # FR43–FR45
│           ├── coach.tsx            # FR46–FR50
│           └── delete.tsx           # FR20 confirmation route
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── TextInput.tsx
│   │   ├── ScreenContainer.tsx
│   │   ├── Spinner.tsx
│   │   ├── ErrorPanel.tsx
│   │   └── EmptyState.tsx
│   ├── domain/
│   │   ├── DomainRow.tsx
│   │   ├── DomainMenu.tsx
│   │   └── CreateDomainForm.tsx
│   ├── quiz/
│   │   ├── QuizQuestion.tsx
│   │   ├── AnswerOption.tsx
│   │   ├── CoachOneLiner.tsx
│   │   └── AnswerFeedback.tsx
│   ├── history/
│   │   └── HistoryRow.tsx
│   ├── bookmarks/
│   │   └── BookmarkRow.tsx
│   ├── settings/
│   │   └── SettingRow.tsx
│   └── stats/
│       └── AccuracyChart.tsx        # wraps react-native-gifted-charts
├── hooks/
│   ├── useAsyncCall.ts              # mobile-side UI wrapper around core runAsyncCall
│   ├── useDomains.ts                # data hook — FR10
│   ├── useDomain.ts                 # data hook
│   ├── useHistory.ts                # data hook — FR40
│   ├── useBookmarks.ts              # data hook — FR37
│   ├── useStats.ts                  # data hook — FR43
│   ├── useCoach.ts                  # FR46
│   ├── useSettings.ts
│   ├── useProviderConfig.ts
│   ├── useKeyboardHeight.ts
│   └── *.test.ts
├── contexts/
│   ├── ThemeContext.tsx
│   ├── SettingsContext.tsx
│   ├── ProviderConfigContext.tsx
│   ├── PlatformCapabilitiesContext.tsx
│   └── *.test.tsx
├── theme/
│   ├── tokens.ts                    # colors, spacing, typography, radii
│   ├── theme.ts                     # active theme (dark); useTheme() hook
│   └── tokens.test.ts
├── services/
│   ├── SqliteAdapter.ts             # implements StorageAdapter from core
│   ├── SqliteAdapter.test.ts
│   ├── SecureStoreKeyRepository.ts  # wraps expo-secure-store
│   ├── SecureStoreKeyRepository.test.ts
│   ├── mobileCapabilities.ts        # concrete PlatformCapabilities for mobile
│   └── keyValidator.ts              # NFR-S5: launch-time key validation
├── native-bridges/
│   ├── haptics.ts                   # expo-haptics wrapper (success, error, tap)
│   ├── linking.ts                   # expo-linking / expo-web-browser wrappers
│   └── *.test.ts
└── app-errors/
    ├── ErrorBoundary.tsx            # app-level RN error boundary
    └── globalHandler.ts             # installs unhandled-rejection handler
```

---

### Architectural Boundaries

**Import direction (strict).**

```
@brain-break/core        ← imported by both
        ↑                ↑
packages/terminal   packages/mobile      (never import each other)
```

- `core` never imports from `terminal` or `mobile`. Enforced by the absence of those paths in core's `package.json` dependencies.
- `terminal` and `mobile` never import each other. They are peer consumers of `core`.
- Neither consumer reaches into core's subpaths (`@brain-break/core/schemas/foo` is forbidden, except for the documented `@brain-break/core/testing` subpath).

**Runtime boundaries.**

- **Storage boundary:** every read and write of persisted data goes through a `StorageAdapter` instance, injected at the app entry point. The concrete `SqliteAdapter` and `FileSystemAdapter` live in their respective consumer packages. The interface and validation live in core.
- **AI boundary:** every call to an AI provider goes through an `AiProvider` instance returned by `core`'s factory functions. Raw HTTP is confined to provider modules inside `core/src/ai/<provider>/`. UI code never calls `fetch`.
- **Secret boundary:** API keys enter the system at the provider-setup and Settings screens, flow through a `KeyRepository` interface (typed in core, implemented per-platform), and are consumed by `AiProvider` factories. Keys never appear in records, logs, or storage adapter calls.
- **Parity boundary:** feature-visibility decisions consult `PlatformCapabilities`. `Platform.OS` checks are forbidden for feature gating (they're allowed for pixel-perfect platform layout adjustments, if ever needed).

**Data flow at runtime.**

```
  User tap
     │
     ▼
  Screen (app/)
     │
     ▼
  Hook (hooks/useXxx.ts)
     │
     ├──── useAsyncCall ───▶ runAsyncCall ─▶ AiProvider ─▶ provider HTTP
     │                                             │
     │                                             └── errorMapper ─▶ AiErrorKind
     │
     └──── StorageAdapter.read/write ─▶ canonicalParse/Serialize ─▶ SQLite / filesystem
```

---

### Requirements to Structure Mapping

Each PRD FR lives in a predictable location:

| FR range | Capability | Mobile location | Core dependency |
| --- | --- | --- | --- |
| FR1–FR9 | Onboarding & provider setup | `app/onboarding/`, `services/keyValidator.ts`, `services/SecureStoreKeyRepository.ts` | `core/ai/<provider>/provider.ts`, `core/errors/AiErrorKind.ts` |
| FR10–FR17 | Home & domain management | `app/index.tsx`, `app/archived.tsx`, `hooks/useDomains.ts` | `core/schemas/domain.ts`, `core/storage/StorageAdapter.ts` |
| FR18–FR21 | Domain menu | `app/domain/[id]/index.tsx`, `components/domain/DomainMenu.tsx` | — |
| FR22–FR30 | Play (quiz) loop | `app/domain/[id]/play.tsx`, `components/quiz/*`, `hooks/useAsyncCall.ts`, `native-bridges/haptics.ts` | `core/ai/<provider>/provider.ts`, `core/async/runAsyncCall.ts`, `core/schemas/question.ts`, `core/scoring/applyAnswer.ts` (FR27) |
| FR31–FR34 | Explain / Teach-me-more | `app/domain/[id]/play/explain.tsx`, `app/domain/[id]/play/teach-more.tsx`, `hooks/useAsyncCall.ts` | `core/ai/prompts.ts`, `core/async/runAsyncCall.ts` |
| FR35–FR39 | Bookmarks | `app/domain/[id]/bookmarks.tsx`, `hooks/useBookmarks.ts` | `core/schemas/question.ts`, `core/storage/StorageAdapter.ts` |
| FR40–FR42 | History | `app/domain/[id]/history.tsx`, `hooks/useHistory.ts` | `core/storage/StorageAdapter.ts` |
| FR43–FR45 | Stats (domain-scoped) | `app/domain/[id]/stats.tsx`, `hooks/useStats.ts`, `components/stats/AccuracyChart.tsx` | `core/utils/format.ts` |
| FR46–FR50 | My Coach | `app/domain/[id]/coach.tsx`, `hooks/useCoach.ts` | `core/schemas/domain.ts` (coach fields), `core/ai/prompts.ts` |
| FR51–FR60 | Settings | `app/settings/*`, `hooks/useSettings.ts`, `hooks/useProviderConfig.ts` | `core/schemas/settings.ts`, `core/parity/PlatformCapabilities.ts` |
| FR61–FR65 | Data persistence & local storage | `services/SqliteAdapter.ts` | `core/storage/StorageAdapter.ts`, `core/identity/newId.ts`, `core/migrations/` |
| FR66–FR69 | Network & offline behavior | `components/common/ErrorPanel.tsx`, `hooks/useAsyncCall.ts` | `core/async/runAsyncCall.ts`, `core/errors/AiErrorKind.ts` |
| FR70–FR71 | Parity transparency | `app/settings/index.tsx` (About link), store listings | `core/parity/PlatformCapabilities.ts` |

### Cross-Cutting Concerns to Locations

| Concern | Location |
| --- | --- |
| Schema source-of-truth | `core/src/schemas/` |
| Secure-key lifecycle | `services/SecureStoreKeyRepository.ts` + `services/keyValidator.ts` (mobile); `keys/EnvKeyRepository.ts` (terminal) |
| AI call envelope | `core/src/async/runAsyncCall.ts` + `hooks/useAsyncCall.ts` |
| Error boundaries without SDK | `app-errors/ErrorBoundary.tsx` + `app-errors/globalHandler.ts` (mobile); native unhandled-exception surfacing (terminal) |
| Dependency injection at bootstrap | `app/_layout.tsx` (mobile); `src/index.ts` (terminal) |
| Migration framework | `core/src/migrations/` |
| Scoring rules (FR27) | `core/src/scoring/` — single source of truth for terminal + mobile |
| Theming tokens layer | `theme/tokens.ts` + `theme/theme.ts` (mobile only) |
| Offline-aware UI states | `components/common/ErrorPanel.tsx`, `components/common/EmptyState.tsx` + hook `status` discriminator |
| Parity contract surface | `core/src/parity/` + `services/mobileCapabilities.ts` (mobile) + `parity/terminalCapabilities.ts` (terminal) |
| Build pipeline discipline | `.github/workflows/ci.yml` + `eas.json` |
| Bidirectional sync readiness | `core/src/storage/canonicalSerialize.ts` + `canonicalParse.ts` + adapter contract rules |

---

### Configuration Files

| File | Purpose |
| --- | --- |
| `tsconfig.base.json` | Root strict TypeScript config. Packages `extends` this. |
| `packages/core/tsconfig.json` | `outDir: dist`, `declaration: true`. No JSX. |
| `packages/terminal/tsconfig.json` | `outDir: dist`. No JSX. |
| `packages/mobile/tsconfig.json` | `extends: expo/tsconfig.base` + root base. JSX via Expo. |
| `packages/mobile/app.json` | Expo config: app name, slug, iOS bundleId, Android package, supported orientations (portrait only), minimum iOS 16 / Android 10, dark-mode only. Permissions list empty. |
| `packages/mobile/eas.json` | Two profiles: `preview` (internal testing / TestFlight / Play Internal), `production` (store submission). |
| `.github/workflows/ci.yml` | Runs `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test` across all three packages. Mobile EAS build is triggered manually or on release tags, not every PR. |
| `pnpm-workspace.yaml` | `packages: [packages/*]` |

---

### Asset Organization (mobile only)

- `packages/mobile/assets/icon.png` — app icon, 1024×1024.
- `packages/mobile/assets/splash.png` — launch screen.
- `packages/mobile/assets/fonts/` — any custom fonts (Phase 1 may use Expo's system font stack; fonts folder exists for future additions).
- No image assets beyond these. All UI is text + icons from `@expo/vector-icons`. Any future raster asset requires an architectural review.

---

### Development Workflow Touchpoints

- **Fresh clone:** `pnpm install` at root. Then `pnpm -F @brain-break/terminal dev` to run terminal; `pnpm -F @brain-break/mobile start` to run mobile (Expo dev server).
- **Running tests:** `pnpm test` runs everything. `pnpm -F <pkg> test` scopes to one package.
- **Adding a core schema field:** edit the Zod schema → add a numbered migration in `core/src/migrations/` → update adapter tests in both consumer packages → land the feature code in consumer package.
- **Shipping a new mobile build:** PR merges trigger CI; EAS Build + Submit run on tagged release commits.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility.** All technology choices are mutually compatible: Expo managed workflow + React Native + expo-router + expo-sqlite + expo-secure-store + expo-haptics + expo-linking + `@expo/vector-icons` form a single supported Expo stack. Non-Expo runtime additions — `zod`, `ulid`, `react-native-gifted-charts` — have no conflicts with the Expo stack.

**Pattern Consistency.** Every implementation pattern in Step 5 is directly enabled by a structural location in Step 6: data hooks live in `hooks/`, contexts in `contexts/`, theme tokens in `theme/`, native bridges in `native-bridges/`, platform-specific adapters in `services/`. No pattern references a directory that isn't in the structure.

**Structure Alignment.** Import direction (`core` ← `terminal`, `core` ← `mobile`, never between consumers) is enforced by the absence of cross-package dependencies in each `package.json`. Public surface discipline (core's `index.ts` re-exports only) is the only supported consumption path.

**Single timestamp representation.** ISO 8601 strings appear everywhere: canonical document fields, SQLite `TEXT` columns, filesystem records. No conversion layer exists to go wrong.

**No contradictions detected.**

### Requirements Coverage Validation ✅

**Functional requirements.** All 71 FRs are mapped to specific mobile locations and core dependencies in the Requirements-to-Structure table (Step 6). No FR is orphaned.

**Non-functional requirements.** Every NFR has a named architectural enforcer:

| NFR group | Enforcer |
| --- | --- |
| NFR-P1 (cold start < 2s) | Expo + Hermes + minimal SDK deps + no heavy work in `app/_layout.tsx` |
| NFR-P2 (Domain tap < 250ms) | Local SQLite read + `expo-router` push |
| NFR-P3 (AI p50/p95) | `runAsyncCall.timeoutMs` default 20 000; measurement reviewer-enforced |
| NFR-P4 (indicator < 100ms) | `runAsyncCall.minLoadingMs` default 150 |
| NFR-P5 (haptic < 50ms) | `native-bridges/haptics.ts` invoked synchronously from tap handlers |
| NFR-P6 (local reads < 300ms @ 1000 entries) | D4 hybrid schema + `idx_qr_domain_created` index |
| NFR-S1 (secret-store exclusivity) | `SecureStoreKeyRepository` + adapter boundary rule #7 |
| NFR-S2 (HTTPS only) | Provider modules use HTTPS endpoints; reviewer-enforced |
| NFR-S3 (keys only to configured endpoint) | Provider factories accept key + endpoint together; no shared key store across providers |
| NFR-S4 (no background network) | No background task registration in `app.json`; reviewer-enforced |
| NFR-S5 (launch-time key validation) | `services/keyValidator.ts` runs at `_layout.tsx` bootstrap |
| NFR-PR1–PR6 (data not collected) | No analytics/crash SDK in dependency inventory; store privacy labels documented |
| NFR-R1 (≥99.5% crash-free) | `ErrorBoundary` + `globalHandler` + platform-native crash dashboards |
| NFR-R2 (no data loss on termination) | Adapter atomicity rule #3 |
| NFR-R3 (network errors never crash) | Closed `AiErrorKind` union; all errors typed |
| NFR-R4 (forward-only migrations) | `migrations/` + `CURRENT_SCHEMA_VERSION` + pattern rules |
| NFR-R5 (offline usable) | Local-first by construction |
| NFR-A1–A6 (a11y baseline) | A11y labels reviewer-enforced; dynamic type via `theme.typography`; 44×44 touch via spacing tokens |
| NFR-M1 (single core source) | Import-direction rule |
| NFR-M2 (no platform-local schema) | Canonical record shape rules |
| NFR-M3 (new fields ship migration) | Migration pattern + dev workflow touchpoint |
| NFR-M4 (solo dev, one Mac) | No infra beyond Expo + EAS |
| NFR-M5 (< 15 runtime deps) | Confirmed at 8; 7 of headroom — see Dependency Inventory below |

### Dependency Inventory (mobile runtime)

| # | Package | Purpose | Source |
| --- | --- | --- | --- |
| 1 | `@brain-break/core` | Workspace core | workspace:* |
| 2 | `expo-sqlite` | Local persistence (D4) | Expo SDK |
| 3 | `expo-secure-store` | Secret storage (NFR-S1) | Expo SDK |
| 4 | `expo-haptics` | Answer + bookmark feedback | Expo SDK |
| 5 | `expo-linking` | External URL opens | Expo SDK |
| 6 | `expo-web-browser` | System browser for provider key pages and Buy-me-a-coffee | Expo SDK |
| 7 | `react-native-gifted-charts` | Stats screen charts (D5) | npm |
| 8 | `@expo/vector-icons` | Icons (D7) | bundled in default template |

**Count: 8 direct runtime deps beyond Expo core. NFR-M5 (< 15) satisfied with 7 of headroom.**

Core runtime deps: `zod`, `ulid` (2). Test-time deps (`vitest`, `jest-expo`, `@testing-library/react-native`) are excluded from the NFR-M5 count per PRD wording.

### Gaps Found and Resolved

**G1 — Implicit `KeyRepository` interface made explicit.** Added to core structure: `core/src/keys/KeyRepository.ts` defines the interface consumed by AI provider factories; `SecureStoreKeyRepository` (mobile) and `EnvKeyRepository` (terminal) are the concrete implementations. Public surface updated to export `KeyRepository`.

**G2 — Phased core-extraction plan.** Added as a new section below.

**G3 — Copilot capability traced.** `PlatformCapabilities.copilotProvider` is `true` in `parity/terminalCapabilities.ts` and `false` in `services/mobileCapabilities.ts`. The mobile provider-setup screen (FR3, FR52) filters providers by this capability, making the "excluding GitHub Copilot" clause compile-time-enforced.

**G4 — Accessibility enforcement reviewer-only.** Trade-off accepted per the simplicity rule: Phase 1 has no a11y lint rules. NFR-A1–A6 are enforced via the review checklist.

---

## Phased Implementation Plan

This is the single most important deliverable in the architecture doc — it sequences every change so `main` stays green at every commit (PRD Risk Mitigation + NFR-M4). Each phase ends at a shippable state.

### Phase 0 — Workspace Foundation *(main green throughout)*

Goal: monorepo exists and terminal still builds + tests pass exactly as before.

1. Create `pnpm-workspace.yaml`, `tsconfig.base.json`, root `package.json` updates.
2. Create empty `packages/core/` with `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/index.ts` exporting nothing.
3. Create `packages/terminal/` shell; MOVE existing `src/`, `package.json` fields, `vitest.config.ts`, test helpers, snapshots into it.
4. Update all import paths in terminal source — `from '../domain/schema.js'` remains valid because it's still local. No cross-package imports yet.
5. Verify: `pnpm -F @brain-break/terminal test` passes; the existing CI workflow continues to pass.
6. Commit boundary.

### Phase 1 — Extract Pure Utilities (easiest, zero logic change)

1. Move `src/utils/hash.ts`, `slugify.ts`, `format.ts` (+ tests) into `core/src/utils/`.
2. Re-export from `core/src/index.ts`.
3. In terminal, replace `from '../utils/hash.js'` with `from '@brain-break/core'`.
4. Keep `src/utils/screen.ts` where it is (terminal-only).
5. Verify: terminal tests pass, core tests pass.
6. Commit.

### Phase 2 — Extract Schemas

1. Move `src/domain/schema.ts` (+ tests) into `core/src/schemas/` (split into `domain.ts`, `question.ts`, `settings.ts` along natural boundaries).
2. Add `schemaVersion.ts` with `CURRENT_SCHEMA_VERSION = 1`.
3. Re-export from core.
4. Update terminal imports.
5. Verify: all tests green.
6. Commit.

### Phase 3 — Extract Scoring

1. Move `src/domain/scoring.ts` (+ tests) into `core/src/scoring/`.
2. Re-export `applyAnswer`, `getSpeedTier`, types.
3. Update terminal imports.
4. Verify.
5. Commit.

### Phase 4 — Add Identity and Canonical Serialization

1. Add `core/src/identity/newId.ts` with `ulid` dependency.
2. Add `core/src/storage/canonicalSerialize.ts` and `canonicalParse.ts`.
3. Add tests.
4. Do NOT wire into terminal yet — pure additions; core tests alone must pass.
5. Commit.

### Phase 5 — Introduce `StorageAdapter` and Refactor Terminal `store.ts`

1. Add `core/src/storage/StorageAdapter.ts` (interface + `StorageError`, `StorageErrorKind`).
2. Add `core/src/errors/StorageErrorKind.ts`.
3. In terminal, create `src/storage/FileSystemAdapter.ts` that implements `StorageAdapter` using the logic currently in `src/domain/store.ts`.
4. Leave existing `store.ts` in place as a thin re-export that delegates to `FileSystemAdapter` singleton. Existing call-sites unchanged.
5. Verify: terminal tests pass with identical behavior.
6. Commit.
7. *(Optional follow-up commit)* remove the `store.ts` re-export shim by updating all call-sites to get `FileSystemAdapter` from a bootstrap module.

### Phase 6 — Extract AI Providers (non-Copilot)

1. Add `core/src/ai/AiProvider.ts` interface.
2. Add `core/src/ai/prompts.ts` (moved from `src/ai/prompts.ts`).
3. For each non-Copilot provider in `src/ai/providers.ts`, extract into `core/src/ai/<provider>/provider.ts` + `errorMapper.ts`. Each is a factory function `createOpenAiProvider(config)` returning an `AiProvider`.
4. In terminal, replace direct `providers.ts` usage with core's factory functions. Leave `src/ai/providers.ts` with only the Copilot factory + the generic classifier.
5. Verify: all terminal AI tests green.
6. Commit.

### Phase 7 — Add `runAsyncCall`, `AiErrorKind`, `KeyRepository`, `PlatformCapabilities`

1. Add all four as pure additions to core. Nothing in terminal uses them yet.
2. Add `parity/terminalCapabilities.ts` in terminal and wire its construction into terminal's bootstrap.
3. Add `keys/EnvKeyRepository.ts` in terminal.
4. Refactor terminal's AI invocation sites to use `runAsyncCall`. Translate existing string-error paths into `AiErrorKind`s via the per-provider error mappers.
5. Verify: terminal tests green; any test snapshots involving error strings updated.
6. Commit.

### Phase 8 — Migration Framework Skeleton

1. Add `core/src/migrations/` with runner + `001-initial.ts` (no-op baseline).
2. Core tests only.
3. Commit.

**🏁 End of core extraction.** Terminal now consumes every portable concern from `@brain-break/core`. Terminal behavior unchanged throughout. Main green at every commit.

### Phase 9 — Scaffold `packages/mobile`

1. `pnpm create expo-app packages/mobile --template default`.
2. Add to `pnpm-workspace.yaml` (already included via `packages/*`).
3. Declare `@brain-break/core` as `workspace:*` dependency.
4. Install `expo-sqlite`, `expo-secure-store`, `expo-haptics`, `expo-linking`, `expo-web-browser`, `react-native-gifted-charts` via `npx expo install`.
5. Add `jest.config.js` with `jest-expo` preset and an initial smoke test.
6. Verify: `pnpm -F @brain-break/mobile test` passes; `pnpm -F @brain-break/mobile start` launches Expo dev server; `expo prebuild` clean.
7. Commit.

### Phase 10 — Mobile Platform Primitives

Build the layer that makes the rest of the app possible.

1. `theme/tokens.ts` + `theme/theme.ts` + `ThemeContext`.
2. `services/SqliteAdapter.ts` implementing `StorageAdapter` using the D4 hybrid schema.
3. `services/SecureStoreKeyRepository.ts` + `services/keyValidator.ts`.
4. `services/mobileCapabilities.ts`.
5. `app-errors/ErrorBoundary.tsx` + `app-errors/globalHandler.ts`.
6. `native-bridges/haptics.ts` + `linking.ts`.
7. `hooks/useAsyncCall.ts` (mobile wrapper over core's `runAsyncCall`).
8. Root `app/_layout.tsx` wires all Contexts + StorageAdapter + KeyRepository + PlatformCapabilities.
9. Tests for each.
10. Multiple commits; each atomic.

### Phase 11 — Mobile Onboarding Flow (FR1–FR9)

First user-visible surface. High retention leverage per PRD.

1. `app/onboarding/index.tsx` — provider picker.
2. `app/onboarding/setup/[provider].tsx` — key entry + validation via `runAsyncCall`.
3. Deep-link to provider key pages (`linking.ts`).
4. Tests.
5. Commit.

### Phase 12 — Home + Create + Archived (FR10–FR17)

1. `useDomains`, `useDomain` hooks reading from `SqliteAdapter`.
2. `app/index.tsx` (Home) with zero-state.
3. `app/create-domain.tsx` (uses AI provider to seed first question via `runAsyncCall`).
4. `app/archived.tsx`.
5. `DomainRow` + `CreateDomainForm` + `EmptyState` + `Button` + `TextInput` components.
6. Commits per screen.

### Phase 13 — Domain Menu + Play Loop + Explain/Teach (FR18–FR34)

Core product loop. Highest implementation density.

1. `app/domain/[id]/index.tsx` (Domain menu).
2. `app/domain/[id]/play.tsx` using `runAsyncCall` for question generation and `applyAnswer` from core for scoring (FR27).
3. `QuizQuestion`, `AnswerOption`, `AnswerFeedback`, `CoachOneLiner` components.
4. `app/domain/[id]/play/explain.tsx` + `teach-more.tsx`.
5. Haptic integration on answer + bookmark.
6. Commits per screen.

### Phase 14 — History + Bookmarks + Stats (FR35–FR45)

1. `useHistory`, `useBookmarks`, `useStats` hooks.
2. Three screens + their row components.
3. `AccuracyChart` wrapping `react-native-gifted-charts`.
4. Commits per screen.

### Phase 15 — My Coach + Settings (FR46–FR60)

1. `useCoach` + `app/domain/[id]/coach.tsx`.
2. `useSettings` + `useProviderConfig` + six Settings screens (`index`, `ai-provider`, `language`, `tone`, `coach-scope`, `welcome-exit`).
3. `SettingRow` component.
4. About link to GitHub README (FR70).
5. Commits per screen.

### Phase 16 — Polish, A11y Pass, Store Assets

1. A11y pass: labels, dynamic type verification, contrast spot-check.
2. Icon, splash, Expo config finalization.
3. `eas.json` profiles (`preview`, `production`).
4. Store listings (FR71 disclosure: "phones only, dark-only, no sync yet").
5. First TestFlight / Play Internal build via EAS.
6. Commit.

### Phase 17 — Store Submission

1. EAS Submit to App Store Connect and Google Play.
2. Privacy labels: "Data Not Collected" across all categories.
3. Monitor first reviews.
4. Release tag.

---

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed (Step 2)
- [x] Scale and complexity assessed (medium, documented)
- [x] Technical constraints identified (party-mode locks + inherited codebase)
- [x] Cross-cutting concerns mapped (11 named concerns)

**Architectural Decisions**
- [x] D1–D7 documented with rationale and rejected alternatives (Step 4)
- [x] Decisions locked in prior planning listed for reference
- [x] Cross-component dependencies mapped

**Implementation Patterns**
- [x] Naming conventions established (files, identifiers, SQL, record fields)
- [x] Structure patterns defined (co-located tests, feature-based components)
- [x] Canonical record shape rules specified
- [x] StorageAdapter behavioural rules specified
- [x] AI call envelope + error taxonomy defined
- [x] Data hooks + loading state + theme + parity patterns specified

**Project Structure**
- [x] Complete three-package tree defined (core + terminal + mobile)
- [x] Public surface of core specified
- [x] Architectural boundaries (import direction, runtime boundaries, data flow) documented
- [x] All 71 FRs mapped to specific locations
- [x] All 11 cross-cutting concerns mapped to locations
- [x] Configuration files enumerated

**Validation**
- [x] Coherence verified
- [x] All 71 FRs covered
- [x] All 34 NFRs traced to enforcers
- [x] Dependency inventory under NFR-M5 cap (8 / 15)
- [x] Gaps identified and resolved
- [x] Phased implementation plan (Phases 0–17) defined

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **High.** All 71 FRs and 34 NFRs are mapped to architectural enforcers. Phased plan keeps `main` green at every commit. Dependency footprint has substantial headroom. No external infrastructure required. Bidirectional sync readiness is an explicit Phase 1 invariant, not a retrofit.

**Key Strengths.**
- Parity is structurally enforced: scoring, schemas, AI logic, error taxonomy all in core.
- Future Phase 2 Google Drive sync is a pure `StorageAdapter` implementation — no cross-cutting refactor.
- Zero backend and zero analytics SDK obligation, honoring the product's "your data" promise in architecture, not just policy.
- Solo-dev feasible — no infrastructure gating any phase.

**Areas for Future Enhancement (Phase 2+, not Phase 1 gaps).**
- Custom ESLint rules (theme tokens, `fetch` confinement) can be added later if pattern drift emerges.
- Cross-domain / global stats requires a data-aggregation layer currently out of scope.
- Hosted AI proxy provider slot is reserved but not implemented.
- Light theme is a provider swap but the alternate token set isn't authored.
- Conflict-resolution policy for Drive sync is an explicit Phase 2 design task.

### Implementation Handoff

**AI / Human Agent Guidelines.**
- Follow architectural decisions D1–D7 as documented. Propose changes via a doc update, not code drift.
- Use implementation patterns (Step 5) consistently. Reviewer-enforced, no lint backstop.
- Respect project structure (Step 6). Do not reach into core subpaths beyond `@brain-break/core/testing`.
- Refer to this document for all architectural questions before inventing.
- Canonical record shape and bidirectional sync invariants are non-negotiable.

**First Implementation Priority.** Begin at **Phase 0 — Workspace Foundation**. Do not skip to mobile scaffolding. Green `main` at every commit from Phase 0 through Phase 8 is a Phase 1 success criterion (PRD).

**First commit:** Create `pnpm-workspace.yaml` + `tsconfig.base.json` + root `package.json` updates + empty `packages/core/` + move existing `src/` into `packages/terminal/`. Verify terminal tests pass. Commit.
