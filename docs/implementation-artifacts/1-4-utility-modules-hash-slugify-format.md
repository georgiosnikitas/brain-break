---
Story: 1.4
Title: Utility Modules — Hash, Slugify, Format
Status: done
Epic: 1 — Foundation & Infrastructure
Created: 2026-03-07
---

# Story 1.4: Utility Modules — Hash, Slugify, Format

## Story

As a developer,
I want the `utils/hash.ts`, `utils/slugify.ts`, and `utils/format.ts` utility modules implemented,
So that SHA-256 hashing, domain name slugification, and shared terminal formatting are available to all modules through a single, tested source.

## Acceptance Criteria

- [x] `hashQuestion(text)` returns the SHA-256 hex digest of the lowercased, whitespace-stripped input
- [x] Calling `hashQuestion` twice with the same normalized input returns the same hash
- [x] `slugify("Spring Boot microservices")` returns `"spring-boot-microservices"`
- [x] Special characters and consecutive spaces/hyphens are collapsed to single hyphens
- [x] Leading/trailing hyphens are removed from slugify output
- [x] `utils/format.ts` exports chalk-based helpers usable in all screen modules
- [x] All three utils have co-located `*.test.ts` files
- [x] `npm test` passes all utility tests

## Tasks

- [x] 1. Implement `src/utils/hash.ts`
  - [x] 1.1 Remove stub, implement `hashQuestion(text: string): string` using Node.js `crypto.createHash('sha256')`
  - [x] 1.2 Normalize: lowercase + strip all whitespace before hashing
- [x] 2. Implement `src/utils/slugify.ts`
  - [x] 2.1 Remove stub, implement `slugify(text: string): string`
  - [x] 2.2 Lowercase → replace non-alphanumeric runs with `-` → strip leading/trailing `-`
- [x] 3. Implement `src/utils/format.ts`
  - [x] 3.1 Remove stub, implement chalk-based helpers: `success`, `error`, `warn`, `dim`, `bold`, `header`
  - [x] 3.2 Add domain-specific helpers: `formatSpeedTier`, `formatScoreDelta`, `formatDuration`, `formatAccuracy`
- [x] 4. Write co-located tests for all three modules

## File List

- `src/utils/hash.ts`
- `src/utils/hash.test.ts`
- `src/utils/slugify.ts`
- `src/utils/slugify.test.ts`
- `src/utils/format.ts`
- `src/utils/format.test.ts`

---

### Dev Notes

- `hashQuestion`: use `crypto.createHash('sha256')` (Node built-in, no new dep)
- `slugify`: pure string manipulation, no deps
- `format.ts`: import chalk once here; screens import from `../utils/format.js`
- All imports use `.js` extension (NodeNext ESM requirement)

---

### Senior Developer Review (AI)

**Outcome:** Changes Requested → Fixed  
**Date:** 2026-03-07  
**Action Items:** 3 found, 3 resolved

#### Action Items

- [x] [Med] No golden-hash test for `hashQuestion` — added two tests pinning SHA-256 of `'hello'` to known hex value; confirms normalization correctness cross-session
- [x] [Low] `formatScoreDelta` had redundant `sign` variable — simplified to `chalk.green(\`+${delta}\`)` in positive branch
- [x] [Low] `formatAccuracy(correct > total)` returned >100% — added `Math.min(correct, total)` clamp

---

### Completion Notes List

- All 4 tasks / 8 subtasks complete plus review fixes. `hash.ts`: `hashQuestion` normalizes then SHA-256s; golden hash test pins known value. `slugify.ts`: collapses non-alphanumeric runs to `-`, strips leading/trailing. `format.ts`: 6 chalk wrappers + 4 domain helpers; `formatScoreDelta` simplified, `formatAccuracy` clamped. 8 + 10 + 18 = 36 tests (2 new golden hash). `npm test` 77/77 ✅. `tsc --noEmit` exits 0 ✅.
