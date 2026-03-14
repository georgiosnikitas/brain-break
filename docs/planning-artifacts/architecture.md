---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/planning-artifacts/prd.md
  - docs/planning-artifacts/product-brief.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-03-07'
lastEdited: '2026-03-14'
editHistory:
  - date: '2026-03-14'
    changes: 'Added Story 1.6 — Terminal Screen Management: utils/screen.ts, clearScreen() pattern, NFR 5 coverage'
project_name: 'brain-break'
user_name: 'George'
date: '2026-03-07'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
7 requirements covering: domain lifecycle management (create, select, archive, unarchive), AI-powered question generation via GitHub Copilot SDK with adaptive difficulty (5 levels, streak-driven), interactive terminal quiz with silent response timer, a scoring system using a base-points × speed-multiplier formula, full persistent question history per domain, paginated history view, and a stats dashboard with trend analysis.

**Non-Functional Requirements:**
- Performance: Question generation ≤ 5s (API + persist); startup ≤ 2s
- Reliability: Graceful degradation on API unavailability or auth failure; corrupted domain file recovery without crash
- Data integrity: SHA-256 deduplication persisted across sessions; missing file treated as clean new domain
- Terminal screen management: every state-changing navigation action clears the viewport before rendering new content — no residual output from the previous screen persists

**Scale & Complexity:**

- Primary domain: CLI / terminal application (Unix-like: macOS, Linux, WSL)
- Complexity level: Low-Medium
- External dependency: GitHub Copilot SDK (single, hard-required)
- Estimated architectural components: 6–8 focused modules

### Technical Constraints & Dependencies

- Runtime: Node.js v25.8.0
- Interface: Terminal only — no web UI, no GUI
- AI: GitHub Copilot SDK — structured chat completion returning JSON (question text, options A–D, correct answer, difficulty, speed tier thresholds)
- Storage: `~/.brain-break/<domain-slug>.json` — one file per domain
- Distribution: npm / npx — must reach home screen in ≤ 2s cold start
- Platform: Unix-like only (macOS, Linux, WSL)

### Cross-Cutting Concerns Identified

- **AI integration & error resilience:** Every question cycle touches the Copilot API; network/auth failure paths must be handled uniformly across the quiz engine
- **File I/O with integrity guarantees:** Read/write/permission enforcement is needed everywhere domain state is touched — must be centralized, not scattered
- **State management:** Streak counter, difficulty level, score, and question hashes all evolve per answer and must be atomically persisted
- **Terminal rendering:** All user-facing output (home screen, quiz, feedback, history, stats, spinner) requires a consistent rendering approach — `utils/screen.ts` owns the viewport-clear primitive; all screens call `clearScreen()` as their first operation before any output
- **Deduplication:** SHA-256 lookup on every question generation — must be fast and correctly scoped per domain

## Starter Template Evaluation

### Primary Technology Domain

Node.js CLI application — terminal-first, Unix-like platforms (macOS, Linux, WSL), distributed via npm/npx.

### Starter Options Considered

| Option | Rationale |
|---|---|
| **oclif** | Full CLI framework — overkill for a single entry-point app |
| **Minimal TypeScript scaffold** | ✅ Selected — right-sized, full control, no framework overhead |
| **Plain JavaScript** | Rejected — loses type safety on complex state model |

### Selected Approach: Minimal TypeScript Scaffold (ESM)

**Rationale for Selection:**
brain-break is a single entry-point CLI, not a multi-command toolbox. A minimal scaffold with hand-picked libraries keeps the codebase maintainable without framework ceremony. TypeScript is warranted given the complexity of the state model (scoring formula, streak logic, domain schema) — it catches bugs at the persistence boundary. ESM aligns with the current ecosystem direction for all chosen libraries.

**Initialization Command:**

```bash
npm init -y
npm install typescript tsx @types/node --save-dev
npx tsc --init --module nodenext --moduleResolution nodenext --target es2022
```

