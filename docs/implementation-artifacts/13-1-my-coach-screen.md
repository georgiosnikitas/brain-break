# Story 13.1: My Coach Screen

Status: done

## Story

As a user,
I want to select My Coach from the domain sub-menu and receive an AI-generated coaching report based on my answer history for the active domain — with instant access to a previously generated report and opt-in regeneration,
So that I can understand my strengths, weaknesses, and learning trajectory — and get actionable recommendations for what to focus on next.

## Acceptance Criteria

1. **Given** the domain sub-menu is displayed **When** I view the list of actions **Then** a `🏋️  My Coach` option appears after `📊 Statistics` and before `🎨 ASCII Art`

2. **Given** I select `🏋️  My Coach` from the domain sub-menu **When** the screen renders **Then** `clearAndBanner()` is called and the screen displays a header: `🏋️ My Coach — <domain>` (using `header()`, same pattern as Statistics)

3. **Given** My Coach has been used before (a `lastCoachReport` is stored in the domain file) **When** I open My Coach **Then** the previously generated report is displayed instantly without any AI call — the cached timestamp is shown and the tip/staleness rules still apply based on current history length

4. **Given** My Coach has never been used for this domain (no `lastCoachReport` stored) **When** I open My Coach **Then** a loading spinner is shown while the AI generates the first coaching report

5. **Given** the domain has at least 1 answered question **When** the AI coaching report is requested **Then** the history payload includes a structured summary per question from the scoped window (controlled by `settings.myCoachScope`): question text, user's chosen answer, correct answer, whether it was correct, difficulty level, time taken, and speed tier **And** when the domain has fewer questions than the selected scope, all available questions are included

6. **Given** the AI provider returns a coaching report **When** the report is displayed **Then** it covers four sections: **Strengths**, **Weaknesses**, **Learning trajectory**, and **Recommendations** **And** the report is generated using the active language and tone settings

7. **Given** the coaching report is displayed **When** I view the screen **Then** a dim generation timestamp is shown immediately below the header (e.g., `Generated: Apr 19, 2026 at 14:32`) **And** on generation, `lastCoachTimestamp` (ISO 8601), `lastCoachQuestionCount` (number, set to current `history.length`), and `lastCoachReport` (string, full report text) are persisted to the domain JSON file

8. **Given** the domain has fewer than 25 answered questions **When** the coaching report is displayed **Then** a dim tip is shown above the report: *"Tip: Reports become more accurate with at least 25 answered questions."*

9. **Given** the domain has 25 or more answered questions **When** the coaching report is displayed **Then** the tip is not shown

10. **Given** the coaching report is displayed **When** I view the navigation options **Then** two options are shown: **🔄 Regenerate** and **↩️  Back**

11. **Given** I select **🔄 Regenerate** **When** fewer than 25 new questions have been answered since the last report (`history.length - lastCoachQuestionCount < 25`) **Then** a dim staleness notice is displayed: *"Only X new questions answered since your last report — the new report may not differ significantly."* **And** a fresh report is generated and all three coach fields are updated

12. **Given** I select **🔄 Regenerate** **When** 25 or more new questions have been answered since the last report **Then** the staleness notice is not shown **And** a fresh report is generated and metadata updated

13. **Given** I select **↩️  Back** or press Ctrl+C **When** the action is triggered **Then** I am returned to the domain sub-menu

14. **Given** the AI provider is unreachable or the call fails **When** the error occurs **Then** the app displays the same provider-specific error message as NFR2 **And** the user is returned to the domain sub-menu — no crash

15. **Given** no provider is configured (`provider: null`) **When** I select My Coach **Then** the app displays: *"AI provider not ready. Go to Settings to configure."* and returns to the domain sub-menu

16. **Given** `src/screens/my-coach.ts` and `src/screens/my-coach.test.ts` are created **When** I run `npm test` **Then** all tests pass with no regressions

## Tasks / Subtasks

