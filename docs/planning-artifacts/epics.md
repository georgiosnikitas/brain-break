---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd-brain-break-2026-03-06.md
  - _bmad-output/planning-artifacts/architecture.md
---

# brain-break - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for brain-break, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: On every launch, the app displays a home screen listing all configured domains, each showing current score and total questions answered. If no domains exist, the only available action is to create a new one.

FR2: Users can create a new domain at any time from the home screen by typing any free-text topic name; the name is slugified and saved as a new domain file.

FR3: Users can select an active domain from the home screen to start or resume a quiz session. A contextual motivational message is displayed if the user has returned within 7 days of their last session or their score is trending upward.

FR4: Domains can be archived from the home screen — archived domains are removed from the active list but all their history, score, and progress are fully preserved.

FR5: The home screen includes a "View archived domains" action that opens the archived list, where the user can unarchive any domain to resume exactly where they left off.

FR6: Questions are generated on demand via the GitHub Copilot SDK as multiple-choice (4 options: A–D). Questions never repeat within a domain — SHA-256 deduplication is persisted across all sessions.

FR7: Difficulty adapts automatically on a 5-level scale: 3 consecutive correct answers increases difficulty by 1 (max level 5); 3 consecutive wrong answers decreases it by 1 (min level 1). New domains start at level 2. Difficulty and streak counter persist across sessions per domain.

FR8: Questions are displayed one at a time in the terminal. A silent timer starts when the question is displayed and stops when the user submits their answer. After answering, the user sees: correct/incorrect status, the right answer if they were wrong, time taken, speed tier (fast/normal/slow), and score delta.

FR9: Score is per-domain, cumulative, and never resets. Score delta = base points × speed multiplier (rounded to nearest integer). Base points by difficulty: L1=10, L2=20, L3=30, L4=40, L5=50. Speed multipliers: Fast+Correct=×2, Normal+Correct=×1, Slow+Correct=×0.5, Fast+Incorrect=−1×, Normal+Incorrect=−1.5×, Slow+Incorrect=−2×.

FR10: All domain data (score, difficulty level, streak, total time played, complete question history) persists locally in ~/.brain-break/<domain-slug>.json across sessions. Each domain's state is fully isolated.

FR11: Every answered question is recorded with: question text, all answer options, the user's chosen answer, correct answer, whether it was correct, timestamp (ISO 8601), time taken (ms), speed tier, score delta, and difficulty level.

FR12: Users can view their full paginated question history for the active domain (10 questions per page), displaying all fields recorded per question.

FR13: Users can view a stats dashboard for the active domain showing: current score, total questions answered, correct/incorrect count and accuracy %, total time played, current difficulty level, score trend over the last 30 days (growing/flat/declining), days since first session, and current return streak.

### NonFunctional Requirements

NFR1: The next question must appear within ≤ 5 seconds of the user submitting an answer (covering Copilot API call + local persistence). A loading spinner (ora) is displayed during generation so the terminal does not appear frozen.

NFR2: If the Copilot API is unreachable, the app displays "Could not reach the Copilot API. Check your connection and try again." and returns to the home screen without crashing. If authentication fails, the app displays "Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in." and exits cleanly.

NFR3: Missing domain file → treated as a new domain (score 0, no history, no error displayed). Corrupted domain file → warning displayed, domain reset to clean state, corrupted file overwritten on next save.

NFR4: The app must reach the home screen within ≤ 2 seconds of launch on a standard developer machine.

### Additional Requirements

- **Project Scaffold (Epic 1, Story 1):** Minimal TypeScript scaffold (ESM) — not oclif. Initialize with `npm init -y`, install `typescript`, `tsx`, `@types/node` as dev deps. Run `npx tsc --init --module nodenext --moduleResolution nodenext --target es2022`. Create full `src/` directory structure as defined in Architecture.

- **Language & Configuration:** TypeScript strict mode, `"type": "module"` in package.json, NodeNext module resolution, target ES2022. All ESM imports MUST include `.js` extension.

