# Story 7.1: Settings Schema — Provider Fields

Status: done

## Story

As a developer,
I want `domain/schema.ts` extended with `AiProviderType`, `provider`, `ollamaEndpoint`, and `ollamaModel` fields in the `SettingsFile` schema,
So that the settings store and all downstream modules have a single, type-safe source of truth for multi-provider configuration.

## Acceptance Criteria

1. **Given** `domain/schema.ts` is updated
   **When** I import `AiProviderType`
   **Then** it resolves to the union type `'copilot' | 'openai' | 'anthropic' | 'gemini' | 'ollama'`
   **And** a corresponding `AiProviderTypeSchema` Zod enum is exported

2. **Given** `domain/schema.ts` is updated
   **When** I import `SettingsFileSchema`
   **Then** it validates a JSON object with fields: `provider` (nullable `AiProviderType`), `language` (string), `tone` (`ToneOfVoice`), `ollamaEndpoint` (string), and `ollamaModel` (string)

3. **Given** `domain/schema.ts` is updated
   **When** I call `defaultSettings()`
   **Then** it returns `{ provider: null, language: 'English', tone: 'natural', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }`

4. **Given** `domain/store.ts` already handles `readSettings()` and `writeSettings()`
   **When** the expanded schema is deployed
   **Then** existing `settings.json` files without `provider`, `ollamaEndpoint`, or `ollamaModel` fields are handled gracefully — missing fields fall back to defaults via Zod `.default()` or post-parse merge

5. **Given** `domain/schema.test.ts` is updated
   **When** I run `npm test`
   **Then** all schema tests pass, covering: `AiProviderType` enum validation, expanded `SettingsFileSchema` valid input, `defaultSettings()` output includes all 5 fields, backward compatibility with settings files missing provider fields

## Tasks / Subtasks

- [x] Task 1: Add `AiProviderTypeSchema` and `AiProviderType` to `src/domain/schema.ts` (AC: 1)
  - [x] Export `AiProviderTypeSchema = z.enum(['copilot', 'openai', 'anthropic', 'gemini', 'ollama'])`
  - [x] Export `type AiProviderType = z.infer<typeof AiProviderTypeSchema>`

- [x] Task 2: Expand `SettingsFileSchema` with provider fields (AC: 2)
  - [x] Add `provider` field: `AiProviderTypeSchema.nullable().default(null)` — nullable because first launch has no provider
  - [x] Add `ollamaEndpoint` field: `z.string().min(1).default('http://localhost:11434')`
  - [x] Add `ollamaModel` field: `z.string().min(1).default('llama3')`
  - [x] Verify `.default()` on all 3 new fields — ensures backward compatibility with old settings files missing these fields

- [x] Task 3: Update `defaultSettings()` return value (AC: 3)
  - [x] Return `{ provider: null, language: 'English', tone: 'natural', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }`
  - [x] Update `SettingsFile` type to reflect the expanded shape (auto-inferred from schema)

- [x] Task 4: Verify backward compatibility in `domain/store.ts` (AC: 4)
  - [x] Confirm `readSettings()` + `migrateSettings()` flow handles settings files with only `{ language, tone }` — Zod `.default()` fills missing `provider`, `ollamaEndpoint`, `ollamaModel`
  - [x] Confirm `writeSettings()` persists the full expanded object (all 5 fields)
  - [x] No changes to `store.ts` should be needed if `.default()` is used correctly on new schema fields — verified

- [x] Task 5: Update `src/domain/schema.test.ts` (AC: 1, 2, 3, 5)
  - [x] Add `AiProviderTypeSchema` to imports
  - [x] Test all 5 provider values are accepted by `AiProviderTypeSchema`
  - [x] Test invalid provider value is rejected (e.g., `'grok'`)
  - [x] Test expanded `SettingsFileSchema` accepts full valid input (all 5 fields including null provider)
  - [x] Test `SettingsFileSchema` accepts input with `provider` set to each valid provider type
  - [x] Test `SettingsFileSchema` rejects invalid `provider` value (non-null, not in enum)
  - [x] Test backward compatibility: `SettingsFileSchema.parse({ language: 'English', tone: 'natural' })` fills defaults for `provider`, `ollamaEndpoint`, `ollamaModel`
  - [x] Test `defaultSettings()` returns all 5 fields with correct values
  - [x] Test `defaultSettings()` passes expanded `SettingsFileSchema` validation
  - [x] Test empty `ollamaEndpoint` string is rejected
  - [x] Test empty `ollamaModel` string is rejected