**Architectural Decisions Established by Scaffold:**

**Language & Runtime:**
- TypeScript (strict mode), ESM (`"type": "module"` in package.json)
- Module resolution: NodeNext
- Target: Node.js v25.8.0 (Current release — developer tool, single-user, no stability concern)
- `tsx` for development execution; `tsc` for production build to `dist/`

**Interactive Terminal:**
- `inquirer` v12 — interactive prompts (menus, free-text input), ESM-native
- `ora` v8 — loading spinner during question generation
- `chalk` v5 — terminal color and styling, ESM-native

**CLI Entry & Distribution:**
- `bin` field in `package.json` pointing to compiled `dist/index.js`
- `engines.node` field set to `">=25.8.0"` (reflects actual dev environment)
- `npx`-compatible out of the box

**Testing Framework:**
- `vitest` — TypeScript-native, ESM-compatible, minimal config

**Code Organization:**
- `src/` — all TypeScript source
- `dist/` — compiled output (gitignored)
- Single `src/index.ts` entry point

**Development Experience:**
- `tsx src/index.ts` for zero-config local runs
- `tsc --noEmit` for type checking

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Domain file schema structure (split meta + history)
- Atomic write strategy (write-then-rename)
- Deduplication hash in-memory representation (Set<string>)
- Copilot SDK response validation (Zod)
- Module/directory structure

**Important Decisions (Shape Architecture):**
- Terminal UI navigation pattern (sequential prompts + thin router)
- API error handling strategy (no retry, fail-to-home)

**Deferred Decisions (Post-MVP):**
- Fuzzy/similarity-based deduplication (explicitly noted in PRD as future enhancement)
- Startup optimisation (read only `meta` fields on home screen load)

---

### Data Architecture

**Domain File Schema — Split meta + history**

Each domain file at `~/.brain-break/<domain-slug>.json` uses a two-section structure:

```jsonc
{
  "meta": {
    "score": 0,
    "difficultyLevel": 2,
    "streakCount": 0,
    "streakType": "correct" | "incorrect" | "none",
    "totalTimePlayedMs": 0,
    "createdAt": "ISO8601",
    "lastSessionAt": "ISO8601",
    "archived": false
  },
  "hashes": ["sha256hex", ...],
  "history": [
    {
      "question": "string",
      "options": { "A": "", "B": "", "C": "", "D": "" },
      "correctAnswer": "A" | "B" | "C" | "D",
      "userAnswer": "A" | "B" | "C" | "D",
      "isCorrect": boolean,
      "answeredAt": "ISO8601",
      "timeTakenMs": number,
      "speedTier": "fast" | "normal" | "slow",
      "scoreDelta": number,
      "difficultyLevel": number
    }
  ]
}
```

*Rationale:* Separating `meta` from `history` supports a future optimisation where only `meta` is read on startup (home screen summary), without loading the full history array. Zero cost now, pays forward.

**Atomic Write Strategy — write-then-rename**

All domain file writes use a tmp-file-then-rename pattern:
1. Write to `~/.brain-break/.tmp-<slug>.json`
2. Call `fs.rename()` to atomically replace the target

*Rationale:* `fs.rename()` is atomic on Unix (macOS, Linux). Eliminates the corruption window that direct `fs.writeFile()` leaves open. Directly addresses NFR 3.

**Deduplication — Array on disk, Set in memory**

- `hashes` stored as a plain string array in JSON (serializable, no special format)
- Loaded into a `Set<string>` at runtime for O(1) lookup per question generation cycle
- No external dependency required

---

### Authentication & Security

- **Copilot auth:** Fully delegated to the GitHub Copilot SDK — no token management in the app
- **Input validation:** All Copilot API responses validated with Zod before use — treats AI output as an untrusted external boundary
- **No user-facing auth:** Zero credentials handled by the app itself

---

### API & Communication Patterns