- **Runtime Dependencies:** `inquirer` v12 (prompts), `ora` v8 (spinner), `chalk` v5 (styling); all ESM-native.

- **Dev Dependencies:** `typescript`, `tsx`, `@types/node`, `vitest`.

- **Error Handling Pattern:** All I/O and AI functions return `Result<T>` (`{ ok: true; data: T } | { ok: false; error: string }`). No raw `throw` in screens — all `try/catch` lives in `ai/client.ts` and `domain/store.ts`.

- **Atomic File Writes:** All domain writes use write-then-rename (`~/.brain-break/.tmp-<slug>.json` → target), exclusively in `domain/store.ts`.

- **Domain Data Schema:** Split meta + history JSON. `hashes` array on disk, loaded as `Set<string>` at runtime for O(1) lookup. `defaultDomainFile()` factory called on `ENOENT` in `store.ts.readDomain()`.

- **Zod Validation:** All Copilot API responses validated with a Zod schema before any field is accessed. AI output is treated as an untrusted external boundary.

- **CI:** GitHub Actions workflow (`ci.yml`) running `tsc --noEmit` + `vitest` on push.

- **Distribution:** `bin` field in `package.json` pointing to `dist/index.js`. `engines.node: ">=25.8.0"`. npx-compatible.

- **Testing:** Co-located `*.test.ts` files alongside each source file. No separate `__tests__/` folder.

### FR Coverage Map

| FR | Epic | Brief Description |
|---|---|---|
| FR1 | Epic 2 | Home screen — domain list with score + count |
| FR2 | Epic 2 | Create new domain via free-text input |
| FR3 | Epic 2 | Select domain → resume session + motivational message |
| FR4 | Epic 2 | Archive domain (preserves all data) |
| FR5 | Epic 2 | View archived domains + unarchive |
| FR6 | Epic 3 | Copilot SDK question generation + SHA-256 deduplication |
| FR7 | Epic 3 | Adaptive difficulty (5 levels, streak-driven, persists) |
| FR8 | Epic 3 | Quiz loop — silent timer + post-answer feedback |
| FR9 | Epic 3 | Scoring system — base points × speed multiplier |
| FR10 | Epic 3 | Full domain state persistence (score, difficulty, streak, history) |
| FR11 | Epic 3 | Per-question record written after every answer |
| FR12 | Epic 4 | Paginated question history view |
| FR13 | Epic 4 | Stats dashboard (score, accuracy, trend, streak, time) |

| NFR | Epic | Coverage |
|---|---|---|
| NFR1 | Epic 3 | ≤ 5s + ora spinner |
| NFR2 | Epic 3 | Graceful API/auth error → home screen |
| NFR3 | Epic 2 | ENOENT → defaultDomainFile(); corrupted → warn + reset |
| NFR4 | Epic 2 | ≤ 2s startup to home screen |

## Epic List

### Epic 1: Project Foundation & Developer Infrastructure
Users (developers) can clone the repo, install dependencies, and run `tsx src/index.ts` to reach a working (if minimal) entry point — with the full typed domain schema, atomic file store, and CI in place as the verified foundation every other epic builds on.
**FRs covered:** N/A (technical foundation)
**NFRs covered:** partial NFR4 (startup path wired)
**Additional requirements covered:** TypeScript scaffold, ESM/NodeNext/strict, full `src/` directory structure, `Result<T>` type, Zod domain schema, `defaultDomainFile()`, atomic write store, CI pipeline, npm/npx distribution config

### Epic 2: Domain Management
Users can launch the app, see their domain list with scores, create a new domain, select a domain to start a session, archive domains they're not actively using, and unarchive them to resume exactly where they left off.
**FRs covered:** FR1, FR2, FR3, FR4, FR5
**NFRs covered:** NFR3 (missing/corrupted file handling), NFR4 (≤ 2s startup)

