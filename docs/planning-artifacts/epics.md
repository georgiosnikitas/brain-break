---
stepsCompleted: [1, 2, 3, 4]
lastEdited: '2026-03-15'
editHistory:
  - date: '2026-03-15'
    changes: 'Brownfield sync: FR24 (Delete Domain) and FR25 (Coffee Supporter Screen) added to Requirements Inventory and Coverage Maps; FR3 updated to include Delete in sub-menu actions; NFR5 updated to full terminal reset (scroll-back buffer); Epic 1 + Epic 2 headers updated; Story 2.5 ACs updated with Delete option'
  - date: '2026-03-15'
    changes: 'Epic 5 (Global Settings) and Epic 6 (Terminal UI Highlighting & Color System) added with 7 new stories (5.1–5.4, 6.1–6.3); FR14–FR23 and NFR6 added to Requirements Inventory and Coverage Map; final validation passed — 23/23 FRs + 6/6 NFRs covered'
  - date: '2026-03-15'
    changes: 'Story 1.7 (Buy Me a Coffee screen) added to Epic 1'
  - date: '2026-03-14'
    changes: 'NFR5 (Terminal Screen Management) added to Requirements Inventory and NFR Coverage Map; Story 1.6 (Terminal Screen Management) added to Epic 1'
inputDocuments:
  - docs/planning-artifacts/prd.md
  - docs/planning-artifacts/architecture.md
---

# brain-break - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for brain-break, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: On every launch, the app displays a home screen listing all configured active domains, each showing current score and total questions answered. If no domains exist, the only available action is to create a new one. Selecting a domain opens a domain sub-menu (not the quiz directly).

FR2: Users can create a new domain at any time from the home screen by typing any free-text topic name; the name is slugified and saved as a new domain file. The create-domain screen shows an input prompt; pressing Ctrl+C returns the user to the home screen without creating a domain.

FR3: Selecting an active domain from the home screen opens a domain sub-menu. The sub-menu prompt header displays the domain name, current score, and total questions answered (refreshed each time). Available actions: Play, View History, View Stats, Archive, Delete, and Back. Selecting Play displays a contextual motivational message (if the user returned within 7 days or score is trending upward), then begins the quiz. After a quiz session ends, the user returns to the domain sub-menu.

FR4: Domains can be archived from the domain sub-menu — archived domains are removed from the active list but all their history, score, and progress are fully preserved. Archiving returns the user to the home screen.

FR5: The home screen includes a "View archived domains" action that opens the archived list, where the user can unarchive any domain to resume exactly where they left off.

FR6: Questions are generated on demand via the GitHub Copilot SDK as multiple-choice (4 options: A–D). Questions never repeat within a domain — SHA-256 deduplication is persisted across all sessions.

FR7: Difficulty adapts automatically on a 5-level scale: 3 consecutive correct answers increases difficulty by 1 (max level 5); 3 consecutive wrong answers decreases it by 1 (min level 1). New domains start at level 2. Difficulty and streak counter persist across sessions per domain.

FR8: Questions are displayed one at a time in the terminal. A silent timer starts when the question is displayed and stops when the user submits their answer. After answering, the user sees: correct/incorrect status, the right answer if they were wrong, time taken, speed tier (fast/normal/slow), and score delta.

FR9: Score is per-domain, cumulative, and never resets. Score delta = base points × speed multiplier (rounded to nearest integer). Base points by difficulty: L1=10, L2=20, L3=30, L4=40, L5=50. Speed multipliers: Fast+Correct=×2, Normal+Correct=×1, Slow+Correct=×0.5, Fast+Incorrect=−1×, Normal+Incorrect=−1.5×, Slow+Incorrect=−2×.

FR10: All domain data (score, difficulty level, streak, total time played, complete question history) persists locally in ~/.brain-break/<domain-slug>.json across sessions. Each domain's state is fully isolated.

FR11: Every answered question is recorded with: question text, all answer options, the user's chosen answer, correct answer, whether it was correct, timestamp (ISO 8601), time taken (ms), speed tier, score delta, and difficulty level.

FR12: Users can view their full paginated question history for the active domain (10 questions per page), displaying all fields recorded per question.

