---
status: draft
date: 2026-04-05
author: George
---

# Dependency Upgrade Backlog

> **Scope:** Major dependency upgrades deferred from the v1.12.1 maintenance cycle. Each item should be done on a dedicated branch with full test verification.

---

## Recommended Execution Order

| Order | Upgrade | Status | Rationale |
|-------|---------|--------|-----------|
| 1 | TypeScript 5.x → 6.x | ✅ Done | Foundational — establishes type baseline for all other upgrades. Zero runtime risk. |
| 2 | ora 8.x → 9.x | ✅ Done | Quick win — tiny API surface, builds momentum. |
| 3 | @github/copilot-sdk 0.1.x → 0.2.x | ✅ Done | Isolated to AI layer, high priority to stay current. |
| 4 | @inquirer/prompts 7.x → 8.x | ✅ Done | High-touch UI testing, no cross-cutting risk. |
| 5 | zod 3.x → 4.x | ✅ Done | Heaviest lift — ripples through domain layer. Do last on a stable base. |
| 6 | @types/node 22.x → 25.x | ⬚ | Deferred — matches current engine requirement. |

---

## Priority: High

### 1. ~~Upgrade `@github/copilot-sdk` from 0.1.x to 0.2.x~~ ✅ Completed (2026-04-05)

**Upgraded:** 0.1.32 → 0.2.1 — API fully backward compatible (CopilotClient, approveAll unchanged). New exports available (CopilotSession, defineTool). vscode-jsonrpc patch still required. No code changes needed. All 947 tests passed.

---

### 2. ~~Upgrade `@inquirer/prompts` from 7.x to 8.x~~ ✅ Completed (2026-04-05)

**Upgraded:** 7.10.1 → 8.3.2 — Breaking changes (ESM-only, Node 20+, removed helpMode/instructions/cancel) do not affect this codebase. No code changes needed. All 947 tests passed.

---

## Priority: Medium

### 3. ~~Upgrade `zod` from 3.x to 4.x~~ ✅ Completed (2026-04-05)

**Upgraded:** 3.25.76 → 4.3.6 — Despite being a significant rewrite, no breaking changes affected this codebase. Some APIs deprecated (z.string().datetime(), .refine({ message }), z.number().finite()) but all still functional. No code changes needed. All 947 tests passed.

---

### 4. ~~Upgrade `typescript` from 5.x to 6.x~~ ✅ Completed (2026-04-05)

**Upgraded:** 5.9.3 → 6.0.2 — zero type errors, all 947 tests passed, clean build. No code changes required.

---

### 5. ~~Upgrade `ora` from 8.x to 9.x~~ ✅ Completed (2026-04-05)

**Upgraded:** 8.2.0 → 9.3.0 — only breaking change was Node.js 20 minimum (project requires ≥22). No code changes required. All 947 tests passed.

---

## Priority: Low

### 6. Upgrade `@types/node` from 22.x to 25.x

**Current:** 22.19.15 | **Latest:** 25.5.2

**Risk:** Low — only relevant if using newer Node APIs. Engine is `>=22`.

**Action:** Defer until the minimum Node engine version is bumped. Staying on `^22` types matches the current engine requirement.