### Epic 3: AI-Powered Adaptive Quiz
Users can take an AI-generated, never-repeating, multiple-choice quiz session in their chosen domain — with a silent response timer, adaptive difficulty that tracks streaks across sessions, cumulative domain-scoped scoring with speed multipliers, and graceful error handling if the Copilot API is unavailable.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11
**NFRs covered:** NFR1 (≤ 5s generation + spinner), NFR2 (API error handling)

### Epic 4: Learning Insights
Users can review their complete question history for any domain (paginated, all recorded fields) and view a stats dashboard showing score, accuracy, difficulty level, time played, score trend, and return streak — giving them a genuine signal of their knowledge growth over time.
**FRs covered:** FR12, FR13

---

## Epic 1: Project Foundation & Developer Infrastructure

The full TypeScript/ESM scaffold, typed domain schema, atomic file store, utility modules, and CI pipeline are in place — every subsequent epic builds on this verified foundation.

### Story 1.1: Project Scaffold & TypeScript Configuration

As a developer,
I want a fully configured TypeScript ESM project scaffold with all dependencies installed and the complete `src/` directory structure in place,
So that I have a verified, runnable foundation to build all features on.

**Acceptance Criteria:**

**Given** a fresh clone of the repo
**When** I run `npm install`
**Then** all runtime deps (`inquirer@12`, `ora@8`, `chalk@5`, `zod`) and dev deps (`typescript`, `tsx`, `@types/node`, `vitest`) are installed without errors

**Given** the project is installed
**When** I run `npm run typecheck`
**Then** `tsc --noEmit` exits with code 0 and no errors

**Given** the project is installed
**When** I run `tsx src/index.ts`
**Then** the process starts without crashing (may print a placeholder message and exit cleanly)

**Given** the project structure
**When** I inspect the repo
**Then** `package.json` has `"type": "module"`, a `bin` field pointing to `dist/index.js`, `engines.node: ">=25.8.0"`, and all required scripts (`dev`, `build`, `start`, `typecheck`, `test`, `test:watch`)
**And** `tsconfig.json` has `strict: true`, `module: "nodenext"`, `moduleResolution: "nodenext"`, `target: "es2022"`
**And** the full `src/` directory tree exists (all files may be empty stubs): `index.ts`, `router.ts`, `screens/`, `ai/`, `domain/`, `utils/`
**And** `.gitignore` excludes `node_modules/` and `dist/`

---

### Story 1.2: Domain Data Schema & Types

As a developer,
I want the core domain data types and Zod schemas defined in `domain/schema.ts`,
So that all modules have a single, type-safe source of truth for domain file structure.

**Acceptance Criteria:**

**Given** `domain/schema.ts` is implemented
**When** I import `DomainFileSchema`
**Then** it is a Zod schema that validates a complete domain JSON object with `meta`, `hashes`, and `history` fields matching the architecture-defined structure

**Given** `domain/schema.ts` is implemented
**When** I call `defaultDomainFile()`
**Then** it returns a valid `DomainFile` with `score: 0`, `difficultyLevel: 2`, `streakCount: 0`, `streakType: "none"`, `totalTimePlayedMs: 0`, empty `hashes: []`, and empty `history: []`

**Given** `domain/schema.ts` is implemented
**When** I import the `Result<T>` type
**Then** it resolves to `{ ok: true; data: T } | { ok: false; error: string }`

**Given** `domain/schema.ts` has tests in `domain/schema.test.ts`
**When** I run `npm test`
**Then** all schema tests pass, covering valid input, `defaultDomainFile()` output, and rejection of malformed input

---

### Story 1.3: Domain File Store — Atomic Read/Write

As a developer,
I want `domain/store.ts` to provide atomic read/write operations for domain JSON files,
So that domain data is never corrupted by partial writes.

**Acceptance Criteria:**

**Given** `domain/store.ts` is implemented
**When** I call `writeDomain(slug, domainFile)`
**Then** it writes to `~/.brain-break/.tmp-<slug>.json` first, then renames it to `~/.brain-break/<slug>.json` atomically
**And** the `~/.brain-break/` directory is created if it does not exist