FR13: Users can view a stats dashboard for the active domain showing: current score, total questions answered, correct/incorrect count and accuracy %, total time played, current difficulty level, score trend over the last 30 days (growing/flat/declining), days since first session, and current return streak.

FR14: The home screen includes a Settings action positioned above the "Buy me a coffee" action.

FR15: The Settings screen allows configuring: Question Language (free-text entry) and Tone of Voice (selectable from 4 presets: Normal, Enthusiastic, Robot, Pirate).

FR16: Settings are global — they apply to all domains and all AI-generated content (questions, answer options, motivational messages).

FR17: Settings persist between sessions in a global settings file at `~/.brain-break/settings.json`. Defaults on missing file: `{ language: "English", tone: "normal" }`.

FR18: Every AI call (questions, motivational messages) injects the active language and tone from global settings — generated content renders in the configured language and voice.

FR19: Settings screen provides Save (persist + return home) and Back (discard changes + return home) navigation.

FR20: All interactive menus render the focused item with inverted foreground/background colors (white text on colored background); unfocused items render in default terminal colors. Applies to: home screen, domain sub-menu, settings screen, archived domains list, history navigation controls, and post-quiz navigation.

FR21: Post-answer feedback colors: correct answer = green; user's wrong answer = red; correct answer reveal = green; score delta positive = green; score delta negative = red.

FR22: Speed tier badge colors: Fast = green, Normal = yellow, Slow = red.

FR23: Difficulty level badge colors: L1 = cyan, L2 = green, L3 = yellow, L4 = magenta, L5 = red.

FR24: Users can permanently delete a domain from the domain sub-menu. Selecting Delete presents a blocking confirmation dialog ("Delete '[domain]' permanently? This cannot be undone.") — confirming permanently removes the domain file and all associated data (history, score, progress) with no recovery path and returns the user to the home screen; declining returns the user to the domain sub-menu.

FR25: The home screen includes a "☕ Buy me a coffee" action positioned between the archived domains separator and the Exit action. Selecting it opens a dedicated screen displaying an ASCII QR code (small, indented) encoding the creator's support URL and the URL in plain text, with a single Back action that returns the user to the home screen.

### NonFunctional Requirements

NFR1: The next question must appear within ≤ 5 seconds of the user submitting an answer (covering Copilot API call + local persistence). A loading spinner (ora) is displayed during generation so the terminal does not appear frozen.

NFR2: If the Copilot API is unreachable, the app displays "Could not reach the Copilot API. Check your connection and try again." and returns to the home screen without crashing. If authentication fails, the app displays "Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in." and exits cleanly.

NFR3: Missing domain file → treated as a new domain (score 0, no history, no error displayed). Corrupted domain file → warning displayed, domain reset to clean state, corrupted file overwritten on next save.

NFR4: The app must reach the home screen within ≤ 2 seconds of launch on a standard developer machine.

NFR5: All screen transitions (home screen, domain sub-menu, quiz questions, post-answer feedback, history navigation, stats dashboard) perform a full terminal reset, clearing both the visible viewport and the scroll-back buffer. All content renders at the top of the terminal window; no prior output is visible or accessible by scrolling after any navigation action.

