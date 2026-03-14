---
Story: 2.1
Title: Home Screen — Display Domain List
Status: done
Epic: 2 — Domain Management
Created: 2026-03-07
---

# Story 2.1: Home Screen — Display Domain List

## Story

As a user,
I want the app to display a home screen on launch listing all active domains with their scores and question counts,
So that I can see my current progress at a glance and choose what to do next.

## Acceptance Criteria

- [x] AC1: Running `tsx src/index.ts` reaches the home screen within ≤ 2 seconds
- [x] AC2: The home screen lists all active (non-archived) domains, each showing: domain name, current score, and total questions answered
- [x] AC3: Available actions include: select a domain (per domain), create a new domain, view archived domains, and exit
- [x] AC4: When no domain files exist, the domain list is empty and the only primary action is "Create new domain" (exit still available)
- [x] AC5: Selecting "Exit" causes the process to exit cleanly with code 0

## Tasks / Subtasks

- [x] Task 1: Bootstrap `src/index.ts` to call `router.showHome()` (AC: 1)
  - [x] 1.1 Remove console.log + process.exit(0) stub; import `router.js` and await `router.showHome()`
  - [x] 1.2 Wrap in a top-level `async` IIFE with no explicit try/catch (errors propagate to Node's uncaught handler)

- [x] Task 2: Implement `src/router.ts` `showHome()` entry point (AC: 1)
  - [x] 2.1 Replace stub `placeholder()` export with `export async function showHome(): Promise<void>`
  - [x] 2.2 `showHome()` imports and awaits `screens/home.ts` `showHomeScreen()` — router never calls screens directly except via its own public functions
  - [x] 2.3 Add stub `showQuiz(slug: string)`, `showHistory(slug: string)`, `showStats(slug: string)` (return immediately — wired in later stories)

- [x] Task 3: Implement `src/screens/home.ts` home screen render loop (AC: 2, 3, 4, 5)
  - [x] 3.1 Export pure function `buildHomeChoices(entries: HomeEntry[]): Choice[]` — uses `HomeEntry` type for clean testability; `showHomeScreen()` maps domain data to HomeEntry before calling it
  - [x] 3.2 Import `listDomains`, `readDomain` from `domain/store.js`; filter using type-predicate for `!corrupted && !archived`
  - [x] 3.3 Build choices: domain entries as selectable items showing name + score + question count; separator; "Create new domain"; "View archived domains"; "Exit"
  - [x] 3.4 Empty state: when active list is empty, domain entries are absent — "Create new domain" is the first (highlighted) choice; "View archived domains" and "Exit" remain
  - [x] 3.5 Use `select` from `@inquirer/prompts` (functional API) to render the menu in a `while(true)` loop; re-render on every return unless action is "exit"
  - [x] 3.6 Handle `action === 'exit'`: call `process.exit(0)`
  - [x] 3.7 Handle `action === 'select'`: call `router.showQuiz(slug)` stub (no-op for now)
  - [x] 3.8 Handle `action === 'create'`: call `router.showCreateDomain()` stub (no-op for now — wired in Story 2.2)
  - [x] 3.9 Handle `action === 'archived'`: call `router.showArchived()` stub (no-op for now — wired in Story 2.4)

- [x] Task 4: Write co-located tests `src/screens/home.test.ts` (AC: 2, 3, 4)
  - [x] 4.1 Test `buildHomeChoices([])` returns correct choices: no domain entries, "Create new domain" is first non-separator choice, "Exit" present
  - [x] 4.2 Test `buildHomeChoices` with one active domain: domain entry first, shows score + question count, separator present before action items
  - [x] 4.3 Test `buildHomeChoices` with multiple domains: all active domains listed
  - [x] 4.4 Test display format: score and question count visible in name string
  - [x] 4.5 Test actions always present regardless of domain count

## Dev Notes

### Technical Context

**Entry point wiring (Tasks 1–2):**

`src/index.ts` must become an async IIFE that awaits `router.showHome()`:
```ts
// src/index.ts
#!/usr/bin/env node
import { showHome } from './router.js'
;(async () => { await showHome() })()
```
`src/router.ts` is the sole dispatcher — `showHome()` calls `showHomeScreen()` from screens/home:
```ts
// src/router.ts
import { showHomeScreen } from './screens/home.js'
export async function showHome(): Promise<void> { await showHomeScreen() }
export async function showQuiz(_slug: string): Promise<void> { /* stub — Story 2.3 */ }
export async function showCreateDomain(): Promise<void> { /* stub — Story 2.2 */ }
export async function showArchived(): Promise<void> { /* stub — Story 2.4 */ }
```
Screens import `router.js` for dispatch — this creates a circular-looking import (`home.ts` → `router.ts` → `home.ts`) but Node resolves this correctly since the call happens at runtime, not module-load time. Circular references at call-time (not import-time) are fine in ESM.

**`inquirer` v12 functional API:**

Inquirer v12 exports individual prompt functions. Use `select` for the home menu:
```ts
import { select, Separator } from 'inquirer'

const action = await select({
  message: 'brain-break',
  choices: buildHomeChoices(activeEntries),
  pageSize: 12,
})
```
`select` returns the `value` of the selected choice. Use `Separator` for visual grouping.

Choice shape:
```ts
type Choice = { name: string; value: { action: string; slug?: string } } | Separator
```

**`buildHomeChoices` — pure testable function:**

Extract this to make the screen unit-testable without mocking prompts:
```ts
export function buildHomeChoices(entries: DomainListEntry[]): (Choice | Separator)[] {
  const choices: (Choice | Separator)[] = []
  // Active domain entries
  for (const entry of entries) {
    if (entry.corrupted || entry.meta.archived) continue
    const totalQ = 0 // will be updated when history is accessible — counts come from meta in later stories
    choices.push({
      name: `${entry.slug}  ${dim(`score: ${entry.meta.score} | questions: ???`)}`,
      value: { action: 'select', slug: entry.slug },
    })
  }
```

Wait — `listDomains()` returns `DomainListEntry` with `meta: DomainMeta`. `DomainMeta` does NOT have a `totalQuestions` field directly. The question count is `domain.history.length` — but `listDomains()` only returns meta, not the full domain file. For Story 2.1, the total questions count can be derived from the domain file, but `listDomains` only loads meta.

**Decision:** For Story 2.1, load the full domain file for each active domain to get `history.length`, OR display only `score` and omit question count for now. Since the AC explicitly requires "total questions answered", we have two options:

1. Call `readDomain(slug)` for each active entry on home screen load (simple, acceptable for small N domains)
2. Add a `totalQuestions` field to `DomainMeta` schema (breaking change to schema/store)

**Chosen approach:** Load each domain file in parallel on home screen boot. The number of domains is small (single-digit) and NFR4 (≤ 2s) is still achievable for up to ~50 domains with parallel `Promise.all()`. Do NOT modify the schema — that's out of story scope.

```ts
// In showHomeScreen():
const listResult = await listDomains()
if (!listResult.ok) { /* display error, offer exit */ return }

// Load full domain files in parallel for question counts
const activeEntries = listResult.data.filter(e => !e.corrupted && !e.meta.archived)
const domainDetails = await Promise.all(
  activeEntries.map(async (entry) => {
    const r = await readDomain(entry.slug)
    return {
      slug: entry.slug,
      meta: r.ok ? r.data.meta : entry.meta,
      totalQuestions: r.ok ? r.data.history.length : 0,
    }
  })
)
```

**Choice display format:**
```
spring-boot-microservices   score: 120 · 15 questions
kubernetes-basics            score: 80 · 10 questions
──────────────────────────────
  Create new domain
  View archived domains
  Exit
```

Use `dim()` from `utils/format.ts` for the secondary stats text. Use `header()` or `bold()` for the domain name.

**Loop pattern:**
```ts
export async function showHomeScreen(): Promise<void> {
  while (true) {
    // re-load domain list on every iteration (catches changes from create/archive)
    ...
    const answer = await select({ ... })
    if (answer.action === 'exit') process.exit(0)
    if (answer.action === 'select') await router.showQuiz(answer.slug!)
    if (answer.action === 'create') await router.showCreateDomain()
    if (answer.action === 'archived') await router.showArchived()
    // loop continues — re-renders home screen after every action returns
  }
}
```

**Error surfaces:**
- `listDomains()` fails → print `error('Failed to load domains: ' + result.error)` + still show choice to "Create new domain" or "Exit"
- `readDomain()` fails for a specific slug on home screen → show `score: ?` / `questions: ?` gracefully (don't crash)

### Project Structure Notes

Files to create/modify (all others untouched):
- `src/index.ts` — replace 3-line stub entirely
- `src/router.ts` — replace 4-line stub entirely
- `src/screens/home.ts` — replace 4-line stub with full implementation
- `src/screens/home.test.ts` — new co-located test file

**Import path rules (NodeNext ESM):**
```ts
import { listDomains, readDomain } from '../domain/store.js'   // ✅
import { dim, error, bold } from '../utils/format.js'          // ✅
import { select, Separator } from 'inquirer'                   // ✅ (v12 named export)
import * as router from '../router.js'                         // ✅ (namespace import avoids init issues)
```

**Circular import note:** `screens/home.ts` imports `router.ts`, and `router.ts` imports `screens/home.ts`. This is safe because the import is static but the functions are only called at runtime, well after both modules are initialised. This is the exact pattern described in the architecture (`router.ts` is the only caller of screens, but screens may dispatch back via router).

### Testing Approach

Only `buildHomeChoices` (pure function) is unit-tested directly. The full `showHomeScreen()` render loop is not unit-tested in this story (requires complex inquirer mocking — deferred to integration/E2E scope).

Test file: `src/screens/home.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { buildHomeChoices } from './home.js'
import type { DomainListEntry } from '../domain/store.js'
```

Mock data pattern:
```ts
const activeEntry = (slug: string, score: number): DomainListEntry & { meta: DomainMeta } => ({
  slug,
  corrupted: false,
  meta: { score, difficultyLevel: 2, streakCount: 0, streakType: 'none',
          totalTimePlayedMs: 0, createdAt: new Date().toISOString(),
          lastSessionAt: null, archived: false },
})
```

**However:** `buildHomeChoices` as described above takes `DomainListEntry[]` without question counts. To keep it testable, refine the signature to take pre-computed display data:

```ts
// The pure, testable export:
export type HomeEntry = { slug: string; score: number; totalQuestions: number }
export function buildHomeChoices(entries: HomeEntry[]): (Choice | Separator)[]
```

The screen's `showHomeScreen()` does the async domain loading, maps to `HomeEntry[]`, then calls `buildHomeChoices`. This keeps the pure function clean and tests trivial.

### References

- Epic 2 Story 2.1 ACs: [docs/planning-artifacts/epics.md](../planning-artifacts/epics.md)
- Architecture — Module Architecture / src/ structure: [docs/planning-artifacts/architecture.md](../planning-artifacts/architecture.md)
- Architecture — Navigation pattern (router dispatch): architecture.md § "Terminal UI Architecture"
- Architecture — Error Handling Pattern (`Result<T>`): architecture.md § "Error Handling Patterns"
- Architecture — ESM import `.js` extension rule: architecture.md § "Format Patterns"
- `domain/store.ts` — `listDomains()`, `readDomain()`, `DomainListEntry`: [src/domain/store.ts](/src/domain/store.ts)
- `domain/schema.ts` — `DomainMeta`, `DomainFile`: [src/domain/schema.ts](/src/domain/schema.ts)
- `utils/format.ts` — `dim()`, `bold()`, `error()`, `header()`: [src/utils/format.ts](/src/utils/format.ts)
- Previous story (1.4) learnings — format.ts helpers, all imports `.js`, no barrel files: [docs/implementation-artifacts/1-4-utility-modules-hash-slugify-format.md](1-4-utility-modules-hash-slugify-format.md)
- inquirer v12 package: `inquirer` (declared in package.json dependencies)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- `select` and `Separator` are not exported from `inquirer` v12 — they live in `@inquirer/prompts` (transitive dep). Added `@inquirer/prompts` as a direct dep in `package.json` and updated import. Story dev notes incorrectly referenced `inquirer` as the import source.

### Completion Notes List

- All 4 tasks / subtasks complete + 7 review fixes. `index.ts`: async IIFE → `router.showHome()`. `router.ts`: dispatches to `showHomeScreen()`; stubs for quiz/create/archived/history/stats. `screens/home.ts`: `filterActiveDomains()` pure export (testable), `buildHomeChoices()`, `showHomeScreen()` loop with `ExitPromptError` catch (Ctrl+C clean exit), uses second `readDomain()` result for both score and totalQuestions (consistent data source). `home.test.ts`: 10 tests — 5 for `buildHomeChoices`, 5 for `filterActiveDomains` covering corrupted + archived exclusion. `package.json`: `@inquirer/prompts` pinned to `7.10.1`. 87/87 tests ✅. `tsc --noEmit` exits 0 ✅.

### Senior Developer Review (AI)

**Outcome:** Changes Requested → Fixed  
**Date:** 2026-03-07  
**Action Items:** 7 found, 7 resolved

#### Action Items

- [x] [High] Ctrl+C throws unhandled `ExitPromptError` from `@inquirer/core` — caught in `showHomeScreen()` loop, `process.exit(0)` called cleanly
- [x] [Med] `score` sourced from `listDomains()` result while `totalQuestions` sourced from second `readDomain()` — both now use `r.data` from the same `readDomain()` call, falling back to `entry.meta.score` only if read fails
- [x] [Med] Task 4.4 falsely claimed corrupted-entry test in `buildHomeChoices` (not testable there) — extracted `filterActiveDomains()` as pure export; added 5 tests in `filterActiveDomains` describe block covering corrupted, archived, and mixed exclusion
- [x] [Low] `console.log` used for error output — changed to `console.error` (stderr)
- [x] [Low] Score inconsistency between listDomains and readDomain results — resolved by M1/M2 fix above
- [x] [Low] Redundant `const allChoices = choices` alias in test — removed, using `choices` directly
- [x] [Low] `@inquirer/prompts` pinned to exact version `7.10.1` in package.json

### File List

- `src/index.ts`
- `src/router.ts`
- `src/screens/home.ts`
- `src/screens/home.test.ts`
- `package.json`
