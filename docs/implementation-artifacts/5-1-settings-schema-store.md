# Story 5.1: Settings Schema & Store

Status: done

## Story

As a developer,
I want a `SettingsFile` Zod schema and read/write store functions for `~/.brain-break/settings.json`,
So that all modules have a single, type-safe, tested source of truth for user settings.

## Acceptance Criteria

1. **Given** `domain/schema.ts` is updated  
   **When** I import `SettingsFileSchema`  
   **Then** it is a Zod schema validating `{ language: string, tone: z.enum(["normal", "enthusiastic", "robot", "pirate"]) }`  
   **And** `defaultSettings()` returns `{ language: "English", tone: "normal" }`

2. **Given** `domain/store.ts` exports `readSettings()` and `writeSettings(settings)`  
   **When** I call `readSettings()` and `~/.brain-break/settings.json` exists and is valid  
   **Then** it returns `{ ok: true, data: SettingsFile }` with the parsed, Zod-validated settings

3. **Given** I call `readSettings()` and the file does not exist (ENOENT)  
   **When** the function runs  
   **Then** it returns `{ ok: true, data: defaultSettings() }` — no error propagated

4. **Given** I call `readSettings()` and the file is corrupted (Zod validation fails)  
   **When** the function runs  
   **Then** it returns `{ ok: true, data: defaultSettings() }` — silently falls back to defaults

5. **Given** I call `writeSettings(settings)`  
   **When** the function runs  
   **Then** it writes atomically (write-then-rename pattern) to `~/.brain-break/settings.json`  
   **And** returns `{ ok: true }` on success

6. **Given** co-located tests exist for the schema and store  
   **When** I run `npm test`  
   **Then** all tests pass, covering: valid input, `defaultSettings()` output, ENOENT fallback, Zod rejection fallback, and write/read roundtrip

## Tasks / Subtasks

- [x] Add `SettingsFileSchema`, `ToneOfVoiceSchema`, `SettingsFile`, `ToneOfVoice`, `defaultSettings()` to `src/domain/schema.ts` (AC: 1)
  - [x] Export `ToneOfVoiceSchema = z.enum(['normal', 'enthusiastic', 'robot', 'pirate'])`
  - [x] Export `SettingsFileSchema = z.object({ language: z.string().min(1), tone: ToneOfVoiceSchema })`
  - [x] Export `SettingsFile` and `ToneOfVoice` TypeScript types
  - [x] Export `defaultSettings()` returning `{ language: 'English', tone: 'normal' }`

- [x] Add settings tests to `src/domain/schema.test.ts` (AC: 1, 6)
  - [x] Valid settings object passes schema validation
  - [x] Invalid tone value fails validation
  - [x] `defaultSettings()` returns expected defaults
  - [x] Empty language string fails validation

- [x] Add `readSettings()`, `writeSettings()`, and `_setSettingsPath()` to `src/domain/store.ts` (AC: 2, 3, 4, 5)
  - [x] `_setSettingsPath(path)` — test injection hook
  - [x] `writeSettings(settings)` — atomic write-then-rename to settings.json
  - [x] `readSettings()` — read + Zod validate; ENOENT → defaultSettings(); corrupted → defaultSettings()

- [x] Add settings store tests to `src/domain/store.test.ts` (AC: 2, 3, 4, 5, 6)
  - [x] Write/read roundtrip returns identical data
  - [x] ENOENT returns defaultSettings()
  - [x] Corrupted JSON returns defaultSettings()
  - [x] Zod-invalid content returns defaultSettings()

## Dev Notes

### Files to modify
- `src/domain/schema.ts` — add SettingsFileSchema, defaultSettings()
- `src/domain/schema.test.ts` — add settings tests
- `src/domain/store.ts` — add readSettings, writeSettings, _setSettingsPath
- `src/domain/store.test.ts` — add settings store tests

### Settings file path
- Production: `~/.brain-break/settings.json`
- The settings file shares the `DATA_DIR` directory with domain files
- Settings file is named `settings.json` (not `<slug>.json`), so no collision with domain files
- `_setSettingsPath(path)` overrides the full path to the settings file (not just dir) for test isolation

### Atomic write pattern
Same as `writeDomain`: write to `.tmp-settings.json` in `DATA_DIR`, then rename to `settings.json`.
The `mkdir` call ensures the directory exists before writing.

### Error handling
- ENOENT on read → `defaultSettings()` (non-critical, user just hasn't saved settings yet)
- Zod validation fail on read → `defaultSettings()` (settings corruption is non-critical)
- Write failure → `{ ok: false, error: <message> }` (caller handles)

## Dev Agent Record

### Implementation Notes
- SettingsFileSchema added to domain/schema.ts; settings functions added to domain/store.ts
- `_setSettingsPath()` injects full settings file path for test isolation (not just DATA_DIR)
- Atomic write uses `.tmp-settings.json` sibling path derived from settings file path

### Senior Developer Review (AI)
**Outcome:** Changes Requested | **Date:** 2026-03-15
**Action Items:** 4 fixed

- [x] [H1] `listDomains()` included `settings.json` as a corrupted domain slug — excluded via `entry === 'settings.json'` guard
- [x] [M1] `settingsTmpPath()` used manual string slicing instead of `path.dirname()` — fixed
- [x] [M2] `writeSettings()` called `mkdir(DATA_DIR)` instead of `mkdir(dirname(target))` — fixed
- [x] [L2] No test asserting `settings.json` excluded from `listDomains()` — added

### Completion Notes
- All tests pass (307/307)
- Full regression suite passes after review fixes

## File List
- src/domain/schema.ts
- src/domain/schema.test.ts
- src/domain/store.ts
- src/domain/store.test.ts

## Change Log
- 2026-03-15: Story 5.1 implemented — SettingsFileSchema, defaultSettings(), readSettings(), writeSettings()