**Given** `domain/store.ts` is implemented
**When** I call `readDomain(slug)` and the file exists and is valid
**Then** it returns `{ ok: true, data: <DomainFile> }` with the parsed, Zod-validated domain

**Given** `domain/store.ts` is implemented
**When** I call `readDomain(slug)` and the file does not exist (ENOENT)
**Then** it returns `{ ok: true, data: defaultDomainFile() }` — no error propagated

**Given** `domain/store.ts` is implemented
**When** I call `readDomain(slug)` and the file is corrupted (Zod validation fails)
**Then** it returns `{ ok: false, error: "Domain data for [slug] appears corrupted and cannot be loaded. Starting fresh." }`

**Given** `domain/store.ts` is implemented
**When** I call `listDomains()`
**Then** it returns an array of `{ slug, meta }` for every `*.json` file in `~/.brain-break/` that is not prefixed with `.tmp-` — including archived domains
**And** it returns `{ ok: true, data: [] }` when the directory does not exist yet
**And** callers (e.g. `screens/home.ts`) are responsible for filtering by `meta.archived` to separate active from archived domains

**Given** `domain/store.ts` has tests in `domain/store.test.ts`
**When** I run `npm test`
**Then** all store tests pass, covering write/read roundtrip, ENOENT default, corrupted file, and listDomains empty

---

### Story 1.4: Utility Modules — Hash, Slugify, Format

As a developer,
I want the `utils/hash.ts`, `utils/slugify.ts`, and `utils/format.ts` utility modules implemented,
So that SHA-256 hashing, domain name slugification, and shared terminal formatting are available to all modules through a single, tested source.

**Acceptance Criteria:**

**Given** `utils/hash.ts` is implemented
**When** I call `hashQuestion(text)`
**Then** it returns the SHA-256 hex digest of the lowercased, whitespace-stripped input string
**And** calling it twice with the same normalized input returns the same hash

**Given** `utils/slugify.ts` is implemented
**When** I call `slugify("Spring Boot microservices")`
**Then** it returns `"spring-boot-microservices"`
**And** special characters and multiple consecutive spaces are collapsed to single hyphens
**And** leading/trailing hyphens are removed

**Given** `utils/format.ts` is implemented
**When** I import shared formatting helpers
**Then** they use `chalk` v5 for color/styling and are usable in all screen modules without duplicating chalk imports

**Given** all three utils have co-located test files (`*.test.ts`)
**When** I run `npm test`
**Then** all utility tests pass

---

### Story 1.5: GitHub Actions CI Pipeline