NFR6: All ANSI color output uses standard 8/16-color ANSI escape codes as baseline — ensuring compatibility across macOS Terminal, iTerm2, Linux terminals, and WSL. Extended 256-color or true-color codes may be used where supported. The application is interactive-only; non-TTY and piped execution modes are out of scope.

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
| FR1 | Epic 2 | Home screen — domain list with score + count; select opens domain sub-menu |
| FR2 | Epic 2 | Create new domain via free-text input |
| FR3 | Epic 2 | Domain sub-menu — Play/History/Stats/Archive/Delete/Back + motivational message on Play |
| FR4 | Epic 2 | Archive domain from domain sub-menu (preserves all data) |
| FR5 | Epic 2 | View archived domains + unarchive |
| FR6 | Epic 3 | Copilot SDK question generation + SHA-256 deduplication |
| FR7 | Epic 3 | Adaptive difficulty (5 levels, streak-driven, persists) |
| FR8 | Epic 3 | Quiz loop — silent timer + post-answer feedback |
| FR9 | Epic 3 | Scoring system — base points × speed multiplier |
| FR10 | Epic 3 | Full domain state persistence (score, difficulty, streak, history) |
| FR11 | Epic 3 | Per-question record written after every answer |
| FR12 | Epic 4 | Paginated question history view |
| FR13 | Epic 4 | Stats dashboard (score, accuracy, trend, streak, time) |
| FR14 | Epic 5 | Settings action on home screen menu |
| FR15 | Epic 5 | Settings screen — language (free-text) + tone (4 presets) |
| FR16 | Epic 5 | Global scope — all domains and all AI-generated content |
| FR17 | Epic 5 | Settings persistence at `~/.brain-break/settings.json` |
| FR18 | Epic 5 | Language + tone injected into every AI call |
| FR19 | Epic 5 | Settings screen Save/Back navigation |
| FR20 | Epic 6 | Full-row inverted highlight on focused menu item — all menus |
| FR21 | Epic 6 | Post-answer feedback colors (correct/incorrect/delta) |
| FR22 | Epic 6 | Speed tier badge colors |
| FR23 | Epic 6 | Difficulty level badge colors |
| FR24 | Epic 2 | Delete domain from sub-menu — confirmation dialog, permanent removal, navigate home |
| FR25 | Epic 1 | Coffee Supporter Screen — QR code + URL + Back navigation |

| NFR | Epic | Coverage |
|---|---|---|
| NFR1 | Epic 3 | ≤ 5s + ora spinner |
| NFR2 | Epic 3 | Graceful API/auth error → home screen |
| NFR3 | Epic 2 | ENOENT → defaultDomainFile(); corrupted → warn + reset |
| NFR4 | Epic 2 | ≤ 2s startup to home screen |
| NFR5 | Story 1.6 | Full terminal reset (viewport + scroll-back buffer) before every screen render (cross-cutting) |
| NFR6 | Epic 6 | ANSI 8/16-color baseline; interactive-only |

## Epic List

### Epic 1: Project Foundation & Developer Infrastructure
Users can clone the repo, install dependencies, and run `tsx src/index.ts` to reach a working (if minimal) entry point — with the full typed domain schema, atomic file store, and CI in place as the verified foundation every other epic builds on.
**FRs covered:** FR25 (Coffee Supporter Screen)
**NFRs covered:** partial NFR4 (startup path wired)
**Additional requirements covered:** TypeScript scaffold, ESM/NodeNext/strict, full `src/` directory structure, `Result<T>` type, Zod domain schema, `defaultDomainFile()`, atomic write store, CI pipeline, npm/npx distribution config

### Epic 2: Domain Management
Users can launch the app, see their domain list with scores, create a new domain, select a domain to open its sub-menu (Play, View History, View Stats, Archive, Delete, Back), archive domains they're not actively using, unarchive them to resume exactly where they left off, and permanently delete domains they no longer need.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR24
**NFRs covered:** NFR3 (missing/corrupted file handling), NFR4 (≤ 2s startup)

### Epic 3: AI-Powered Adaptive Quiz
Users can take an AI-generated, never-repeating, multiple-choice quiz session in their chosen domain — with a silent response timer, adaptive difficulty that tracks streaks across sessions, cumulative domain-scoped scoring with speed multipliers, and graceful error handling if the Copilot API is unavailable.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11
**NFRs covered:** NFR1 (≤ 5s generation + spinner), NFR2 (API error handling)

### Epic 4: Learning Insights
Users can review their complete question history for any domain (paginated, all recorded fields) and view a stats dashboard showing score, accuracy, difficulty level, time played, score trend, and return streak — giving them a genuine signal of their knowledge growth over time.
**FRs covered:** FR12, FR13
### Epic 5: Global Settings
Users can configure their preferred question language and AI tone of voice from a dedicated Settings screen accessible from the home menu — settings persist across sessions, apply to all domains, and take effect on the next AI-generated content (questions, answers, motivational messages).
**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR19
**FRs updated:** FR3 (motivational message → AI-generated with language/tone), FR6/FR18 (language + tone injected into all AI calls)
**NFRs covered:** none directly
**Additional requirements covered:** SettingsFile schema + Zod validation, settings store (read/write `~/.brain-break/settings.json`), prompt builder updated to accept `{ language, tone }` context