**Copilot SDK Integration**

- Structured chat completion prompt instructs the model to return a JSON object
- Response parsed and validated with a **Zod schema** before any field is accessed
- Schema covers: `question` (string), `options` (A–D strings), `correctAnswer` (enum), `difficultyLevel` (1–5 int), `speedThresholds` (`{ fastMs: number, slowMs: number }`)

**Error Handling Strategy — No retry, fail-to-home**

| Error Type | Behaviour |
|---|---|
| Network/API unavailable | Display message, return to home screen |
| Authentication failure | Display specific Copilot auth message, exit cleanly |
| Malformed response (Zod fail) | Display generic error, return to home screen |

No retry loop for MVP. Retry adds complexity and can mask auth failures.

---

### Terminal UI Architecture

**Navigation Pattern — Sequential prompts with thin router**

No state machine framework. Navigation is explicit function calls dispatched from a `router.ts` module:

```
startup → router.showHome()
  → user selects domain → router.showQuiz(domain)
  → user exits quiz → router.showHome()
  → user views history → router.showHistory(domain)
  → user views stats → router.showStats(domain)
```

Each screen is a standalone `async` function that resolves when the user exits it. `router.ts` is the only place that calls other screens — screens never call each other directly.

*Rationale:* 4 screens, linear flows, no concurrent state. A full state machine would be abstraction for its own sake.

**Screen Clearing Pattern — `clearScreen()` before every render**

Every screen entry point and every re-render cycle (e.g., post-answer feedback, history page navigation) calls `clearScreen()` as its **first** operation before any output:

```typescript
// ✅ Correct pattern — every screen, every render cycle
import { clearScreen } from '../utils/screen.js';

export async function showHome(): Promise<void> {
  clearScreen();
  // ... render domain list
}
```

`clearScreen()` is a thin wrapper over the ANSI reset escape sequence:

```typescript
// utils/screen.ts
export function clearScreen(): void {
  process.stdout.write('\x1Bc');
}
```

Using `\x1Bc` (full terminal reset) over `\x1B[2J\x1B[H` (erase + cursor-home) ensures residual scroll-back content does not bleed into the visible viewport on all target platforms (macOS Terminal, iTerm2, Linux terminals, WSL).

**Enforcement rule:** No screen may output content to the terminal without first calling `clearScreen()`. This is verifiable: every `screens/*.ts` file must have `clearScreen()` as its first side-effectful call in every code path that renders a new screen state.

*Rationale:* Centralising the clear primitive in `utils/screen.ts` makes the contract testable (spy on `process.stdout.write` in unit tests), swap-able (one place to change if a different clear strategy is needed), and makes the enforcement rule auditable by grep.

---

### Module Architecture

**`src/` Directory Structure**

```
src/
├── index.ts              # Entry point — bootstraps and calls router
├── router.ts             # Navigation between screens
├── screens/
│   ├── home.ts           # Domain list, create, archive/unarchive
│   ├── quiz.ts           # Question loop, timer, answer feedback
│   ├── history.ts        # Paginated history view
│   └── stats.ts          # Stats dashboard
├── ai/
│   ├── client.ts         # Copilot SDK integration + error handling
│   └── prompts.ts        # Prompt templates and Zod response schema
├── domain/
│   ├── store.ts          # Read/write domain files (atomic)
│   ├── schema.ts         # TypeScript types + Zod schema for domain file
│   └── scoring.ts        # Score delta formula, difficulty progression
└── utils/
    ├── hash.ts           # SHA-256 hashing helpers
    ├── slugify.ts        # Domain name → file slug
    ├── screen.ts         # clearScreen() — viewport reset before every render
    └── format.ts         # Shared terminal formatting helpers
```

**Dependency Rules:**
- `screens/` may import from `domain/`, `ai/`, and `utils/` — never the reverse
- `router.ts` may import from `screens/` only
- `domain/store.ts` is the **only** module that writes to disk
- `ai/client.ts` is the **only** module that calls the Copilot SDK

