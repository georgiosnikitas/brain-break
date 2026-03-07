# Story 1.3: Domain File Store — Atomic Read/Write

Status: done

## Story

As a developer,
I want `domain/store.ts` to provide atomic read/write operations for domain JSON files,
so that domain data is never corrupted by partial writes.

## Acceptance Criteria

1. **Given** `domain/store.ts` is implemented  
   **When** I call `writeDomain(slug, domainFile)`  
   **Then** it writes to `~/.brain-break/.tmp-<slug>.json` first, then renames it to `~/.brain-break/<slug>.json` atomically  
   **And** the `~/.brain-break/` directory is created if it does not exist

2. **Given** `domain/store.ts` is implemented  
   **When** I call `readDomain(slug)` and the file exists and is valid  
   **Then** it returns `{ ok: true, data: <DomainFile> }` with the parsed, Zod-validated domain

3. **Given** `domain/store.ts` is implemented  
   **When** I call `readDomain(slug)` and the file does not exist (ENOENT)  
   **Then** it returns `{ ok: true, data: defaultDomainFile() }` — no error propagated

4. **Given** `domain/store.ts` is implemented  
   **When** I call `readDomain(slug)` and the file is corrupted (Zod validation fails)  
   **Then** it returns `{ ok: false, error: "Domain data for [slug] appears corrupted and cannot be loaded. Starting fresh." }`

5. **Given** `domain/store.ts` is implemented  
   **When** I call `listDomains()`  
   **Then** it returns an array of `{ slug, meta }` for every `*.json` file in `~/.brain-break/` that is not prefixed with `.tmp-` — including archived domains  
   **And** it returns `{ ok: true, data: [] }` when the directory does not exist yet  
   **And** callers are responsible for filtering by `meta.archived`

6. **Given** `domain/store.ts` has tests in `domain/store.test.ts`  
   **When** I run `npm test`  
   **Then** all store tests pass, covering write/read roundtrip, ENOENT default, corrupted file, and listDomains empty

## Tasks / Subtasks

- [x] Task 1: Implement `domain/store.ts` (AC: 1–5)
  - [x] 1.1 Define `DATA_DIR` constant pointing to `~/.brain-break/`
  - [x] 1.2 Implement `domainPath(slug)` helper returning full path to `<slug>.json`
  - [x] 1.3 Implement `writeDomain(slug, domainFile)` — write-to-tmp then `fs.rename()`
  - [x] 1.4 Implement `readDomain(slug)` — read + `DomainFileSchema.safeParse()`, handle ENOENT and parse errors
  - [x] 1.5 Implement `listDomains()` — read all `*.json` (excluding `.tmp-*`) from DATA_DIR, return `{ slug, meta }[]`

- [x] Task 2: Write tests in `domain/store.test.ts` (AC: 6)
  - [x] 2.1 Test `writeDomain` + `readDomain` roundtrip returns identical data
  - [x] 2.2 Test `readDomain` on non-existent slug returns `defaultDomainFile()` values
  - [x] 2.3 Test `readDomain` on corrupted JSON file returns `{ ok: false, error: ... }`
  - [x] 2.4 Test `readDomain` on valid JSON failing Zod returns `{ ok: false, error: ... }`
  - [x] 2.5 Test `listDomains()` returns empty array when directory does not exist
  - [x] 2.6 Test `listDomains()` returns correct slugs after writing multiple domains
  - [x] 2.7 Test `listDomains()` excludes `.tmp-*` files
  - [x] 2.8 Run `npm test` and confirm all pass

## Dev Notes

### Architecture — Atomic Write Pattern

[Source: architecture.md#Data Architecture — Atomic Write Strategy]

```
1. Write to ~/.brain-break/.tmp-<slug>.json
2. fs.rename() to ~/.brain-break/<slug>.json  (atomic on Unix)
```

`fs.rename()` is atomic on macOS/Linux. This is the only pattern used — never `fs.writeFile()` directly to the target.

### DATA_DIR

```ts
import { homedir } from 'node:os'
import { join } from 'node:path'

const DATA_DIR = join(homedir(), '.brain-break')
```

### Function Signatures

```ts
export async function writeDomain(slug: string, domain: DomainFile): Promise<Result<void>>
export async function readDomain(slug: string): Promise<Result<DomainFile>>
export async function listDomains(): Promise<Result<Array<{ slug: string; meta: DomainMeta }>>>
```

All return `Result<T>` — no raw throws escape this module. All `try/catch` lives here.

### Error Message for Corrupted Files (AC 4)

Must be exactly:
```
`Domain data for ${slug} appears corrupted and cannot be loaded. Starting fresh.`
```

### Error Handling Rules

[Source: architecture.md#Error Handling Patterns]
- All `try/catch` lives in `store.ts` — screens never catch I/O errors
- ENOENT on `readDomain` → returns `{ ok: true, data: defaultDomainFile() }` (not an error)
- Everything else on read (corrupted JSON, Zod fail) → `{ ok: false, error: "..." }`
- `listDomains()` when directory does not exist → `{ ok: true, data: [] }` (treat as empty)

### Testing Strategy

Tests must use a **temp directory** (not `~/.brain-break/`) to avoid touching real user data. Use `os.tmpdir()` + a unique subdirectory per test run, and override `DATA_DIR` via dependency injection or by mocking `homedir`.

The cleanest approach: export a `_setDataDir(path: string)` test-only helper from `store.ts` (or accept a `dataDir` param in each function). Using `vi.mock` to override `homedir` is also valid.

Clean up the temp dir in `afterEach`/`afterAll`.

### ESM Imports

```ts
import { readFile, writeFile, rename, mkdir, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DomainFileSchema, DomainFile, DomainMeta, defaultDomainFile, Result } from './schema.js'
```

### Previous Stories Established

- Story 1.1: `package.json` with `"type": "module"`, NodeNext, strict TypeScript, `vitest@^4`
- Story 1.2: `DomainFileSchema`, `DomainFile`, `DomainMeta`, `defaultDomainFile()`, `Result<T>` — all imported from `./schema.js`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Senior Developer Review (AI)

**Outcome:** Changes Requested → Fixed  
**Date:** 2026-03-07  
**Action Items:** 5 found, 5 resolved

#### Action Items

- [x] [Med] `listDomains()` silently dropped corrupted entries — added `DomainListEntry` discriminated union type, corrupted files now returned with `{ slug, corrupted: true }`
- [x] [Med] `writeDomain` leaked `.tmp-` file on `rename()` failure — added `try { unlink(tmp) } catch {}` in catch block
- [x] [Med] No test for `writeDomain` returning `{ ok: false }` — added test using directory-at-tmp-path to force EISDIR
- [x] [Low] `Result<void>` returns `data: undefined` (correct, no change needed — `void` is assignable from `undefined` in TypeScript)
- [x] [Low] `_setDataDir` reset fragility — `beforeEach` already resets it; no change needed, noted

### Completion Notes List

- All 2 tasks / 13 subtasks complete plus review fixes. `store.ts` exports `writeDomain`, `readDomain`, `listDomains`, `DomainListEntry`, `_setDataDir`. Atomic write-then-rename with tmp cleanup on failure. `listDomains` surfaces corrupted entries via `corrupted: true` discriminated union. 11 tests covering all AC paths plus write failure and corrupted-entry surfacing. `npm test` 41/41 ✅. `tsc --noEmit` exits 0 ✅.

### File List

- `src/domain/store.ts`
- `src/domain/store.test.ts`