- [x] **Task 1: Add coach fields to domain schema** (AC: #7)
  - [x] 1.1 Add optional fields to `DomainMetaSchema` in `src/domain/schema.ts`: `lastCoachQuestionCount: z.number().int().min(0).optional()`, `lastCoachTimestamp: z.iso.datetime().optional()`, and `lastCoachReport: z.string().optional()`
  - [x] 1.2 Verify `defaultDomainFile()` does NOT include these fields (they are only written after a report is generated)
  - [x] 1.3 Write schema tests: domain files with and without coach fields pass Zod validation; fields absent from `defaultDomainFile()` output

- [x] **Task 2: Add `myCoachScope` to settings schema** (AC: #3)
  - [x] 2.1 Add `myCoachScope` field to `SettingsFileSchema` in `src/domain/schema.ts`: `z.enum(['25', '100', 'all']).default('100')`
  - [x] 2.2 Update `defaultSettings()` to include `myCoachScope: '100'`
  - [x] 2.3 Write schema tests: `myCoachScope` accepts `"25"` / `"100"` / `"all"`, rejects other values, defaults to `"100"` when missing

- [x] **Task 3: Add `buildCoachReportPrompt()` to `src/ai/prompts.ts`** (AC: #3, #4)
  - [x] 3.1 Create `buildCoachReportPrompt(slug: string, scopedHistory: QuestionRecord[], settings?: SettingsFile): string` that starts with `voicePrefix(settings)` for language/tone injection, uses `sanitizeInput(slug)` for the domain name, includes a structured summary per question (question text, user answer, correct answer, isCorrect, difficultyLevel, timeTakenMs, speedTier), and instructs the AI to return a coaching report covering Strengths, Weaknesses, Learning trajectory, and Recommendations
  - [x] 3.2 Export `buildCoachReportPrompt` from `prompts.ts`
  - [x] 3.3 Write prompt tests: verify voice prefix is present with non-default settings, verify domain name is sanitized, verify history data is included, verify output instructions are present

- [x] **Task 4: Add `generateCoachReport()` to `src/ai/client.ts`** (AC: #3, #4, #12, #13)
  - [x] 4.1 Create `generateCoachReport(slug: string, scopedHistory: QuestionRecord[], settings?: SettingsFile): Promise<Result<string>>` that calls `callProvider(buildCoachReportPrompt(slug, scopedHistory, settings), settings)` — same pattern as `generateExplanation()` and `generateMotivationalMessage()`
  - [x] 4.2 Export `generateCoachReport` from `client.ts`
  - [x] 4.3 Write client tests: returns `Result<string>` with prose text on success; returns `{ ok: false, error }` on provider failure using `AI_ERRORS` classification; returns `AI_ERRORS.NO_PROVIDER` when settings.provider is null

- [x] **Task 5: Create `src/screens/my-coach.ts` — My Coach screen** (AC: #1–#14)
  - [x] 5.1 Create `showMyCoachScreen(slug: string): Promise<void>` following the ascii-art.ts Regenerate/Back loop pattern
  - [x] 5.2 Read domain with `readDomain(slug)` and handle error (return to domain menu)
  - [x] 5.3 Read settings with `readSettings()` — read fresh on each loop iteration (no caching)
  - [x] 5.4 Compute scoped history: slice `domain.history` to the most recent N questions based on `settings.myCoachScope` (`"25"` → last 25, `"100"` → last 100, `"all"` → all); if fewer questions than scope, use all
  - [x] 5.5 Call `clearAndBanner()` + render `header('🏋️ My Coach — ' + domainName)` using `header()` from `utils/format.ts`
  - [x] 5.6 Show `ora` spinner while calling `generateCoachReport(slug, scopedHistory, settings)`
  - [x] 5.7 On AI error: display error message using `error()` from format.ts, then return to domain menu
  - [x] 5.8 On AI success: render generation timestamp in dim text below header (format: `Generated: Mon DD, YYYY at HH:MM` using `dim()` from format.ts)
  - [x] 5.9 If `domain.history.length < 25`: render dim tip above the report: *"Tip: Reports become more accurate with at least 25 answered questions."*
  - [x] 5.10 Render the coaching report text
  - [x] 5.11 Persist `lastCoachQuestionCount = domain.history.length` and `lastCoachTimestamp = new Date().toISOString()` to domain file via `writeDomain()`
  - [x] 5.12 Show navigation: `🔄 Regenerate` + separator + `↩️  Back` using `select()` with `menuTheme`
  - [x] 5.13 On Regenerate: check staleness — if `domain.history.length - (domain.meta.lastCoachQuestionCount ?? 0) < 25`, show dim notice *"Only X new questions answered since your last report — the new report may not differ significantly."* before regenerating; then loop back to 5.5
  - [x] 5.14 On Back or `ExitPromptError` (Ctrl+C): return (caller routes to domain menu)

- [x] **Task 6: Wire My Coach into domain sub-menu and router** (AC: #1, #11)
  - [x] 6.1 Add `'my-coach'` to `DomainMenuAction` type in `src/screens/domain-menu.ts`
  - [x] 6.2 Add `{ name: '🏋️ My Coach', value: { action: 'my-coach' } }` to `buildDomainMenuChoices()` after Statistics and before ASCII Art
  - [x] 6.3 Add handler in domain-menu action dispatch: `else if (answer.action === 'my-coach') { await router.showMyCoach(slug) }`
  - [x] 6.4 Add `showMyCoach(slug: string): Promise<void>` to `src/router.ts` that delegates to `showMyCoachScreen(slug)` from `screens/my-coach.ts`
  - [x] 6.5 Write domain-menu tests: My Coach appears in menu choices after Statistics; selecting My Coach calls `router.showMyCoach(slug)`
  - [x] 6.6 Write router test: `showMyCoach` delegates to `showMyCoachScreen` with correct slug

- [x] **Task 7: Create `src/screens/my-coach.test.ts` — comprehensive screen tests** (AC: #14)
  - [x] 7.1 Test: header rendered with `🏋️ My Coach — <domain>`
  - [x] 7.2 Test: generation timestamp displayed in dim text
  - [x] 7.3 Test: AI called with scoped history (verify correct slice for each scope setting)
  - [x] 7.4 Test: report displays coaching text from AI
  - [x] 7.5 Test: tip shown when domain has <25 questions
  - [x] 7.6 Test: tip hidden when domain has ≥25 questions
  - [x] 7.7 Test: Regenerate generates fresh report and updates metadata
  - [x] 7.8 Test: staleness notice shown when <25 new questions since last report
  - [x] 7.9 Test: staleness notice hidden when ≥25 new questions since last report
  - [x] 7.10 Test: `lastCoachQuestionCount` and `lastCoachTimestamp` persisted via `writeDomain()`
  - [x] 7.11 Test: Back returns to domain sub-menu
  - [x] 7.12 Test: Ctrl+C (`ExitPromptError`) returns to domain sub-menu
  - [x] 7.13 Test: provider error handled gracefully — error shown, returns to menu
  - [x] 7.14 Test: no-provider guard — displays *"AI provider not ready..."*, returns to menu

## Dev Notes

### Implementation Order — Dependency on Stories 13.3 and 13.2

**Stories 13.3 and 13.2 should be implemented BEFORE this story.** If they are:
- **Task 1** (domain schema coach fields) is already done by Story 13.3 — verify the fields exist and check the task off
- **Task 2** (settings schema `myCoachScope`) is already done by Story 13.2 — verify the field exists and check the task off

If for any reason 13.3/13.2 were NOT implemented first, then Tasks 1–2 must be done here as written.

### Architecture Requirements

- **Screen pattern**: Follow `screens/ascii-art.ts` Regenerate/Back loop pattern — `clearAndBanner()` + header + content + `select()` in a loop
- **AI client pattern**: Follow `generateExplanation()` / `generateMotivationalMessage()` pattern — call `callProvider(buildCoachReportPrompt(...), settings)`, returns `Result<string>` (raw prose, NOT structured JSON — no Zod parsing on the response)
- **Prompt pattern**: Start with `voicePrefix(settings)` for language/tone injection, use `sanitizeInput()` on domain slug, include `"Reply with ONLY..."` instruction to prevent extraneous output
- **Navigation routing**: Router function delegates to screen function; domain-menu dispatches to router — screens never call each other directly
- **File I/O**: Only `domain/store.ts` writes to disk; screen calls `writeDomain()` to persist coach metadata after each successful report generation
- **Error handling**: Return `Result<T>` from AI functions; screen checks `.ok` and routes to domain menu on error — no raw `try/catch` in screens
- **Settings freshness**: Read `readSettings()` fresh on each loop iteration — do NOT cache — so changes to My Coach scope in Settings are reflected immediately on Regenerate
- **ESM imports**: All imports must use `.js` extension (NodeNext resolution requirement)

[Source: docs/planning-artifacts/architecture.md#My Coach Screen]
[Source: docs/planning-artifacts/architecture.md#API & Communication Patterns]
[Source: docs/planning-artifacts/architecture.md#Module Architecture]

### Key Implementation Details

**History scoping** — The scope is determined by `settings.myCoachScope`:
- `"25"` → `history.slice(-25)` (most recent 25)
- `"100"` → `history.slice(-100)` (most recent 100)
- `"all"` → full `history` array (no slicing)
- When history has fewer items than the scope, use all available

**Prompt construction** — Each question record in the scoped history includes: `question` (text), `userAnswer` (A/B/C/D), `correctAnswer` (A/B/C/D), `isCorrect` (boolean), `difficultyLevel` (1–5), `timeTakenMs` (number), `speedTier` (fast/normal/slow). This structured summary gives the AI enough signal to identify patterns without excessive token usage.

**Staleness detection** — On Regenerate:
1. Read fresh domain file (may have new questions since initial load)
2. Compute: `newQuestions = domain.history.length - (domain.meta.lastCoachQuestionCount ?? 0)`
3. If `newQuestions < 25`: show dim notice before regenerating
4. Always regenerate regardless of staleness

**Generation timestamp format** — Use `dim()` from `utils/format.ts`:
```typescript
const now = new Date()
const formatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  + ' at ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
console.log(dim(`Generated: ${formatted}`))
```

**Coach metadata persistence** — After each successful report generation:
```typescript
domain.meta.lastCoachQuestionCount = domain.history.length
domain.meta.lastCoachTimestamp = new Date().toISOString()
await writeDomain(slug, domain)
```

[Source: docs/planning-artifacts/prd.md#Feature 19 — My Coach]
[Source: docs/planning-artifacts/epics.md#Story 13.1: My Coach Screen]

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Usage |
|------|-------|-------|
| `clearAndBanner()` | `utils/screen.ts` | Call before rendering — standard screen shell |
| `header(text)` | `utils/format.ts` | Render screen headers — same pattern as stats.ts |
| `dim(text)` | `utils/format.ts` | Timestamp, tip, staleness notice |
| `error(text)` | `utils/format.ts` | AI error messages |
| `menuTheme` | `utils/format.ts` | Pass to `select()` for consistent menu styling |
| `select()`, `Separator` | `@inquirer/prompts` | Navigation menu |
| `ExitPromptError` | `@inquirer/core` | Catch Ctrl+C gracefully |
| `ora()` | `ora` | Loading spinner during AI call |
| `readDomain()` | `domain/store.ts` | Read domain file |
| `writeDomain()` | `domain/store.ts` | Persist coach metadata |
| `readSettings()` | `domain/store.ts` | Get My Coach scope, language/tone, provider |
| `callProvider()` | `ai/client.ts` (internal) | Provider-agnostic AI call via `generateCoachReport()` |
| `buildCoachReportPrompt()` | `ai/prompts.ts` (new) | Prompt builder with voice injection |
| `voicePrefix()` | `ai/prompts.ts` (internal) | Language/tone voice instruction |
| `sanitizeInput()` | `ai/prompts.ts` (internal) | Prevent prompt injection on domain name |
| `AI_ERRORS` | `ai/providers.ts` | Error message constants |
| `isAuthErrorMessage()` | `ai/client.ts` | Detect auth vs transient failures |

### Anti-Patterns to Avoid

- ❌ Do NOT use Zod schema validation on the coaching report text — it's free-form prose, not structured JSON
- ❌ Do NOT cache `readSettings()` or `readDomain()` — read fresh each loop iteration
- ❌ Do NOT call provider SDKs directly from the screen — use `generateCoachReport()` from `ai/client.ts`
- ❌ Do NOT store the coaching report text in the domain file — only `lastCoachQuestionCount` and `lastCoachTimestamp` are persisted
- ❌ Do NOT add the coach fields to `defaultDomainFile()` — they are only written after a report is generated (optional, absent by default)
- ❌ Do NOT import from `ai/providers.ts` in screen code — use `ai/client.ts` as the only AI interface for screens
- ❌ Do NOT use bare import specifiers — always include `.js` extension
- ❌ Do NOT throw errors from `generateCoachReport()` — return `Result<string>` with `{ ok: false, error: ... }`

### Previous Story Learnings (from Story 12.3)

- Settings schema: Use `z.union([z.literal(...), ...]).default(...)` for enum-like optional fields — `.default()` auto-applies when field is missing, no migration code needed
- When changing function signatures (adding parameters), update ALL call sites AND all tests
- Spinner lifecycle owned by the screen, not the AI client
- Test edge cases: minimum history (1 question), empty history, threshold boundaries
- Test baseline: ~939 passing tests — all must continue passing with no regressions

### Git Intelligence

Recent commits show Feature 8 (settings), answer verification, theme-aware colors, OpenAI Compatible API. The last feature Epic (12 — ASCII Art) is complete. The codebase is stable and mature — the My Coach screen follows all established conventions.

### Project Structure Notes

**New files:**
- `src/screens/my-coach.ts` — My Coach screen (F16)
- `src/screens/my-coach.test.ts` — co-located tests

**Modified files:**
- `src/domain/schema.ts` — add optional coach fields to `DomainMetaSchema`, add `myCoachScope` to `SettingsFileSchema`, update `defaultSettings()`
- `src/domain/schema.test.ts` — new tests for coach fields and `myCoachScope`
- `src/ai/client.ts` — add `generateCoachReport()` export
- `src/ai/client.test.ts` — new tests for `generateCoachReport()`
- `src/ai/prompts.ts` — add `buildCoachReportPrompt()` export
- `src/ai/prompts.test.ts` — new tests for coaching prompt
- `src/screens/domain-menu.ts` — add My Coach action type, choice, and handler
- `src/screens/domain-menu.test.ts` — updated tests for My Coach in menu
- `src/router.ts` — add `showMyCoach()` export
- `src/router.test.ts` — new test for `showMyCoach` delegation

### References

- [Source: docs/planning-artifacts/prd.md#Feature 19 — My Coach]
- [Source: docs/planning-artifacts/epics.md#Epic 13: My Coach]
- [Source: docs/planning-artifacts/epics.md#Story 13.1: My Coach Screen]
- [Source: docs/planning-artifacts/architecture.md#My Coach Screen]
- [Source: docs/planning-artifacts/architecture.md#API & Communication Patterns — Response Validation — Coaching report generation]
- [Source: docs/planning-artifacts/architecture.md#Module Architecture — src/ Directory Structure]
- [Source: docs/planning-artifacts/architecture.md#Navigation Pattern — Two-level menu with thin router]
- [Source: docs/planning-artifacts/architecture.md#Global Settings Architecture — Settings File Schema]
- [Source: docs/implementation-artifacts/12-3-ascii-art-milestone-setting.md — Previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (Amelia — Senior Software Engineer persona, bmad-dev workflow)

### Debug Log References

None — all 7 tasks completed without blocking issues. Two self-corrections: (1) consolidated `QuestionRecord` into existing schema import in `client.ts`, (2) refactored `showMyCoachScreen` by extracting `promptRegenerateOrBack`, `renderReport`, `computeStalenessNotice`, `generateAndPersist`, and `pressBack` helpers to satisfy SonarQube cognitive complexity limit (≤15).

### Completion Notes List

- **Follow-up review fix (2026-04-20):** Corrected regenerate staleness handling so the notice is computed from the last persisted report metadata on the regenerated render (`0` new questions on immediate regenerate, meaningful counts after new answers). Removed the extra one-option Back prompt on provider/no-provider/write failures so the screen returns directly to the domain sub-menu after displaying the error. Updated `my-coach.test.ts` to lock in both behaviors.
- **Schema (Tasks 1-2)**: Added optional `lastCoachQuestionCount` (int ≥ 0) and `lastCoachTimestamp` (ISO datetime) to `DomainMetaSchema`. Added `MyCoachScopeSchema = z.enum(['25','100','all'])` and `myCoachScope: MyCoachScopeSchema.default('100')` to `SettingsFileSchema`. Updated `defaultSettings()` with `myCoachScope: '100'`. Verified `defaultDomainFile()` does NOT emit the coach fields (optional by design).
- **Prompt (Task 3)**: Added `buildCoachReportPrompt(slug, scopedHistory, settings)` to `ai/prompts.ts`. Uses `voicePrefix()` for language/tone, `sanitizeInput()` on slug. Each history item rendered as a single line with `userAnswer`, `correctAnswer`, `isCorrect`, `difficultyLevel`, `timeTakenMs`, `speedTier`. Prompt requires four sections (Strengths / Weaknesses / Learning trajectory / Recommendations) and instructs the model to "Reply with ONLY the coaching report".
- **AI client (Task 4)**: Added `generateCoachReport(slug, scopedHistory, settings): Promise<Result<string>>` in `ai/client.ts`. Delegates to existing `callProvider()`, which already surfaces `AI_ERRORS.NO_PROVIDER = "AI provider not ready. Go to Settings to configure."` verbatim (AC #13) without any screen-level code.
- **Screen (Task 5)**: Created `src/screens/my-coach.ts` following the `ascii-art.ts` Regenerate/Back loop pattern. Reads settings fresh each iteration (no caching). Slices history per `myCoachScope`. Owns spinner lifecycle. On success: renders header, dim timestamp, optional staleness notice (<25 new since last report), optional tip (<25 total), then report body. Persists `lastCoachQuestionCount = history.length` + `lastCoachTimestamp = now.toISOString()` via `writeDomain` only after a successful AI call. Never throws.
- **Wiring (Task 6)**: Added `{action:'my-coach'}` to `DomainMenuAction`, inserted `🏋️ My Coach` choice between Statistics (index 4) and ASCII Art (now index 6), dispatches to `router.showMyCoach(slug)`. Added `showMyCoach` thin delegation in `router.ts`.
- **Tests (Task 7)**: Added 5 schema tests for `myCoachScope`, 6 for coach fields; 10 prompt tests; 8 AI client tests; 1 router delegation test; 1 domain-menu dispatch test plus updated 9 choice-index assertions; 21 new `my-coach.test.ts` tests covering rendering, scope slicing, persistence, regeneration, staleness, navigation, Ctrl+C, error handling. Total: **1084 passing** (baseline ~939, +145 new tests). One pre-existing unrelated failure remains in `src/screens/stats.test.ts` (score trend "Growing 📈" label) — not introduced by this story.

### File List

**New:**
- `src/screens/my-coach.ts`
- `src/screens/my-coach.test.ts`

**Modified:**
- `src/domain/schema.ts` — coach fields on `DomainMetaSchema`, `MyCoachScopeSchema`, `myCoachScope` on `SettingsFileSchema`, `defaultSettings()`
- `src/domain/schema.test.ts` — new tests for coach fields and `myCoachScope`
- `src/domain/store.test.ts` — added `myCoachScope` to roundtrip test fixtures
- `src/ai/prompts.ts` — `buildCoachReportPrompt()` + `QuestionRecord` import
- `src/ai/prompts.test.ts` — 10 new `buildCoachReportPrompt` tests
- `src/ai/client.ts` — `generateCoachReport()` export, consolidated schema imports
- `src/ai/client.test.ts` — 8 new `generateCoachReport` tests, added `makeRecord` to test-helper import
- `src/screens/domain-menu.ts` — `my-coach` action + menu choice + dispatch
- `src/screens/domain-menu.test.ts` — updated choice index assertions (length 10→11, indexes shifted), new My Coach dispatch test
- `src/router.ts` — `showMyCoach()` delegation
- `src/router.test.ts` — `showMyCoach` delegation test + `./screens/my-coach.js` mock

### Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-04-20 | 1.2 | Follow-up review fixes: compute regenerate staleness notice from the last persisted report metadata so immediate regenerate shows `Only 0 new questions...` and later regenerates use correct counts; remove the extra one-option Back prompt on provider/no-provider/write failures so My Coach returns directly to the domain sub-menu after displaying the error; update screen tests to lock both behaviors. | Amelia (dev) |
| 2026-04-20 | 1.1 | Code review fixes: surface `writeDomain` errors (M1); unify render/persist timestamp (L1); remove redundant domain re-read in staleness path (L2); remove dead ora spies and misleading test comment (L4, L5); delete leaked `test_output.txt` (L6); add test for `writeDomain` failure surfaced to user. | Amelia (dev) |
| 2026-04-19 | 1.0 | Implemented Story 13.1: My Coach screen with schema, prompt, AI client, screen, wiring, and tests. | Amelia (dev) |