### Epic 6: Terminal UI Highlighting & Color System
Every menu in the application renders the focused item with a full-row inverted highlight navigable by arrow keys; post-answer feedback, score deltas, speed-tier badges, and difficulty badges are color-coded with semantic ANSI colors — making the app feel polished and the feedback loop immediately readable.
**FRs covered:** FR20, FR21, FR22, FR23
**NFRs covered:** NFR6 (ANSI baseline color compatibility)
**Additional requirements covered:** `utils/format.ts` semantic color helpers, `inquirer` select theme configuration across all screens
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

### Story 1.6: Terminal Screen Management

As a user,
I want every screen in the app to render at the top of a cleared terminal viewport,
So that the app always feels like a persistent full-screen application and previous output never clutters the current view.

**Acceptance Criteria:**

**Given** `utils/screen.ts` is implemented  
**When** I call `clearScreen()`  
**Then** the terminal viewport is fully cleared, leaving no prior output visible  

**Given** the home screen renders (on launch or navigation)  
**When** the screen is drawn  
**Then** `clearScreen()` is called before rendering — no prior output persists in the visible area  

**Given** the create domain screen renders  
**When** the input prompt is displayed  
**Then** `clearScreen()` is called before the prompt appears  

**Given** the domain sub-menu renders (on domain select, post-quiz return, or Back navigation)  
**When** the sub-menu is drawn  
**Then** `clearScreen()` is called before the sub-menu is displayed  

**Given** the archived domains list renders  
**When** the screen is drawn  
**Then** `clearScreen()` is called before rendering  

**Given** a quiz question or post-answer feedback panel renders  
**When** either screen is drawn  
**Then** `clearScreen()` is called before the new content is displayed — no prior question or feedback output persists  

**Given** the history screen renders (on load or page navigation)  
**When** any entry or page is displayed  
**Then** `clearScreen()` is called before rendering  

**Given** the stats dashboard renders  
**When** the screen is drawn  
**Then** `clearScreen()` is called before displaying content  

---

### Story 1.7: Buy Me a Coffee Screen

As a user,
I want a "Buy me a coffee" option in the home screen menu that displays a scannable QR code and a direct URL,
So that I can easily support the developer without leaving the terminal.

**Acceptance Criteria:**

**Given** I am on the home screen  
**When** I inspect the menu options  
**Then** a "☕  Buy me a coffee" action is present between the archived-domains action and the Exit action, separated from Exit by a visual separator  

**Given** I select "☕  Buy me a coffee" from the home screen  
**When** the coffee screen loads  
**Then** the terminal is cleared and the following are displayed in order:  
- A heading: "☕  Enjoying brain-break? Buy me a coffee!"
- An instruction: "Scan the QR code with your phone:"
- An ASCII QR code (small, indented) encoding `https://www.buymeacoffee.com/georgiosnikitas`
- The URL `https://www.buymeacoffee.com/georgiosnikitas` in plain text
- A `Navigation` prompt with a separator and a `←  Back` option

**Given** I am on the coffee screen  
**When** I select "←  Back"  
**Then** I return to the home screen  

**Given** I am on the coffee screen  
**When** I force-exit the prompt (Ctrl+C)  
**Then** the app handles the exit gracefully and returns to the home screen without crashing  

**Given** `src/screens/home.test.ts` covers the new screen  
**When** I run `npm test`  
**Then** all tests pass, covering: coffee action present in menu, routing from home to coffee screen, QR code and URL rendered, `clearScreen()` called, Back resolves cleanly, force-exit handled silently  

---

## Epic 2: Domain Management

Users can launch the app, see their domain list with scores, create a new domain, select a domain to open its sub-menu (Play, View History, View Stats, Archive, Back), archive domains they're not actively using, and unarchive them to resume exactly where they left off.

### Story 2.1: Home Screen — Display Domain List

As a user,
I want the app to display a home screen on launch listing all active domains with their scores and question counts,
So that I can see my current progress at a glance and choose what to do next.

**Acceptance Criteria:**