- [x] Task 6: Update `src/domain/store.test.ts` — backward compatibility integration test (AC: 4, 5)
  - [x] Test: write old-format settings `{ language: 'English', tone: 'natural' }` to disk, then `readSettings()` returns defaults for missing provider fields
  - [x] Test: write/read roundtrip with full expanded settings (all 5 fields) returns identical data
  - [x] Verify existing settings store tests still pass with expanded schema

- [x] Task 7: Run full test suite and verify no regressions (AC: 5)
  - [x] Run `npm test` — all 430 tests pass (22 test files)
  - [x] Run `npm run typecheck` — type checking passes with zero errors

## Dev Notes

### Architecture requirements
- [Source: docs/planning-artifacts/architecture.md#Global Settings Architecture]
- `AiProviderType` enum: `'copilot' | 'openai' | 'anthropic' | 'gemini' | 'ollama'`
- Settings schema must include: `provider` (nullable), `language`, `tone`, `ollamaEndpoint`, `ollamaModel`
- `defaultSettings()` must return `{ provider: null, language: 'English', tone: 'natural', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }`
- Types live in `domain/schema.ts` — never define `AiProviderType` elsewhere

### Current state of `schema.ts`
- `ToneOfVoiceSchema` already has 7 tones: `'natural' | 'expressive' | 'calm' | 'humorous' | 'sarcastic' | 'robot' | 'pirate'`
- `SettingsFileSchema` currently only has `language` and `tone` fields
- `defaultSettings()` currently returns `{ language: 'English', tone: 'natural' }`
- All types are Zod-inferred — `SettingsFile = z.infer<typeof SettingsFileSchema>` — so expanding the schema automatically updates the type

### Current state of `store.ts`
- `readSettings()` reads settings.json, applies `migrateSettings()` (maps `normal→natural`, `enthusiastic→expressive`), then validates with `SettingsFileSchema.safeParse()`
- `writeSettings()` uses atomic write-then-rename pattern
- `TONE_MIGRATIONS` and `migrateSettings()` handle legacy tone values
- `_setSettingsPath()` allows test injection
- Store filters `settings.json` from `listDomains()` results

### Backward compatibility strategy — KEY DESIGN DECISION
Use Zod `.default()` on the 3 new fields so that existing settings files with only `{ language, tone }` are automatically filled with defaults during `safeParse()`. This means:
- `provider: AiProviderTypeSchema.nullable().default(null)` — missing → `null`
- `ollamaEndpoint: z.string().min(1).default('http://localhost:11434')` — missing → default URL
- `ollamaModel: z.string().min(1).default('llama3')` — missing → default model

This eliminates the need to modify `store.ts` for backward compat — Zod handles it at parse time.

### Previous story learnings (Story 5.1)
- `_setSettingsPath()` injects FULL settings file path (not just DATA_DIR) for test isolation
- `settingsTmpPath()` uses `path.dirname()` from the settings path — not manual string slicing
- `writeSettings()` calls `mkdir(dirname(target))` — not `mkdir(DATA_DIR)`
- `listDomains()` has an `entry === 'settings.json'` guard to exclude settings from domain listing
- Review found that `settingsTmpPath()` needed `path.dirname()` fix — keep using existing pattern

### Cross-story context
- Story 7.2 (AI Provider Abstraction Layer) will import `AiProviderType` from `domain/schema.ts` — make sure the type export is clean
- Story 7.3 (Provider-Agnostic AI Client) will use `SettingsFile` including `provider` field
- Story 7.4 (Provider Setup Screen) will check `settings.provider === null` on startup
- Story 7.6 (Router Wiring) will use `readSettings()` → check provider field
- All downstream stories depend on this schema being correct — no room for error

### Files to modify
- `src/domain/schema.ts` — add `AiProviderTypeSchema`, expand `SettingsFileSchema`, update `defaultSettings()`
- `src/domain/schema.test.ts` — add new schema tests for provider fields + backward compat
- `src/domain/store.test.ts` — add backward compat integration test with file I/O

### Files NOT to modify
- `src/domain/store.ts` — should NOT need changes if `.default()` strategy is used correctly on schema fields
- No screen files — this story is schema-only
- No `ai/` files — provider adapters come in Story 7.2

### Testing approach
- Co-located tests in `*.test.ts` files alongside source
- Use vitest's `describe`/`it`/`expect` pattern
- Store tests use `_setDataDir()` and `_setSettingsPath()` for temp directory isolation
- Existing test count: ~369 tests — must not regress

### ESM import reminder
- All imports MUST include `.js` extension: `import { ... } from './schema.js'`
- Never use bare specifiers

### Project Structure Notes
- Alignment: All new types go in `src/domain/schema.ts` — same file, same location pattern as existing types
- No new files created in this story — schema expansion only
- No barrel/index re-exports — import from `domain/schema.js` directly

### References
- [Source: docs/planning-artifacts/architecture.md#Global Settings Architecture] — settings schema spec
- [Source: docs/planning-artifacts/architecture.md#API & Communication Patterns] — AiProviderType definition and AI_ERRORS constants
- [Source: docs/planning-artifacts/architecture.md#Authentication & Security] — provider auth mechanisms
- [Source: docs/planning-artifacts/epics.md#Story 7.1] — acceptance criteria and user story
- [Source: docs/implementation-artifacts/5-1-settings-schema-store.md] — previous settings implementation learnings

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Debug Log References
- No bugs encountered during implementation

### Completion Notes List
- Used Zod `.default()` on all 3 new fields — zero changes needed in `store.ts`
- Fixed `settings.ts` type error: `writeSettings()` now spreads full `currentSettings` with updated language/tone
- Fixed 4 test assertions across `settings.test.ts`, `quiz.test.ts`, `select-domain.test.ts` that used old 2-field settings format
- Added `defaultSettings` import to `quiz.test.ts` and `select-domain.test.ts`
- All 430 tests pass, zero type errors

### File List
- `src/domain/schema.ts` — Added `AiProviderTypeSchema`, `AiProviderType`, expanded `SettingsFileSchema` with 3 new fields, updated `defaultSettings()`
- `src/domain/schema.test.ts` — Added 12 new tests (AiProviderTypeSchema validation, expanded SettingsFileSchema, backward compat, defaultSettings provider fields)
- `src/domain/store.test.ts` — Added 2 new backward compat integration tests (old-format defaults, expanded roundtrip); updated existing roundtrip test to use full 5-field settings
- `src/screens/settings.ts` — Fixed type error: spread `currentSettings` with updated fields in `writeSettings()` call
- `src/screens/settings.test.ts` — Updated 2 assertions to use full 5-field settings object; fixed 2 incomplete mock returns to include all provider fields
- `src/screens/quiz.test.ts` — Added `defaultSettings` import, updated 1 assertion
- `src/screens/select-domain.test.ts` — Added `defaultSettings` import, updated 1 assertion
- `docs/implementation-artifacts/sprint-status.yaml` — Created during sprint planning (pre-story)
- `docs/planning-artifacts/architecture.md` — Updated during Epic 7 planning (pre-story)
- `docs/planning-artifacts/epics.md` — Updated during Epic 7 planning (pre-story)
- `docs/planning-artifacts/prd.md` — Updated during Epic 7 planning (pre-story)
- `docs/planning-artifacts/product-brief.md` — Updated during Epic 7 planning (pre-story)

## Change Log
- Added `AiProviderTypeSchema` enum and `AiProviderType` type to `src/domain/schema.ts`
- Expanded `SettingsFileSchema` with `provider` (nullable, default null), `ollamaEndpoint` (default 'http://localhost:11434'), `ollamaModel` (default 'llama3')
- Updated `defaultSettings()` to return all 5 fields
- Fixed `src/screens/settings.ts` to preserve provider fields during settings save
- Added 14 new tests across schema and store test files
- Updated 4 existing test assertions to match expanded settings shape
- [Review] Fixed existing roundtrip test to use all 5 fields and assert full object equality
- [Review] Fixed 2 incomplete mock returns in `settings.test.ts` to include provider fields
- [Review] Added `localeCompare` to `sort()` in schema test to silence SonarQube
- [Review] Documented 5 pre-story files in File List
