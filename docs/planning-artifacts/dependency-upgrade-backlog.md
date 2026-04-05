---
status: draft
date: 2026-04-05
author: George
---

# Dependency Upgrade Backlog

> **Scope:** Major dependency upgrades deferred from the v1.12.1 maintenance cycle. Each item should be done on a dedicated branch with full test verification.

---

## Recommended Execution Order

| Order | Upgrade | Rationale |
|-------|---------|-----------|
| 1 | TypeScript 5.x → 6.x | Foundational — establishes type baseline for all other upgrades. Zero runtime risk. |
| 2 | ora 8.x → 9.x | Quick win — tiny API surface, builds momentum. |
| 3 | @github/copilot-sdk 0.1.x → 0.2.x | Isolated to AI layer, high priority to stay current. |
| 4 | @inquirer/prompts 7.x → 8.x | High-touch UI testing, no cross-cutting risk. |
| 5 | zod 3.x → 4.x | Heaviest lift — ripples through domain layer. Do last on a stable base. |
| 6 | @types/node 22.x → 25.x | Deferred — matches current engine requirement. |

---

## Priority: High

### 1. Upgrade `@github/copilot-sdk` from 0.1.x to 0.2.x

**Current:** 0.1.32 | **Latest:** 0.2.1

**Risk:** Medium — pre-1.0 library, API surface may have changed.

**Why prioritize:** Core dependency for AI features. Staying current reduces drift and ensures access to latest Copilot capabilities.

**Upgrade steps:**
- Review changelog / migration guide
- Upgrade on a feature branch
- Verify all AI provider flows (Copilot, Anthropic, OpenAI, Google)
- Run full test suite

---

### 2. Upgrade `@inquirer/prompts` from 7.x to 8.x

**Current:** 7.10.1 | **Latest:** 8.3.2

**Risk:** Medium — major version bump on a core UI dependency.

**Why prioritize:** Prompt flows are central to the app (domain creation, quiz, settings). Staying on 7.x may block future features.

**Upgrade steps:**
- Review changelog for breaking API changes
- Upgrade on a feature branch
- Test all interactive screens (home, domain, quiz, settings, history)
- Pay attention to select/confirm/input prompt APIs

---

## Priority: Medium

### 3. Upgrade `zod` from 3.x to 4.x

**Current:** 3.25.76 | **Latest:** 4.3.6

**Risk:** High — Zod 4 is a significant rewrite with schema API changes.

**Why prioritize (eventually):** Validation is used across domain types and file storage. Performance improvements in v4 are worthwhile long-term.

**Upgrade steps:**
- Review Zod 4 migration guide thoroughly
- Audit all `z.object()`, `z.enum()`, `z.array()` usages across `src/domain/`
- Upgrade on a feature branch
- Run full test suite — expect type-level breakage

---

### 4. Upgrade `typescript` from 5.x to 6.x

**Current:** 5.9.3 | **Latest:** 6.0.2

**Risk:** Medium — new major may surface stricter type errors.

**Upgrade steps:**
- Upgrade on a feature branch
- Run `tsc --noEmit` and fix any new errors
- Run full test suite
- Verify build output (`npm run build`)

---

### 5. Upgrade `ora` from 8.x to 9.x

**Current:** 8.2.0 | **Latest:** 9.3.0

**Risk:** Low-Medium — small API surface (spinner only).

**Upgrade steps:**
- Review changelog for breaking changes
- Upgrade on a feature branch
- Test spinner behavior in quiz and AI generation flows

---

## Priority: Low

### 6. Upgrade `@types/node` from 22.x to 25.x

**Current:** 22.19.15 | **Latest:** 25.5.2

**Risk:** Low — only relevant if using newer Node APIs. Engine is `>=22`.

**Action:** Defer until the minimum Node engine version is bumped. Staying on `^22` types matches the current engine requirement.