### Decision Impact Analysis

**Implementation Sequence:**
1. Scaffold: `package.json`, `tsconfig.json`, directory structure
2. `domain/schema.ts` — define types and Zod schema first (everything else depends on this)
3. `domain/store.ts` — atomic reads/writes
4. `utils/` — hash, slugify, screen, format
5. `ai/prompts.ts` + `ai/client.ts` — Copilot integration with Zod validation
6. `domain/scoring.ts` — scoring formula and difficulty logic
7. `screens/` — home, quiz, history, stats
8. `router.ts` + `index.ts` — wire everything together

**Cross-Component Dependencies:**
- Schema types flow from `domain/schema.ts` → all modules
- `screens/quiz.ts` depends on both `domain/store.ts` and `ai/client.ts` — the two slowest paths
- `domain/scoring.ts` is pure computation — no I/O dependencies, easiest to unit test

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 areas where AI agents could make different choices — naming conventions, import style, error handling shape, test location, and state mutation.

---

### Naming Patterns

**File & Module Naming — `kebab-case`**
- All files under `src/` use kebab-case: `domain/store.ts`, `ai/client.ts`, `utils/hash.ts`
- No PascalCase filenames anywhere in the project

**TypeScript Naming Conventions:**

| Construct | Convention | Example |
|---|---|---|
| Types / Interfaces | PascalCase | `DomainMeta`, `QuestionRecord`, `SpeedTier` |
| Functions | camelCase | `generateQuestion()`, `writeDomainFile()` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_DIFFICULTY`, `MAX_DIFFICULTY` |
| Zod schemas | PascalCase + `Schema` suffix | `DomainFileSchema`, `QuestionResponseSchema` |
| Zod inferred types | PascalCase (no suffix) | `type DomainFile = z.infer<typeof DomainFileSchema>` |

**Domain file slug naming:**
Lowercase, hyphens only — handled exclusively by `utils/slugify.ts`. No other module derives slugs.

---

### Structure Patterns

**Test co-location — `*.test.ts` alongside source:**
```
src/domain/scoring.ts
src/domain/scoring.test.ts    ✅
__tests__/scoring.test.ts     ❌
```

**No index barrel files:**
Import from the specific module file — never from a re-exporting `index.ts`.
```ts
import { writeDomainFile } from './domain/store.js'   // ✅
import { writeDomainFile } from './domain/index.js'   // ❌
```
Prevents circular dependency traps and keeps imports traceable.

---

### Format Patterns

**JSON domain file fields — `camelCase`:**
`difficultyLevel`, `totalTimePlayedMs`, `answeredAt` — consistent with TypeScript conventions. No `snake_case` in JSON.

**Timestamps — ISO 8601 strings:**
All timestamps stored as `new Date().toISOString()` → `"2026-03-07T10:30:00.000Z"`. Never Unix timestamps.

**ESM imports — always include `.js` extension:**
```ts
import { writeDomainFile } from './domain/store.js'   // ✅ required by NodeNext
import { writeDomainFile } from './domain/store'      // ❌ breaks at runtime
```
This is a NodeNext module resolution requirement, not optional.

---

### Error Handling Patterns

**Result type — no raw `try/catch` in screens:**

All I/O and AI functions return a `Result<T>` type:
```ts
type Result<T> = { ok: true; data: T } | { ok: false; error: string }
```

Screens always check `.ok` before using `.data`:
```ts
// ✅ Correct pattern in screens
const result = await generateQuestion(domain, difficulty)
if (!result.ok) {
  displayError(result.error)
  return router.showHome()
}
```

All `try/catch` blocks live inside `ai/client.ts` and `domain/store.ts` — never in screens.

**User-facing error messages — defined as constants in the owning layer:**
```ts
// ai/client.ts
export const AI_ERRORS = {
  NETWORK: 'Could not reach the Copilot API. Check your connection and try again.',
  AUTH: 'Copilot authentication failed. Ensure you have an active GitHub Copilot subscription.',
  PARSE: 'Received an unexpected response from Copilot. Please try again.',
}
```

---

### Process Patterns

**Spinner lifecycle — owned by the screen, not the AI client:**
```ts
// ✅ screens/quiz.ts
const spinner = ora('Generating question...').start()
const result = await generateQuestion(...)
spinner.stop()

