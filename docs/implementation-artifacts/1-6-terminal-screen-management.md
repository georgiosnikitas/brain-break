---
Story: 1.6
Title: Terminal Screen Management
Status: done
Epic: 1 — Foundation & Infrastructure
Created: 2026-03-14
---

# Story 1.6: Terminal Screen Management

## Story

As a user,
I want every screen in the app to render at the top of a cleared terminal viewport,
So that the app always feels like a persistent full-screen application and previous output never clutters the current view.

## Acceptance Criteria

- [x] `utils/screen.ts` exports `clearScreen()` which clears the terminal viewport
- [x] `clearScreen()` is called before rendering the home screen
- [x] `clearScreen()` is called before the create domain input prompt
- [x] `clearScreen()` is called before the domain sub-menu is displayed
- [x] `clearScreen()` is called before the archived domains list renders
- [x] `clearScreen()` is called before each quiz question renders
- [x] `clearScreen()` is called before each post-answer feedback panel renders
- [x] `clearScreen()` is called before each history screen entry renders
- [x] `clearScreen()` is called before the stats dashboard renders

## Tasks

- [x] 1. Create `src/utils/screen.ts` with `clearScreen()` and unit tests
  - [x] 1.1 Implement `clearScreen()` using ANSI escape codes
  - [x] 1.2 Write unit tests in `src/utils/screen.test.ts`
- [x] 2. Integrate `clearScreen()` into all screen render points
  - [x] 2.1 `home.ts` — call before each render loop iteration
  - [x] 2.2 `create-domain.ts` — call before the input prompt
  - [x] 2.3 `domain-menu.ts` — call before each render loop iteration
  - [x] 2.4 `archived.ts` — call before each render loop iteration
  - [x] 2.5 `quiz.ts` — call before question render and before feedback render
  - [x] 2.6 `history.ts` — call before each entry render (loop + empty case)
  - [x] 2.7 `stats.ts` — call before stats content render
- [x] 3. Update screen tests to verify `clearScreen()` is called

## File List

- `src/utils/screen.ts` (new)
- `src/utils/screen.test.ts` (new)
- `src/screens/home.ts`
- `src/screens/create-domain.ts`
- `src/screens/domain-menu.ts`
- `src/screens/archived.ts`
- `src/screens/quiz.ts`
- `src/screens/history.ts`
- `src/screens/stats.ts`
- `src/screens/home.test.ts`
- `src/screens/create-domain.test.ts`
- `src/screens/domain-menu.test.ts`
- `src/screens/archived.test.ts`
- `src/screens/quiz.test.ts`
- `src/screens/history.test.ts`
- `src/screens/stats.test.ts`
- `docs/planning-artifacts/architecture.md`
- `docs/planning-artifacts/epics.md`
- `docs/planning-artifacts/prd.md`

---

### Dev Agent Record

#### Completion Notes

Implemented `clearScreen()` in `src/utils/screen.ts` using RIS escape sequence `\x1Bc` — full terminal reset, clearing visible screen and scrollback buffer on all target platforms. Integrated into all 7 screens at every render point. Added 10 new tests across 9 test files. All 268 tests pass.

Code review applied: corrected escape sequence from `\x1B[2J\x1B[3J\x1B[H` to `\x1Bc` to match architecture spec; added 3 planning artifact files to File List; removed redundant partial unit test.