**Given** `screens/home.ts` and `router.ts` are implemented and `index.ts` bootstraps the app  
**When** I run `tsx src/index.ts`  
**Then** the home screen renders within ≤ 2 seconds showing a list of all active (non-archived) domains  
**And** each domain entry shows: domain name, current score, and total questions answered  
**And** the available actions include: select a domain (opens domain sub-menu), create a new domain, view archived domains, and exit  
**And** archive / view history / view stats actions are NOT shown on the home screen — they are accessed from the domain sub-menu  

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
So that I can immediately start getting quiz questions on any topic I choose.

**Acceptance Criteria:**

**Given** I am on the home screen  
**When** I select "Create new domain"  
**Then** an input prompt is shown: `New domain name (Ctrl+C to go back):`  

**Given** I am on the create domain screen  
**When** I press Ctrl+C  
**Then** I return to the home screen without creating a domain  

**Given** I am on the create domain screen  
**When** I type a domain name (e.g. "Spring Boot microservices") and press Enter  
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

### Story 2.5: Domain Sub-Menu

As a user,
I want selecting a domain to open a sub-menu showing the domain's current stats and actions I can take,
So that I can choose to play, review history, check stats, or archive — all from a focused, per-domain context.

**Acceptance Criteria:**

**Given** I am on the home screen and at least one active domain exists  
**When** I select a domain  
**Then** the domain sub-menu opens with the prompt header showing: domain name, current score, and total questions answered (read fresh from disk)  
**And** the available options are: Play, View History, View Stats, Archive, Delete, and Back  

**Given** I am on the domain sub-menu  
**When** I select "Play"  
**Then** if my last session for that domain was within 7 days, a motivational message is displayed (e.g. "Welcome back! Keep the streak going.")  
**And** if my score has been trending upward over the last 3+ sessions, a motivational message referencing the upward trend is displayed  
**And** the quiz starts immediately after any messages  

**Given** I am on the domain sub-menu  
**When** I select "Back"  
**Then** I return to the home screen  

**Given** I select a domain and the domain file is corrupted (Zod validation fails on read)  
**When** the sub-menu loads  
**Then** the app displays the corrupted-file warning message and resets the domain to `defaultDomainFile()` before showing the sub-menu  

**Given** I complete or exit a quiz session  
**When** the session ends  
**Then** I am returned to the domain sub-menu (not the home screen)  

---

### Story 2.4: Archive & Unarchive Domains

As a user,
I want to archive domains I'm not currently using and unarchive them later to resume exactly where I left off,
So that my active domain list stays focused without losing any history or progress.

**Acceptance Criteria:**

**Given** I am on the domain sub-menu  
**When** I choose "Archive"  
**Then** the domain file is updated with `meta.archived: true` and saved atomically  
**And** the domain disappears from the active domain list and I am returned to the home screen  

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

### Story 2.6: Delete Domain

As a user,
I want to permanently delete a domain from the domain sub-menu,
So that I can remove domains I no longer need and keep my list clean.

**Acceptance Criteria:**

**Given** I am on the domain sub-menu  
**When** I inspect the available options  
**Then** a "🗑  Delete" action is present immediately after the "Archive" option  

**Given** I am on the domain sub-menu  
**When** I select "Delete"  
**Then** a confirmation prompt is shown: `Delete "<slug>" permanently? This cannot be undone.` with default answer "No"  

**Given** the delete confirmation prompt is shown  
**When** I confirm (answer "Yes")  
**Then** the domain file at `~/.brain-break/<slug>.json` is permanently removed  
**And** I am returned to the home screen  
**And** the domain no longer appears in the active domain list  

**Given** the delete confirmation prompt is shown  
**When** I cancel (answer "No")  
**Then** no file is deleted and I remain on the domain sub-menu  

**Given** `domain/store.ts` exports `deleteDomain(slug)`  
**When** I call `deleteDomain(slug)` and the file exists  
**Then** it removes the file and returns `{ ok: true }`  

**Given** `domain/store.ts` exports `deleteDomain(slug)`  
**When** I call `deleteDomain(slug)` and the file does not exist (ENOENT)  
**Then** it returns `{ ok: true }` — idempotent, no error  