// ❌ Never inside ai/client.ts
```
`ai/client.ts` is pure data — it never renders. All terminal output belongs in screens.

**Domain file write — after every answer, no buffering:**
After each answered question, `store.ts` writes the full updated domain state immediately. No deferred writes. Simplifies crash recovery (NFR 3).

**Difficulty + streak mutation — pure function in `domain/scoring.ts` only:**
```ts
// ✅ Only valid pattern
const updatedMeta = applyAnswer(meta, isCorrect)   // returns new DomainMeta

// ❌ Never mutate meta directly in screens or anywhere else
meta.streakCount++
```
`applyAnswer()` is a pure function: takes current meta + outcome, returns new meta. No side effects. Easy to unit test.

---

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `.js` extensions on all ESM imports
- Return `Result<T>` from all I/O and AI functions — never throw to callers
- Import from specific module files, never barrel `index.ts` files
- Place all disk writes in `domain/store.ts` exclusively
- Place all Copilot SDK calls in `ai/client.ts` exclusively
- Use `applyAnswer()` for all difficulty/streak/score mutations
- Store timestamps as ISO 8601 strings
- Use `utils/slugify.ts` for all domain name → slug conversions

**Anti-Patterns — Never Do These:**
- Raw `throw` or unhandled `try/catch` in screens
- `fs.writeFile()` called outside `domain/store.ts`
- `new CopilotClient()` or SDK calls outside `ai/client.ts`
- `meta.streakCount++` or any direct mutation of domain state
- Importing with bare specifiers (no `.js` extension) in ESM modules
- Barrel `index.ts` re-exports

## Project Structure & Boundaries

### Complete Project Directory Structure

```
brain-break/
├── README.md
├── package.json                    # bin, engines, type: module, scripts
├── tsconfig.json                   # strict, nodenext, target es2022
├── .gitignore                      # node_modules/, dist/
├── .github/
│   └── workflows/
│       └── ci.yml                  # tsc --noEmit + vitest
├── src/
│   ├── index.ts                    # Entry: bootstraps app, calls router.showHome()
│   ├── router.ts                   # Navigation dispatcher — only file that calls screens
│   ├── screens/
│   │   ├── home.ts                 # F1: domain list, create, archive/unarchive
│   │   ├── home.test.ts
│   │   ├── quiz.ts                 # F3: question loop, timer, answer feedback
│   │   ├── quiz.test.ts
│   │   ├── history.ts              # F6: paginated history view
│   │   ├── history.test.ts
│   │   ├── stats.ts                # F7: stats dashboard
│   │   └── stats.test.ts
│   ├── ai/
│   │   ├── client.ts               # F2: Copilot SDK calls + Result<T> error wrapping
│   │   ├── client.test.ts
│   │   ├── prompts.ts              # F2: prompt templates + Zod QuestionResponseSchema
│   │   └── prompts.test.ts
│   ├── domain/
│   │   ├── schema.ts               # F5: DomainFile type + DomainFileSchema (Zod)
│   │   ├── schema.test.ts
│   │   ├── store.ts                # F5: read/write domain files (atomic)
│   │   ├── store.test.ts
│   │   ├── scoring.ts              # F4: applyAnswer(), score delta formula
│   │   └── scoring.test.ts
│   └── utils/
│       ├── hash.ts                 # SHA-256 hashing for deduplication
│       ├── hash.test.ts
│       ├── slugify.ts              # Domain name → kebab-case file slug
│       ├── slugify.test.ts
│       ├── screen.ts               # Story 1.6: clearScreen() — ANSI viewport reset
│       ├── screen.test.ts
│       ├── format.ts               # Shared chalk/terminal formatting helpers
│       └── format.test.ts
└── dist/                           # Compiled output — gitignored
```

### Architectural Boundaries

**External Boundaries (outside the process):**

| Boundary | Owner | Entry Point |
|---|---|---|
| GitHub Copilot SDK | `ai/client.ts` | Only module that instantiates SDK client |
| File system (`~/.brain-break/`) | `domain/store.ts` | Only module that calls `fs.*` write operations |
| Terminal I/O (stdout/stdin) | `screens/*` + `router.ts` | `inquirer`, `ora`, `chalk` used only here; `utils/screen.ts` owns the viewport-clear primitive |

**Internal Boundaries:**
- `screens/` → may import from `domain/`, `ai/`, `utils/` — never the reverse
- `router.ts` → imports from `screens/` only — never from `domain/` or `ai/` directly
- `domain/scoring.ts` → pure computation, no imports from `screens/` or `ai/`
- `utils/` → no imports from any other `src/` directory

### Feature to Structure Mapping

| Feature | Primary Module(s) |
|---|---|
| F1 — Domain Management | `screens/home.ts`, `domain/store.ts`, `utils/slugify.ts` |
| F2 — AI Question Generation | `ai/client.ts`, `ai/prompts.ts`, `domain/scoring.ts` (difficulty input) |
| F3 — Interactive Quiz | `screens/quiz.ts`, `ai/client.ts`, `domain/store.ts`, `domain/scoring.ts` |
| F4 — Scoring System | `domain/scoring.ts` (pure logic), `domain/store.ts` (persist) |
| F5 — Persistent History | `domain/store.ts`, `domain/schema.ts` |
| F6 — View History | `screens/history.ts`, `domain/store.ts` |
| F7 — View Stats | `screens/stats.ts`, `domain/store.ts` |
| NFR 5 — Terminal Screen Mgmt | `utils/screen.ts` (primitive) + all `screens/*.ts` (consumers) |

**Cross-Cutting Concern Mapping:**

| Concern | Location |
|---|---|
| SHA-256 deduplication | `utils/hash.ts` (compute) + `domain/store.ts` (persist hashes) |
| Adaptive difficulty | `domain/scoring.ts` → `applyAnswer()` |
| Atomic file write | `domain/store.ts` → `writeDomain()` |
| AI error messages | `ai/client.ts` → `AI_ERRORS` constants |
| Domain slug derivation | `utils/slugify.ts` exclusively |
| Terminal screen clearing | `utils/screen.ts` → `clearScreen()` — called as first operation in every screen render path |

### Integration Points

**Data Flow — Question Cycle:**
```
screens/quiz.ts
  → ai/client.ts.generateQuestion(domain, difficulty)  [Copilot API]
  → ai/prompts.ts (prompt + Zod parse)
  → returns Result<Question>
  → domain/scoring.ts.applyAnswer(meta, isCorrect, timeTakenMs)
  → returns { updatedMeta, scoreDelta }
  → domain/store.ts.writeDomain(slug, updatedState)    [fs.rename atomic]
```

**Data Flow — Startup:**
```
index.ts
  → router.showHome()
  → screens/home.ts
  → domain/store.ts.listDomains()                      [reads ~/.brain-break/]
  → renders domain list with scores
```

### Development Workflow

**Suggested `package.json` scripts:**
```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are mutually compatible — Node.js v25.8.0, ESM, NodeNext, `inquirer` v12, `ora` v8, `chalk` v5, `zod`, and `vitest` are all ESM-native and internally consistent. The `Result<T>` error pattern, atomic write strategy, and Zod validation approach are coherent and mutually reinforcing. The directory structure directly implements all dependency rules by design.

### Requirements Coverage Validation ✅

| Feature | Status | Location |
|---|---|---|
| F1 — Domain Management | ✅ | `screens/home.ts`, `domain/store.ts`, `utils/slugify.ts` |
| F2 — AI Question Generation | ✅ | `ai/client.ts`, `ai/prompts.ts`, `domain/scoring.ts` |
| F3 — Interactive Quiz | ✅ | `screens/quiz.ts` + both data layers |
| F4 — Scoring System | ✅ | `domain/scoring.ts` (pure) + `domain/store.ts` (persist) |
| F5 — Persistent History | ✅ | `domain/store.ts`, `domain/schema.ts` |
| F6 — View History | ✅ | `screens/history.ts` |
| F7 — View Stats | ✅ | `screens/stats.ts` |

| NFR | Status | Addressed By |
|---|---|---|
| NFR 1 — ≤5s question generation | ✅ | `ora` spinner + `Result<T>` fast-fail path |
| NFR 2 — API error handling | ✅ | `AI_ERRORS` constants + `Result<T>` in `ai/client.ts` |
| NFR 3 — Data integrity / corruption | ✅ | Write-then-rename atomic + Zod schema on read + `defaultDomainFile()` on ENOENT |
| NFR 4 — ≤2s startup | ✅ | No heavy imports at startup; `meta`-first schema design |
| NFR 5 — Terminal screen management | ✅ | `utils/screen.ts` → `clearScreen()` called as first operation in every screen render path |

### Implementation Readiness Validation ✅

All critical decisions are documented with explicit versions. Patterns are comprehensive with concrete examples and anti-patterns. Project structure is fully specified with feature-to-file mapping. All potential AI agent conflict points have been addressed with clear enforcement guidelines.

**2026-03-14 update:** NFR 5 (Terminal Screen Management) added — `utils/screen.ts` is a new module; all `screens/*.ts` files must call `clearScreen()` as their first render operation. The screen-clearing pattern and enforcement rule are documented in the Terminal UI Architecture section above.

### Gap Analysis Results

**No critical gaps.** One important behaviour called out explicitly:

**Missing domain file = new domain (NFR 3):**
`domain/store.ts.readDomain()` MUST return a default value (not an error) when the target file does not exist. This "missing = clean start" behaviour is required by NFR 3.

**Resolution:** `domain/schema.ts` exports a `defaultDomainFile()` factory function returning a valid `DomainFile` at difficulty level 2, score 0, empty history and hashes. `store.ts.readDomain()` calls this on `ENOENT` — no error propagated to the caller.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance and security considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined (co-location, no barrels)
- [x] Error handling pattern (`Result<T>`) specified
- [x] Process patterns documented (spinner, atomic write, pure scoring)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] All integration points mapped (question cycle, startup flow)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Single external dependency (Copilot SDK) with one clear integration point
- All state mutations flow through pure functions — easy to test, easy to reason about
- All I/O in two dedicated modules — security and integrity enforced in one place each
- `Result<T>` pattern eliminates entire category of unhandled exceptions in screens

**Areas for Future Enhancement (Post-MVP):**
- Fuzzy/similarity deduplication (explicitly noted in PRD)
- Startup optimisation: read only `meta` fields if history files grow large
- Retry with backoff on Copilot API

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently — refer to Enforcement Guidelines
- Respect module boundaries: `store.ts` owns all writes, `client.ts` owns all SDK calls
- Always return `Result<T>` from I/O functions, never throw to callers
- Use `.js` extensions on all ESM imports
- Call `defaultDomainFile()` from `domain/schema.ts` on ENOENT in `store.ts.readDomain()`

**First Implementation Step:**
```bash
npm init -y
npm install typescript tsx @types/node --save-dev
npx tsc --init --module nodenext --moduleResolution nodenext --target es2022
```
Then create the `src/` directory structure and begin with `domain/schema.ts`.