As a developer,
I want a GitHub Actions CI workflow that runs type checking and tests on every push,
So that regressions are caught automatically before they reach the main branch.

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml` is implemented
**When** a push is made to any branch
**Then** the CI workflow runs `npm run typecheck` (`tsc --noEmit`) and `npm test` (`vitest run`)
**And** the workflow fails if either command exits with a non-zero code

**Given** the CI workflow runs
**When** all checks pass
**Then** the workflow completes successfully with a green status

---

## Epic 2: Domain Management

Users can launch the app, see their domain list with scores, create a new domain, select a domain to start a session, archive domains they're not actively using, and unarchive them to resume exactly where they left off.

### Story 2.1: Home Screen — Display Domain List

As a user,
I want the app to display a home screen on launch listing all active domains with their scores and question counts,
So that I can see my current progress at a glance and choose what to do next.

**Acceptance Criteria:**

**Given** `screens/home.ts` and `router.ts` are implemented and `index.ts` bootstraps the app
**When** I run `tsx src/index.ts`
**Then** the home screen renders within ≤ 2 seconds showing a list of all active (non-archived) domains
**And** each domain entry shows: domain name, current score, and total questions answered
**And** the available actions include: select a domain, create a new domain, view archived domains, and exit

**Given** no domain files exist in `~/.brain-break/`
**When** the home screen loads
**Then** the domain list is empty and the only highlighted action is "Create new domain"

**Given** the home screen loads
**When** I select "Exit"
**Then** the process exits cleanly with code 0

---

### Story 2.2: Create New Domain

As a user,
I want to create a new domain by typing any free-text topic name from the home screen,
So that I can immediately start getting quiz questions on any technical subject I choose.

**Acceptance Criteria:**

**Given** I am on the home screen
**When** I select "Create new domain" and type a domain name (e.g. "Spring Boot microservices")
**Then** the app calls `slugify()` to derive a file slug (e.g. `spring-boot-microservices`)
**And** a new domain file is created at `~/.brain-break/spring-boot-microservices.json` with `defaultDomainFile()` values
**And** the home screen refreshes showing the new domain in the active list

**Given** I type a domain name that slugifies to an already-existing slug
**When** I confirm creation
**Then** the app informs me the domain already exists and returns to the home screen without creating a duplicate file

**Given** I am creating a domain
**When** I leave the name field empty and confirm
**Then** the app displays a validation message and re-prompts without creating a file

---

### Story 2.3: Select Domain & Motivational Message

As a user,
I want to select an active domain from the home screen and receive a motivational message when I'm on a return visit or upward score trend,
So that I feel acknowledged and encouraged to keep going.

**Acceptance Criteria:**

**Given** I am on the home screen and at least one active domain exists
**When** I select a domain
**Then** the app reads the domain file via `readDomain()` and proceeds to the quiz screen

**Given** I select a domain and my last session for that domain was within 7 days
**When** the domain loads
**Then** a contextual motivational message is displayed (e.g. "Welcome back! Keep the streak going.")

**Given** I select a domain and my score has been increasing over the last 3+ sessions
**When** the domain loads
**Then** a motivational message referencing an upward score trend is displayed

**Given** I select a domain and the domain file is corrupted (Zod validation fails on read)
**When** the domain loads
**Then** the app displays the corrupted-file warning message and resets the domain to `defaultDomainFile()` before proceeding

---

### Story 2.4: Archive & Unarchive Domains

As a user,
I want to archive domains I'm not currently using and unarchive them later to resume exactly where I left off,
So that my active domain list stays focused without losing any history or progress.

**Acceptance Criteria:**

**Given** I am on the home screen and at least one active domain exists
**When** I choose to archive a domain
**Then** the domain file is updated with `meta.archived: true` and saved atomically
**And** the domain disappears from the active domain list immediately

**Given** I archived one or more domains
**When** I select "View archived domains" from the home screen
**Then** the app shows a list of all archived domains with their last-known scores and question counts

**Given** I am viewing the archived domains list
**When** I select a domain and choose "Unarchive"
**Then** the archived flag is removed, the file is saved atomically, and the domain reappears in the active list on the home screen
**And** all history, score, difficulty level, and streak data are exactly as they were before archiving

**Given** I am viewing the archived domains list
**When** I select "Back"
**Then** I return to the home screen

---

## Epic 3: AI-Powered Adaptive Quiz

Users can take an AI-generated, never-repeating, multiple-choice quiz session in their chosen domain — with a silent response timer, adaptive difficulty that tracks streaks across sessions, cumulative domain-scoped scoring with speed multipliers, and graceful error handling if the Copilot API is unavailable.

### Story 3.1: Copilot SDK Integration & Question Generation

As a developer,
I want `ai/client.ts` and `ai/prompts.ts` to integrate with the GitHub Copilot SDK and return validated question objects via `Result<T>`,
So that any screen can request a question and always receive either a valid result or a clear error — never a crash.

**Acceptance Criteria:**

**Given** `ai/prompts.ts` is implemented
**When** I call `buildQuestionPrompt(domain, difficultyLevel)`
**Then** it returns a structured prompt string instructing the model to return a JSON object with: `question`, `options` (A–D), `correctAnswer`, `difficultyLevel`, and `speedThresholds` (`{ fastMs, slowMs }`)
**And** `QuestionResponseSchema` (Zod) is exported and validates this exact shape

**Given** `ai/client.ts` is implemented
**When** I call `generateQuestion(domain, difficultyLevel, existingHashes)`
**Then** it calls the Copilot SDK with the prompt from `buildQuestionPrompt()`
**And** validates the response with `QuestionResponseSchema` before returning
**And** computes `hashQuestion()` on the returned question text and checks it against `existingHashes`
**And** if the hash already exists (duplicate), retries once with an explicit "do not repeat" instruction
**And** returns `{ ok: true, data: Question }` on success

**Given** the Copilot API is unreachable or returns a network error
**When** `generateQuestion()` is called
**Then** it returns `{ ok: false, error: AI_ERRORS.NETWORK }`

**Given** the Copilot API returns an authentication failure
**When** `generateQuestion()` is called
**Then** it returns `{ ok: false, error: AI_ERRORS.AUTH }`

**Given** the Copilot API returns a response that fails Zod validation
**When** `generateQuestion()` is called
**Then** it returns `{ ok: false, error: AI_ERRORS.PARSE }`

**Given** `ai/client.test.ts` exists
**When** I run `npm test`
**Then** all tests pass, covering success path, network error, auth error, and parse error (SDK mocked)

---

### Story 3.2: Scoring & Difficulty Progression Logic

As a developer,
I want `domain/scoring.ts` to implement the `applyAnswer()` pure function that computes score delta and updates difficulty/streak state,
So that all score and difficulty mutations happen in one tested, side-effect-free place.

**Acceptance Criteria:**

**Given** `domain/scoring.ts` is implemented
**When** I call `applyAnswer(meta, isCorrect, timeTakenMs, speedThresholds)`
**Then** it returns `{ updatedMeta: DomainMeta, scoreDelta: number }` without mutating the input

**Given** a correct answer at difficulty level 3 answered fast (timeTakenMs < speedThresholds.fastMs)
**When** `applyAnswer()` runs
**Then** `scoreDelta` = `30 × 2` = `60`
**And** `updatedMeta.score` = `meta.score + 60`

**Given** an incorrect answer at difficulty level 3 answered slowly (timeTakenMs > speedThresholds.slowMs)
**When** `applyAnswer()` runs
**Then** `scoreDelta` = `-(30 × 2)` = `-60`
**And** `updatedMeta.score` = `meta.score - 60`

**Given** a streak of 3 consecutive correct answers at difficulty level 3
**When** the 3rd correct answer is processed by `applyAnswer()`
**Then** `updatedMeta.difficultyLevel` = `4` (increased by 1), capped at 5

**Given** a streak of 3 consecutive incorrect answers at difficulty level 2
**When** the 3rd incorrect answer is processed by `applyAnswer()`
**Then** `updatedMeta.difficultyLevel` = `1` (decreased by 1), minimum 1

**Given** a correct answer after a wrong streak (or vice versa)
**When** `applyAnswer()` runs
**Then** `updatedMeta.streakCount` resets to `1` and `streakType` flips accordingly

**Given** `domain/scoring.test.ts` exists
**When** I run `npm test`
**Then** all tests pass, covering all 6 speed×outcome combinations, streak transitions, and difficulty boundary clamping

---

### Story 3.3: Interactive Quiz Loop

As a user,
I want to answer AI-generated multiple-choice questions in my chosen domain one at a time — with score feedback and speed tier shown after each answer — and have everything persist automatically after every question,
So that I can take a meaningful quiz session and never lose progress even if I quit mid-session.

**Acceptance Criteria:**

**Given** I have selected a domain from the home screen
**When** `screens/quiz.ts` loads
**Then** an `ora` spinner starts with "Generating question..." while `generateQuestion()` is called
**And** the spinner stops and the question is displayed once the result is received

**Given** a question is displayed
**When** I choose one of the 4 answer options (A–D)
**Then** the silent timer stops and `timeTakenMs` is recorded
**And** `applyAnswer()` is called to compute `scoreDelta` and `updatedMeta`
**And** the feedback panel shows: correct/incorrect, the correct answer (if I was wrong), time taken (ms), speed tier (fast/normal/slow based on `speedThresholds`), and score delta

**Given** an answer has been processed
**When** `writeDomain()` is called
**Then** the full updated domain state (meta, hashes + new hash appended, history + new record appended) is atomically persisted before the next question is shown
**And** every `QuestionRecord` field specified in FR11 is written (question, options, correctAnswer, userAnswer, isCorrect, answeredAt ISO8601, timeTakenMs, speedTier, scoreDelta, difficultyLevel)

**Given** `generateQuestion()` returns `{ ok: false, error: AI_ERRORS.NETWORK }`
**When** the error is received in the quiz screen
**Then** the error message is displayed and the user is returned to the home screen without crashing

**Given** `generateQuestion()` returns `{ ok: false, error: AI_ERRORS.AUTH }`
**When** the error is received in the quiz screen
**Then** the auth error message is displayed and the process exits cleanly

**Given** I am in an active quiz session
**When** I choose "Exit quiz" (available after each answer)
**Then** all persisted data is preserved and I am returned to the home screen

---

## Epic 4: Learning Insights

Users can review their complete question history for any domain (paginated) and view a stats dashboard with score, accuracy, trend, and return streak — giving them a genuine signal of knowledge growth over time.

### Story 4.1: Paginated Question History View

As a user,
I want to view my full question history for the active domain — paginated at 10 entries per page — with all recorded fields visible,
So that I can review past questions, see where I went wrong, and track my learning in detail.

**Acceptance Criteria:**

**Given** I am on the home screen and select a domain, then choose "View History"
**When** `screens/history.ts` loads
**Then** the history is read from the domain file and displayed 10 entries per page, most recent first
**And** each entry shows: question text, all 4 options, my chosen answer, the correct answer, whether I was correct, timestamp (formatted), time taken (ms), speed tier, score delta, and difficulty level

**Given** the domain has more than 10 history entries
**When** viewing history
**Then** pagination controls are shown (Next / Previous / Back) and navigate correctly between pages

**Given** the domain has 10 or fewer history entries
**When** viewing history
**Then** all entries are shown on a single page with no pagination controls, only a "Back" option

**Given** the domain has no history entries
**When** I navigate to View History
**Then** a message is shown ("No questions answered yet") and a "Back" option returns me to the home screen

**Given** I am on the history screen
**When** I select "Back"
**Then** I return to the home screen

---

### Story 4.2: Stats Dashboard

As a user,
I want to view a stats dashboard for the active domain showing my score, accuracy, time played, difficulty level, score trend, and return streak,
So that I have a clear, motivating picture of my progress and know whether my skills are genuinely growing.

**Acceptance Criteria:**

**Given** I am on the home screen and select a domain, then choose "View Stats"
**When** `screens/stats.ts` loads
**Then** the stats dashboard displays all of the following, derived from the domain file:
- Current score
- Total questions answered
- Correct answer count, incorrect answer count, and accuracy % (rounded to 1 decimal)
- Total time played across all sessions (formatted as h/m/s)
- Current difficulty level (number + label, e.g. "3 — Intermediate")
- Score trend over the last 30 days: "Growing 📈", "Flat ➡️", or "Declining 📉" (derived from `answeredAt` timestamps and `scoreDelta` values in history)
- Days since first session (derived from earliest `answeredAt`)
- Current return streak in days (consecutive days with at least one answered question, derived from `answeredAt` history)

**Given** the domain has no history entries
**When** I navigate to View Stats
**Then** the dashboard shows current score (0), totals (0), and placeholders for derived fields (e.g. "No data yet")

**Given** I am on the stats screen
**When** I select "Back"
**Then** I return to the home screen
