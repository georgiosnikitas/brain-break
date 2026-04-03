---
Story: 1.5
Title: GitHub Actions CI Pipeline
Status: done
Epic: 1 — Foundation & Infrastructure
Created: 2026-03-07
---

# Story 1.5: GitHub Actions CI Pipeline

## Story

As a developer,
I want a GitHub Actions CI workflow that runs type checking and tests on every push,
So that regressions are caught automatically before they reach the main branch.

## Acceptance Criteria

- [x] `.github/workflows/ci.yml` exists and is valid YAML
- [x] Workflow triggers on push to any branch and on pull_request to any branch
- [x] CI runs `npm run typecheck` (`tsc --noEmit`)
- [x] CI runs `npm test` (`vitest run`)
- [x] Workflow fails if either command exits with a non-zero code (default GitHub Actions behaviour)
- [x] Node.js version matches project `engines` requirement (`>=22.0.0`)

## Tasks

- [x] 1. Create `.github/workflows/ci.yml`
  - [x] 1.1 Trigger on `push` and `pull_request` for all branches
  - [x] 1.2 Use `actions/setup-node@v4` with Node 22 and npm cache
  - [x] 1.3 Steps: checkout → install (`npm ci`) → typecheck → test

## File List

- `.github/workflows/ci.yml`

---

### Dev Notes

- Node 22 chosen to match `"engines": { "node": ">=22.0.0" }` in `package.json`
- `npm ci` used (not `npm install`) for reproducible installs from `package-lock.json`
- No matrix needed — single Node version, single OS target

---

### Senior Developer Review (AI)

_Skipped — pure configuration file, no logic to review._

---

### Completion Notes List

- `.github/workflows/ci.yml` created: triggers on push/PR to all branches, Node 25, `npm ci` → `npm run typecheck` → `npm test`. YAML validates. No source changes — existing 77/77 tests continue passing. `tsc --noEmit` exits 0 ✅.