**Given** `domain/store.test.ts` and `screens/domain-menu.test.ts` cover the new story  
**When** I run `npm test`  
**Then** all tests pass, covering: file removal, ENOENT idempotency, domain removed from list, confirmed delete navigates home, cancelled delete stays in menu  

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
**Then** all persisted data is preserved and I am returned to the domain sub-menu  

---

## Epic 4: Learning Insights

Users can review their complete question history for any domain (paginated) and view a stats dashboard with score, accuracy, trend, and return streak — giving them a genuine signal of knowledge growth over time.

### Story 4.1: Paginated Question History View

As a user,
I want to view my full question history for the active domain — paginated at 10 entries per page — with all recorded fields visible,
So that I can review past questions, see where I went wrong, and track my learning in detail.

**Acceptance Criteria:**

**Given** I am on the domain sub-menu and choose "View History"  
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
**Then** a message is shown ("No questions answered yet") and a "Back" option returns me to the domain sub-menu  

**Given** I am on the history screen  
**When** I select "Back"  
**Then** I return to the domain sub-menu  

---

### Story 4.2: Stats Dashboard

As a user,
I want to view a stats dashboard for the active domain showing my score, accuracy, time played, difficulty level, score trend, and return streak,
So that I have a clear, motivating picture of my progress and know whether my skills are genuinely growing.

**Acceptance Criteria:**

**Given** I am on the domain sub-menu and choose "View Stats"  
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
**Then** I return to the domain sub-menu  

---

## Epic 5: Global Settings

Users can configure their preferred question language and AI tone of voice from a dedicated Settings screen accessible from the home menu — settings persist across sessions, apply to all domains, and take effect on the next AI-generated content.

### Story 5.1: Settings Schema & Store

As a developer,
I want a `SettingsFile` Zod schema and read/write store functions for `~/.brain-break/settings.json`,
So that all modules have a single, type-safe, tested source of truth for user settings.

**Acceptance Criteria:**

**Given** `domain/schema.ts` (or a new `settings/schema.ts`) is updated  
**When** I import `SettingsFileSchema`  
**Then** it is a Zod schema validating `{ language: string, tone: z.enum(["normal", "enthusiastic", "robot", "pirate"]) }`  
**And** `defaultSettings()` returns `{ language: "English", tone: "normal" }`  

**Given** `domain/store.ts` (or a new `settings/store.ts`) exports `readSettings()` and `writeSettings(settings)`  
**When** I call `readSettings()` and `~/.brain-break/settings.json` exists and is valid  
**Then** it returns `{ ok: true, data: SettingsFile }` with the parsed, Zod-validated settings  

**Given** I call `readSettings()` and the file does not exist (ENOENT)  
**When** the function runs  
**Then** it returns `{ ok: true, data: defaultSettings() }` — no error propagated  

**Given** I call `readSettings()` and the file is corrupted (Zod validation fails)  
**When** the function runs  
**Then** it returns `{ ok: true, data: defaultSettings() }` — silently falls back to defaults (settings corruption is non-critical)  

**Given** I call `writeSettings(settings)`  
**When** the function runs  
**Then** it writes atomically (write-then-rename pattern) to `~/.brain-break/settings.json`  
**And** returns `{ ok: true }` on success  

**Given** co-located tests exist for the schema and store  
**When** I run `npm test`  
**Then** all tests pass, covering: valid input, `defaultSettings()` output, ENOENT fallback, Zod rejection fallback, and write/read roundtrip  

---

### Story 5.2: Settings Screen

As a user,
I want a Settings option in the home screen menu that opens a screen where I can configure my question language and tone of voice,
So that I can personalise how questions and AI responses are delivered to me.

**Acceptance Criteria:**

**Given** I am on the home screen  
**When** I inspect the menu options  
**Then** a "⚙️  Settings" action is present between "View archived domains" and "☕  Buy me a coffee"  

**Given** I select "⚙️  Settings" from the home screen  
**When** the settings screen loads  
**Then** the terminal is cleared and current settings are read from disk via `readSettings()`  
**And** the screen displays the current values for Question Language and Tone of Voice  

**Given** the settings screen is open  
**When** I edit the Question Language field  
**Then** I can type any free-text value (e.g. `Greek`, `Japanese`, `Pirate English`)  

**Given** the settings screen is open  
**When** I navigate the Tone of Voice selector  
**Then** I can choose from: Normal, Enthusiastic, Robot, Pirate — navigated with arrow keys  

**Given** I have made changes on the settings screen  
**When** I select "Save"  
**Then** `writeSettings()` is called with the new values and persists to `~/.brain-break/settings.json`  
**And** I am returned to the home screen  

**Given** I have made changes on the settings screen  
**When** I select "Back" (or press Ctrl+C)  
**Then** no changes are written to disk and I am returned to the home screen  

**Given** `screens/settings.ts` has co-located tests  
**When** I run `npm test`  
**Then** all tests pass, covering: Settings action present in home menu, routing home → settings screen, current values loaded on open, Save persists + navigates home, Back discards + navigates home, Ctrl+C handled gracefully  

---

### Story 5.3: Language & Tone Injection into AI Prompts

As a user,
I want every AI-generated question and answer option to be rendered in my configured language and tone of voice,
So that the quiz experience matches my personal preference from start to finish.

**Acceptance Criteria:**

**Given** `ai/prompts.ts` is updated  
**When** I call `buildQuestionPrompt(domain, difficultyLevel, settings)`  
**Then** the prompt includes a voice instruction prepended to the generation request — e.g. `"Respond in Greek using a pirate tone of voice."`  
**And** when `settings.language` is `"English"` and `settings.tone` is `"normal"`, no voice instruction prefix is added (or a neutral one)  

**Given** `ai/client.ts` is updated  
**When** `generateQuestion(domain, difficultyLevel, existingHashes, settings)` is called  
**Then** it passes `settings` to `buildQuestionPrompt()` so language + tone are injected into every API call  

**Given** `screens/quiz.ts` is updated  
**When** a quiz session starts  
**Then** `readSettings()` is called once at session start and the result is passed to every `generateQuestion()` call in that session  

**Given** the active language is `"Spanish"` and tone is `"enthusiastic"`  
**When** a question is generated  
**Then** the question text, all four answer options (A–D), and the correct answer reveal are rendered in Spanish with enthusiastic phrasing  

**Given** `ai/client.test.ts` and `ai/prompts.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: settings injected into prompt, language + tone appear in system message, neutral case (English/normal) produces valid output  

---

### Story 5.4: AI-Generated Motivational Messages

As a user,
I want the motivational message shown before a quiz session to be generated by AI in my configured language and tone,
So that the encouragement feels contextual and consistent with the rest of the quiz experience.

**Acceptance Criteria:**

**Given** `screens/select-domain.ts` is updated  
**When** the motivational message condition is met (returning user within 7 days OR score trending upward)  
**Then** `generateMotivationalMessage(trigger, settings)` is called — a new function in `ai/client.ts` — before the quiz starts  
**And** the message is displayed using `success()` formatting  

**Given** `ai/prompts.ts` exports `buildMotivationalPrompt(trigger, settings)`  
**When** called with `trigger = "returning"` and `settings = { language: "Greek", tone: "pirate" }`  
**Then** the prompt instructs the model to generate a short (1–2 sentence) motivational message in Greek using pirate tone, acknowledging the user's return  

**Given** `trigger = "trending"` (score trending upward)  
**When** the prompt is built  
**Then** it instructs the model to congratulate the user on their upward score trend in the configured language and tone  

**Given** the Copilot API is unreachable when generating the motivational message  
**When** `generateMotivationalMessage()` fails  
**Then** the error is silently swallowed — no message is displayed and the quiz starts normally (motivational message is non-critical)  

**Given** `screens/select-domain.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: AI call made when trigger met, settings passed to prompt builder, graceful degradation on API failure, no message shown on fresh domain  

---

## Epic 6: Terminal UI Highlighting & Color System

Every menu in the application renders the focused item with a full-row inverted highlight navigable by arrow keys; post-answer feedback, score deltas, speed-tier badges, and difficulty badges are color-coded — making the app feel polished and the feedback loop immediately readable.

### Story 6.1: Semantic Color Helpers

As a developer,
I want `utils/format.ts` extended with semantic color helper functions for all UI feedback states,
So that every screen can apply consistent, tested color semantics without duplicating chalk logic.

**Acceptance Criteria:**

**Given** `utils/format.ts` is updated  
**When** I call `colorCorrect(text)`  
**Then** it returns the text styled in ANSI green  

**Given** `utils/format.ts` is updated  
**When** I call `colorIncorrect(text)`  
**Then** it returns the text styled in ANSI red  

**Given** `utils/format.ts` exports `colorSpeedTier(tier)`  
**When** called with `"fast"`, `"normal"`, or `"slow"`  
**Then** it returns the text in green, yellow, or red respectively  

**Given** `utils/format.ts` exports `colorDifficultyLevel(level)`  
**When** called with levels 1–5  
**Then** it returns the label styled in: cyan (1), green (2), yellow (3), magenta (4), red (5)  

**Given** `utils/format.ts` exports `colorScoreDelta(delta)`  
**When** called with a positive number  
**Then** it returns the formatted delta string in green  
**When** called with a negative number  
**Then** it returns the formatted delta string in red  

**Given** co-located tests exist in `utils/format.test.ts`  
**When** I run `npm test`  
**Then** all new color helper tests pass for all branches  

---

### Story 6.2: Menu Highlight Theme

As a user,
I want every menu in the app to highlight the focused option with a full-row inverted background as I navigate with arrow keys,
So that I always know exactly which option I am about to select.

**Acceptance Criteria:**

**Given** a shared `menuTheme` object (or helper) is defined — e.g. in `utils/format.ts` or a new `utils/theme.ts`  
**When** any `inquirer` `select` prompt is rendered  
**Then** the focused item renders with inverted foreground/background colors (white text on colored background)  
**And** unfocused items render in the terminal's default colors  

**Given** the home screen renders its menu  
**When** I navigate with ↑↓ arrow keys  
**Then** the focused item is visually highlighted as described above  

**Given** the domain sub-menu renders  
**When** I navigate with ↑↓ arrow keys  
**Then** the focused item is visually highlighted  

**Given** the settings screen renders its Tone of Voice selector  
**When** I navigate with ↑↓ arrow keys  
**Then** the focused item is visually highlighted  

**Given** the archived domains list renders  
**When** I navigate with ↑↓ arrow keys  
**Then** the focused item is visually highlighted  

**Given** post-quiz navigation (Next question / Exit quiz) renders  
**When** I navigate with ↑↓ arrow keys  
**Then** the focused item is visually highlighted  

**Given** the history navigation controls render (Previous / Next / Back)  
**When** I navigate with ↑↓ arrow keys  
**Then** the focused item is visually highlighted  

**Given** `menuTheme` is applied via the `theme` option on all `inquirer` `select` calls  
**When** I run `npm test`  
**Then** all existing menu-related tests continue to pass (theme is a visual-only change, not a behavioral one)  

---

### Story 6.3: Quiz Feedback Colors

As a user,
I want the post-answer feedback panel to use semantic colors — green for correct, red for incorrect, colored speed-tier and difficulty badges — so that I can read my result and score at a glance without parsing text.

**Acceptance Criteria:**

**Given** `screens/quiz.ts` is updated to use the semantic color helpers from Story 6.1  
**When** I answer a question correctly  
**Then** the correct confirmation line is rendered using `colorCorrect()`  
**And** the score delta is rendered using `colorScoreDelta()` (green for positive)  

**Given** I answer a question incorrectly  
**When** the feedback panel renders  
**Then** the incorrect line (my wrong answer) is rendered using `colorIncorrect()`  
**And** the correct answer reveal is rendered using `colorCorrect()`  
**And** the score delta is rendered using `colorScoreDelta()` (red for negative)  

**Given** the speed tier is determined after an answer  
**When** the feedback panel renders  
**Then** the speed tier badge is rendered using `colorSpeedTier(tier)` — green/yellow/red  

**Given** the current difficulty level is shown in the feedback panel  
**When** the panel renders  
**Then** the difficulty label is rendered using `colorDifficultyLevel(level)` — cyan/green/yellow/magenta/red  

**Given** `screens/quiz.ts` tests are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: correct answer path uses colorCorrect, incorrect path uses colorIncorrect + colorCorrect reveal, score delta uses colorScoreDelta, speed tier uses colorSpeedTier, difficulty uses colorDifficultyLevel  
