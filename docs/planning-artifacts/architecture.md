---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/planning-artifacts/prd.md
  - docs/planning-artifacts/product-brief.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-03-07'
lastEdited: '2026-04-07'
editHistory:
  - date: '2026-04-07'
    changes: 'OpenAI Compatible API added as 6th AI provider. All provider counts updated from 5 to 6 (Requirements Overview, Scale & Complexity, Technical Constraints, Cross-Cutting Concerns, Decision Priority, Coherence Validation). Settings schema expanded with openai-compatible enum value, openaiCompatibleEndpoint and openaiCompatibleModel fields. AI Provider Enum table, AiProviderType union, adapter table, AI_ERRORS (NETWORK_OPENAI_COMPATIBLE + AUTH_OPENAI_COMPATIBLE), and defaultSettings() updated. Authentication & Security, Settings screen, first-launch provider setup, and provider-setup validation flow updated. Module architecture and project directory tree comments updated (5→6 adapters, 4→5 via Vercel AI SDK). External boundaries, cross-cutting concern mapping, coherence validation, and SDK dependency list updated with @ai-sdk/openai-compatible. Future enhancement note updated. Aligns with PRD Feature 8, Epic 7, and FR6.'
  - date: '2026-04-05'
    changes: 'Answer verification redesign synced from planning: Technical Constraints, Response Validation, ai/client.ts role, error handling, module descriptions, preload flow, and Question Cycle data flow now describe fail-closed verification. Generation returns question text plus options only, verification returns explicit `correctAnswer` and `correctOptionText`, local letter-text alignment is mandatory, and each question has a bounded budget of 3 candidate attempts total (initial attempt + 2 retries) before rejection.'
  - date: '2026-04-03'
    changes: 'ASCII Art sync with implemented codebase (PRD Feature 18, Epic 12): Requirements Overview updated (13→15 features, ASCII Art added and stale feature count corrected). Estimated components updated (16–18→17–19). Technical constraints updated with `figlet` dependency. New ASCII Art Screen architecture section added. Module Architecture src/ tree updated (ascii-art.ts added, domain-menu comments expanded). Complete Project Directory Structure updated (ascii-art.ts + ascii-art.test.ts added, domain-menu comment expanded). Terminal UI navigation flow updated with the ASCII Art route. Feature to Structure Mapping updated (F15 row added). Requirements Coverage Validation updated (F15 row added). Coherence Validation updated with `figlet` mention. All changes additive — no architectural decisions changed.'
  - date: '2026-04-02'
    changes: 'Model selection UX updated: for hosted providers (OpenAI, Anthropic, Gemini), model input changed from free-text prompt to a select box with 3 predefined models per provider (Fast / Normal / Complex) plus a "🧙 Custom model" free-text option and a "↩️ Back" option. Default Anthropic model changed from `claude-sonnet-4.6-latest` to `claude-opus-4-6`. Settings JSON example, defaultSettings(), DEFAULT_ANTHROPIC_MODEL constant, settings screen and first-launch provider setup descriptions, and schema types section updated ('ModelChoice' type and per-provider model choice arrays documented). Changelog entry in Per-provider model selection updated.'
  - date: '2026-03-31'
    changes: 'Challenge Mode — Sprint (PRD Feature 17, Epic 11, FR44–FR46): Requirements Overview updated (12→13 features, Challenge Mode added). Estimated components updated (14–16→16–18). Cross-cutting concerns updated (sprint timer and batch preloading added). Navigation pattern updated (Challenge route in domain sub-menu, showChallenge + showSprintSetup router exports). New Challenge Mode (Sprint) Architecture section added — timer strategy (Date.now wall-clock delta + AbortController prompt interruption), preloadQuestions() in ai/client.ts, sprint-setup.ts and challenge.ts screen split, per-answer writeDomain, limited post-answer nav (Next/Back only), four termination conditions (all answered, timer-mid-question auto-submit, timer-mid-feedback, user Back). Module Architecture src/ tree updated (sprint-setup.ts + challenge.ts added, router count 14→16). Complete Project Directory Structure updated (sprint-setup.ts/challenge.ts + tests added, router count 14→16). Feature to Structure Mapping updated (F14 row added). Cross-Cutting Concern Mapping updated (sprint countdown timer + batch question preloading rows added). Data Flow Sprint Cycle diagram added. Requirements Coverage Validation updated (F14 row added). Coherence Validation updated with Challenge Mode mention. All changes additive — no architectural decisions changed.'
  - date: '2026-03-30'
    changes: 'Exit screen, welcome screen timer, welcome toggle rename: Requirements Overview updated (11→12 features, exit screen added, welcome screen description expanded with 3s auto-proceed timer). Estimated components updated (13–15→14–16). Settings screen description updated (welcome screen toggle → Welcome & Exit screen toggle ON/OFF). Settings JSON schema showWelcome comment updated (controls both welcome + exit). defaultSettings() description updated. Cross-cutting concern updated (showWelcome controls startup + exit, read before exit routing). New Welcome Screen section added (3s cancellableSleep auto-proceed behavior). New Exit Screen section added (showExitScreen, getExitMessage, dynamic messages by totalQuestions, 3s auto-exit timer, total questions aggregation from active + archived domains). Navigation flow updated (exit action branches on showWelcome ON/OFF, welcome annotated with auto-proceed). Screen count updated (11→13). Module Architecture src/ tree updated (exit.ts added, welcome.ts comment expanded, settings.ts comment renamed, router count 13→14). Complete Project Directory Structure updated (exit.ts + exit.test.ts added, settings.ts comment renamed, welcome.ts comment expanded, router count 13→14). Feature to Structure Mapping updated (F11 expanded with timer, F13 row added). Requirements Coverage Validation updated (F11 expanded, F13 row added). Data Flow Startup updated (welcome timer behavior). Data Flow Exit added (full exit routing flow). All changes additive — no architectural decisions changed.'
  - date: '2026-03-30'
    changes: 'Question Bookmarking (PRD Feature 16, Epic 10, FR41–FR43): Requirements Overview updated (10→11 features, bookmarking added to feature list). Estimated components updated (12–14→13–15). Domain File Schema updated (bookmarked: false field added to QuestionRecord). State management cross-cutting concern updated (bookmark toggle persistence). Navigation pattern updated (View Bookmarks route added to Level 2 domain sub-menu). Router function count updated (12→13). Module Architecture src/ tree updated (bookmarks.ts added, domain-menu.ts comment updated, format.ts consumer list updated). Complete Project Directory Structure updated (bookmarks.ts + bookmarks.test.ts added). Feature to Structure Mapping updated (F12 row added). Cross-Cutting Concern Mapping updated (question detail rendering consumers expanded). Requirements Coverage Validation updated (F12 row added, NFR 5 updated). All changes additive — no architectural decisions changed.'
  - date: '2026-03-26'
    changes: 'Unified question detail rendering (GitHub issue #52): utils/format.ts gains renderQuestionDetail() — a shared rendering function producing the options + feedback block consumed by both screens/quiz.ts and screens/history.ts. Updated: format.ts module description (both directory trees), dependency rules (utils/format.ts type-only imports from domain/schema.ts clarified), internal boundary rule (utils/ type-only import allowance), F3 and F6 feature-to-structure mapping (added utils/format.ts), cross-cutting concern table (new question detail rendering row).'
  - date: '2026-03-25'
    changes: 'Architecture review sync with source code: added undocumented welcome screen module (screens/welcome.ts) and settings.showWelcome field; corrected Gemini env var from GOOGLE_API_KEY to GOOGLE_GENERATIVE_AI_API_KEY (5 occurrences); fixed router function count from 11 to 12; documented generateExplanation() in ai/client.ts, AI_ERRORS.QUOTA, testProviderConnection() in providers.ts, isAuthErrorMessage() in client.ts; added DomainListEntry discriminated union to Data Architecture; added gradient rendering utilities to format.ts docs; fixed project tree (added welcome.ts/welcome.test.ts, removed non-existent provider-settings.test.ts); documented PROVIDER_CHOICES, PROVIDER_LABELS, DEFAULT_* constants, and patch-package devDependency; updated startup flow, navigation diagram, feature mapping, cross-cutting concern mapping, validation tables, gap analysis, and coherence validation.'
  - date: '2026-03-25'
    changes: 'Domain creation difficulty selection (GitHub issue #46): create-domain screen now includes a starting difficulty select step (1 — Beginner through 5 — Expert, default 2 — Elementary) between the name input and Save/Back navigation. `startingDifficulty` field added to DomainMeta schema (set once at creation, never mutated) and displayed in the stats dashboard alongside current difficulty. Updated: Requirements Overview (user-selected starting level), Domain File Schema (startingDifficulty field), create-domain.ts module comments (both directory trees), Gap Analysis (defaultDomainFile accepts optional startingDifficulty parameter).'
  - date: '2026-03-25'
    changes: 'Same-screen quiz feedback (GitHub issue #50): post-answer feedback now renders inline on the same screen as the quiz question — no clearScreen() or clearAndBanner() between question display and feedback panel. Updated: Requirements Overview (NFR 5 exception), Cross-Cutting Concerns (terminal rendering note), Terminal UI Architecture (screen clearing pattern exception for quiz feedback), NFR 5 coverage in validation tables, Cross-Cutting Concern Mapping (terminal screen clearing row).'
  - date: '2026-03-25'
    changes: 'Answer self-consistency verification: added verification bullet to Response Validation subsection documenting the two-call pattern (generate + verify), fail-open design, and VerificationResponseSchema. Updated Question Cycle Flow data-flow diagram to include verifyAnswer() step, verification prompt construction, mismatch-triggers-regeneration logic, and dedup-path verification.'
  - date: '2026-03-22'
    changes: 'Per-provider model selection: settings schema expanded with openaiModel, anthropicModel, geminiModel fields and defaults. Settings JSON example updated. defaultSettings() output updated. First-launch provider setup and settings screen descriptions updated to reflect hosted provider model select box with 3 predefined models + custom option. Default Anthropic model changed from `claude-sonnet-4.6-latest` to `claude-opus-4-6`. `ModelChoice` type and per-provider model choice arrays added to schema.ts. File tree updated with provider-settings.ts.'
  - date: '2026-03-21'
    changes: 'Adopted Vercel AI SDK (`ai` + `@ai-sdk/*` provider packages) for multi-provider abstraction. Replaced 4 individual provider SDKs (`openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, Ollama via fetch) with unified `generateText()` from Vercel AI SDK + thin `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `ollama-ai-provider` provider packages. GitHub Copilot SDK remains a custom adapter (not supported by Vercel AI SDK). Updated: Technical Constraints, AI Provider SDKs section, Multi-Provider Architecture (adapter table + usage example), Response Validation, dependency rules, module structure comments, enforcement guidelines, boundary tables, coherence validation.'
  - date: '2026-03-17'
    changes: 'Multi-provider AI integration: replaced Copilot-only AI backend with 5-provider abstraction (OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama). Added ai/providers.ts (AiProvider interface + 5 adapters), screens/provider-setup.ts (first-launch provider selection with non-blocking validation). Expanded settings schema with provider, ollamaEndpoint, ollamaModel fields. Rewrote Authentication & Security, API & Communication Patterns, and Error Handling sections for provider-agnostic architecture. Updated navigation flow with first-launch provider setup. Updated all dependency rules, boundaries, feature mapping, integration points, and validation tables. Flagged PRD Feature 8 tone list inconsistency (4 vs 7 tones — architecture keeps 7).'
  - date: '2026-03-17'
    changes: 'Architecture sync with PRD 2026-03-15 and implemented codebase: added Feature 8 (Global Settings — settings schema, store functions, settings screen, prompt injection, tone migration), Feature 9 (Terminal UI Highlighting & Color System — semantic color helpers, menuTheme), Feature 10 (Coffee Supporter Screen — qrcode-terminal), Feature 1 Delete action; expanded screens list (archived, create-domain, domain-menu, select-domain, settings); updated navigation model to two-level menu; added qrcode-terminal and @inquirer/prompts dependencies; updated Requirements Overview, feature-to-structure mapping, cross-cutting concerns, NFR coverage, and validation sections'
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
15 features covering: domain lifecycle management (create, select, archive, unarchive, delete), multi-provider AI-powered question generation (OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama, OpenAI Compatible API) with adaptive difficulty (5 levels, user-selected starting level at domain creation, streak-driven adjustment) and language/tone injection, interactive terminal quiz with silent response timer, challenge mode (timed sprint — user-configured question count and time budget with all questions preloaded upfront, visible countdown timer, limited post-answer navigation), a scoring system using a base-points × speed-multiplier formula, full persistent question history per domain, single-question history navigation, question bookmarking with per-domain favorites view, a stats dashboard with trend analysis, global settings (AI provider, language & tone of voice, welcome & exit screen toggle) with first-launch provider setup, terminal UI highlighting with semantic color system, a coffee supporter screen, a welcome screen with animated ASCII-art, typewriter tagline, and 3-second auto-proceed timer, an exit screen with dynamic session-summary message, typewriter animation, and 3-second auto-exit timer, and a domain-level ASCII Art screen that renders the selected domain locally via `figlet` using one of 14 curated fonts with cyan-to-magenta gradient coloring and immediate regenerate/back controls.

**Non-Functional Requirements:**
- Performance: Question generation ≤ 5s (API + persist); startup ≤ 2s
- Reliability: Graceful degradation on provider unavailability or auth failure with per-provider error messages; corrupted domain file recovery without crash
- Data integrity: SHA-256 deduplication persisted across sessions; missing file treated as clean new domain
- Terminal screen management: every state-changing navigation action clears the viewport before rendering new content — no residual output from the previous screen persists. **Exception:** post-answer quiz feedback renders inline on the same screen as the question — no terminal clear between question display and feedback panel; a terminal reset occurs only on Next question or Exit quiz
- Terminal color rendering: ANSI 8/16-color baseline for cross-terminal compatibility

**Scale & Complexity:**

- Primary domain: CLI / terminal application (Unix-like: macOS, Linux, WSL)
- Complexity level: Low-Medium
- External dependencies: 6 AI provider adapters via Vercel AI SDK (`ai` + `@ai-sdk/*` provider packages) for OpenAI, Anthropic, Gemini, Ollama, and OpenAI Compatible API; GitHub Copilot SDK as a custom adapter — one provider active at runtime, user-selected; `figlet` for local ASCII Art banner rendering
- Estimated architectural components: 17–19 focused modules

### Technical Constraints & Dependencies

- Runtime: Node.js v22.0.0
- Interface: Terminal only — no web UI, no GUI
- AI: 6 interchangeable providers — OpenAI (`@ai-sdk/openai`), Anthropic (`@ai-sdk/anthropic`), Google Gemini (`@ai-sdk/google`), OpenAI Compatible API (`@ai-sdk/openai-compatible`) via the Vercel AI SDK (`ai`), Ollama via raw HTTP fetch, plus GitHub Copilot SDK (`@github/copilot-sdk`) as a custom adapter wrapping the `AiProvider` interface. All providers receive identical generation and verification prompt structures and must support the same JSON contracts: generation returns question text, options A–D, difficulty, and speed tier thresholds; verification returns `correctAnswer` and `correctOptionText`. API keys read from environment variables at runtime — never stored in settings
- Storage: `~/.brain-break/<domain-slug>.json` — one file per domain; `~/.brain-break/settings.json` — global settings (includes provider selection)
- Distribution: npm / npx — must reach home screen in ≤ 2s cold start
- Platform: Unix-like only (macOS, Linux, WSL)

### Cross-Cutting Concerns Identified

- **AI integration & error resilience:** Every question cycle routes through the active AI provider — one of 6 supported backends (OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama, OpenAI Compatible API); network/auth failure paths produce per-provider error messages and must be handled uniformly across the quiz engine and the challenge mode batch-preload path
- **File I/O with integrity guarantees:** Read/write/permission enforcement is needed everywhere domain state is touched — must be centralized, not scattered
- **State management:** Streak counter, difficulty level, score, and question hashes all evolve per answer; bookmark status can be toggled from post-answer, history, and bookmark screens — all must be atomically persisted
- **Terminal rendering:** All user-facing output (home screen, quiz, history, stats, spinner) requires a consistent rendering approach — `utils/screen.ts` owns the viewport-clear primitive; all screens call `clearScreen()` as their first operation before any output. **Exception:** the post-answer quiz feedback panel renders inline on the same screen as the question — `clearScreen()` is **not** called between the question display and the feedback panel. A terminal reset occurs only when the user selects Next question (loading a new question) or exits the quiz
- **Deduplication:** SHA-256 lookup on every question generation — must be fast and correctly scoped per domain
- **Global settings & AI voice injection:** Language, tone of voice, and AI provider selection stored in a global settings file; language + tone injected into every AI prompt — affects questions, answer options, and motivational messages; provider setting determines which AI backend is used; `showWelcome` setting controls both the startup welcome screen and the exit screen; must be read before any AI call and before exit routing
- **Semantic color system:** Post-answer feedback, speed tier badges, difficulty level badges, and menu highlighting all use a consistent color vocabulary defined in a single utility module
- **Sprint countdown timer:** Challenge mode renders a visible `M:SS` countdown on every question and post-answer screen; the timer never pauses and must be able to interrupt the active `inquirer` prompt when it expires (auto-submit). Uses wall-clock `Date.now()` deltas — not `setInterval` ticks — to avoid drift
- **Batch question preloading:** Challenge mode preloads all N questions before the sprint starts. The preload loop accumulates hashes to prevent intra-batch duplicates in addition to domain-history hashes. AI provider failure during preload aborts the entire sprint

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
- Target: Node.js v22.0.0 (LTS release — stable, long-term support until April 2027)
- `tsx` for development execution; `tsc` for production build to `dist/`

**Interactive Terminal:**
- `@inquirer/prompts` v8 — interactive prompts (menus, free-text input, confirmations), ESM-native
- `ora` v9 — loading spinner during question generation
- `chalk` v5 — terminal color and styling, ESM-native
- `qrcode-terminal` — ASCII QR code rendering for Coffee Supporter Screen (Feature 10)
- `figlet` — local ASCII art banner rendering for the ASCII Art Screen (Feature 15)

**Dependency Patching:**
- `patch-package` (devDependency) — applies patches via `prepare` script (runs only in dev, not for consumers)
- `patches/vscode-jsonrpc+8.2.1.patch` — patches `vscode-jsonrpc` (transitive dependency of `@github/copilot-sdk`)

**AI Provider SDKs (via Vercel AI SDK):**
- `ai` — Vercel AI SDK core (`generateText()` unified interface)
- `@ai-sdk/openai` — OpenAI provider adapter
- `@ai-sdk/anthropic` — Anthropic provider adapter
- `@ai-sdk/google` — Google Gemini provider adapter
- `@ai-sdk/openai-compatible` — OpenAI Compatible API provider adapter (any OpenAI-compatible endpoint)
- `@github/copilot-sdk` — GitHub Copilot integration (custom adapter — not supported by Vercel AI SDK)

**CLI Entry & Distribution:**
- `bin` field in `package.json` pointing to compiled `dist/index.js`
- `engines.node` field set to `">=22.0.0"` (LTS baseline — supports Node 22+)
- `npx`-compatible out of the box

**Testing Framework:**
- `vitest` — TypeScript-native, ESM-compatible, minimal config
- Unit tests per module — co-located in `src/` as `*.test.ts`
- Regression tests — cross-boundary integration tests using real file I/O (`_setDataDir` injected temp dir); cover the store → router chain and stats screen output snapshots

**CI/CD:**
- CI pipeline (`.github/workflows/ci.yml`) — runs on every branch push and pull request: typecheck → test
- Release pipeline (`.github/workflows/release.yml`) — triggered on `v*.*.*` tags: typecheck → test → build → GitHub Release (auto-generated notes) → publish to GitHub Packages → update Homebrew tap → publish to npmjs.org (OIDC trusted publishing)

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
- AI response validation (Zod) — the same generation and verification schemas enforced for all 6 providers (Vercel AI SDK `generateText()` for 5 providers + Copilot SDK custom adapter)
- Module/directory structure

**Important Decisions (Shape Architecture):**
- Terminal UI navigation pattern (sequential prompts + thin router)
- API error handling strategy (bounded verification retries, fail-to-domain-menu)

**Deferred Decisions (Post-MVP):**
- Fuzzy/similarity-based deduplication (explicitly noted in PRD as future enhancement)
- Startup optimization (read only `meta` fields on home screen load)

---

### Data Architecture

**Domain File Schema — Split meta + history**

Each domain file at `~/.brain-break/<domain-slug>.json` uses a two-section structure:

```jsonc
{
  "meta": {
    "score": 0,
    "difficultyLevel": 2,
    "startingDifficulty": 2,
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
      "difficultyLevel": number,
      "bookmarked": false
    }
  ]
}
```

*Rationale:* Separating `meta` from `history` supports a future optimization where only `meta` is read on startup (home screen summary), without loading the full history array. Zero cost now, pays forward.

**Atomic Write Strategy — write-then-rename**

All domain file writes use a tmp-file-then-rename pattern:
1. Write to `~/.brain-break/.tmp-<slug>.json`
2. Call `fs.rename()` to atomically replace the target

*Rationale:* `fs.rename()` is atomic on Unix (macOS, Linux). Eliminates the corruption window that direct `fs.writeFile()` leaves open. Directly addresses NFR 3.

**Deduplication — Array on disk, Set in memory**

- `hashes` stored as a plain string array in JSON (serializable, no special format)
- Loaded into a `Set<string>` at runtime for O(1) lookup per question generation cycle
- No external dependency required

**Domain List Representation — `DomainListEntry` discriminated union**

`domain/store.ts` exports a `DomainListEntry` type used by `listDomains()`:

```typescript
export type DomainListEntry =
  | { slug: string; meta: DomainMeta; corrupted: false }
  | { slug: string; corrupted: true }
```

`listDomains()` returns `Result<DomainListEntry[]>`. Entries with `corrupted: true` represent domain files that exist on disk but fail Zod validation — screens can render these distinctly (e.g., marked as corrupted in the home screen list).

---

### Global Settings Architecture

**Settings File Schema**

A single global settings file at `~/.brain-break/settings.json` stores user preferences that affect AI provider selection and all AI-generated content:

```jsonc
{
  "provider": "openai",        // Enum: openai | anthropic | gemini | copilot | ollama | openai-compatible — null on first launch
  "language": "English",        // Free-text — any language name
  "tone": "natural",            // Enum: natural | expressive | calm | humorous | sarcastic | robot | pirate
  "openaiModel": "gpt-5.4",           // OpenAI — preferred model name
  "anthropicModel": "claude-opus-4-6", // Anthropic — preferred model name
  "geminiModel": "gemini-2.5-pro",       // Gemini — preferred model name
  "ollamaEndpoint": "http://localhost:11434",  // Ollama only — endpoint URL
  "ollamaModel": "llama4",      // Ollama only — model name
  "openaiCompatibleEndpoint": "",              // OpenAI Compatible API only — endpoint URL (no default)
  "openaiCompatibleModel": "",                 // OpenAI Compatible API only — model name (no default)
  "showWelcome": true            // Boolean — show animated welcome screen on startup and exit screen on quit
}
```

**AI Provider Enum:**

| Value | Label | Auth Mechanism |
|---|---|---|
| `openai` | OpenAI | `OPENAI_API_KEY` env var |
| `anthropic` | Anthropic | `ANTHROPIC_API_KEY` env var |
| `gemini` | Google Gemini | `GOOGLE_GENERATIVE_AI_API_KEY` env var |
| `copilot` | GitHub Copilot | Copilot SDK auth (existing Copilot credentials) |
| `ollama` | Ollama | Local endpoint (no API key) |
| `openai-compatible` | OpenAI Compatible API | `OPENAI_COMPATIBLE_API_KEY` env var + user-provided endpoint URL and model name |

**Tone of Voice Enum:**

| Value | Label | Description |
|---|---|---|
| `natural` | Natural | Neutral, factual, professional quiz tone |
| `expressive` | Expressive | Energetic, encouraging, high-energy delivery |
| `calm` | Calm | Measured, gentle, relaxed phrasing |
| `humorous` | Humorous | Witty, playful, light-hearted delivery |
| `sarcastic` | Sarcastic | Dry wit, ironic observations |
| `robot` | Robot | Terse, mechanical, emotionless phrasing |
| `pirate` | Pirate | Pirate vernacular, nautical metaphors |

**Schema types:** `SettingsFileSchema` (Zod) and `SettingsFile` / `ToneOfVoice` / `AiProviderType` types live in `domain/schema.ts` alongside domain types. `domain/schema.ts` also exports `PROVIDER_CHOICES` (array of `{ name, value }` for inquirer select prompts), `PROVIDER_LABELS` (record mapping `AiProviderType` to display names), `ModelChoice` type (`{ name: string; value: string; description: string }`), per-provider model choice arrays (`OPENAI_MODEL_CHOICES`, `ANTHROPIC_MODEL_CHOICES`, `GEMINI_MODEL_CHOICES` — each containing 3 models labelled Fast / Normal / Complex), and named default constants: `DEFAULT_OPENAI_MODEL` (`'gpt-5.4'`), `DEFAULT_ANTHROPIC_MODEL` (`'claude-opus-4-6'`), `DEFAULT_GEMINI_MODEL` (`'gemini-2.5-pro'`), `DEFAULT_OLLAMA_ENDPOINT` (`'http://localhost:11434'`), `DEFAULT_OLLAMA_MODEL` (`'llama4'`). Factory function `defaultSettings()` returns `{ provider: null, language: 'English', tone: 'natural', openaiModel: 'gpt-5.4', anthropicModel: 'claude-opus-4-6', geminiModel: 'gemini-2.5-pro', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama4', openaiCompatibleEndpoint: '', openaiCompatibleModel: '', showWelcome: true }`. The `showWelcome` field controls both the animated welcome screen on startup and the exit screen on quit.

**Store functions:** `readSettings()` and `writeSettings()` in `domain/store.ts` follow the same atomic write-then-rename pattern. `readSettings()` returns `defaultSettings()` on ENOENT — no error propagated.

**Tone migration:** `store.ts` includes a migration layer that maps legacy tone values (`normal` → `natural`, `enthusiastic` → `expressive`) transparently on read. This ensures forward compatibility when the enum evolves.

**AI prompt injection:** `ai/prompts.ts` conditionally prepends a voice instruction to every prompt when language ≠ `"English"` or tone ≠ `"natural"` — e.g., `"Respond in Greek using a pirate tone of voice."`. The settings object is passed through from the screen layer to `ai/client.ts` to `ai/prompts.ts`.

**Settings screen:** `screens/settings.ts` provides a menu-driven loop where the user can change AI provider (select from 6 presets — triggers provider validation and, for OpenAI/Anthropic/Gemini, presents a select box with 3 predefined models per provider (labelled Fast / Normal / Complex) plus a "🧙 Custom model" option for free-text entry and a "↩️ Back" option), language (free-text input), tone (select from 7 presets), and Welcome & Exit screen toggle (ON/OFF — controls both the startup welcome screen and the exit screen). For Ollama, the user can also edit the endpoint URL and model name. For OpenAI Compatible API, the user can edit the endpoint URL and model name. GitHub Copilot does not prompt for a model. Save persists + returns to home; Back discards + returns to home.

**First-launch provider setup:** `screens/provider-setup.ts` displays a one-time provider selection screen on first launch (when `provider` is `null`). The user selects a provider via arrow keys; the app validates readiness:
- **Copilot:** checks Copilot authentication
- **OpenAI / Anthropic / Gemini:** checks for the corresponding env var (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`); if present, presents a select box with 3 predefined models (labelled Fast / Normal / Complex) plus a "🧙 Custom model" option for free-text entry (pre-selects the current or default model: `gpt-5.4` for OpenAI, `claude-opus-4-6` for Anthropic, `gemini-2.5-pro` for Gemini)
- **Ollama:** prompts for endpoint URL + model name, tests connection
- **OpenAI Compatible API:** checks for the `OPENAI_COMPATIBLE_API_KEY` env var; if present, prompts for endpoint URL (free-text) + model name (free-text), tests connection via OpenAI-compatible chat completions format

If validation fails, the app displays what’s needed and proceeds to the home screen anyway — all features except Play are accessible. If validation succeeds, the provider is saved to `settings.json` and the app proceeds with full functionality. On subsequent launches, the saved provider is used automatically.

---

### Authentication & Security

- **Provider auth — delegated, never stored:**
  - GitHub Copilot: auth fully delegated to the Copilot SDK — no token management in the app
  - OpenAI / Anthropic / Gemini: API keys read from environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`) at runtime — never stored in `settings.json`, never prompted in-app
  - Ollama: local instance, no API key — endpoint URL and model name stored in settings
  - OpenAI Compatible API: API key read from `OPENAI_COMPATIBLE_API_KEY` environment variable at runtime — never stored in `settings.json`; endpoint URL and model name stored in settings
- **Input validation:** All AI provider responses validated with Zod before use — treats AI output as an untrusted external boundary regardless of provider
- **No user-facing auth:** Zero credentials handled directly by the app — env vars and SDK auth are the only mechanisms

---

### API & Communication Patterns

**Multi-Provider Architecture**

`ai/providers.ts` exports a `AiProvider` interface and a factory function:

```typescript
export interface AiProvider {
  generateCompletion(prompt: string): Promise<string>
}

export type AiProviderType = 'copilot' | 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openai-compatible'

export function createProvider(settings: SettingsFile): Result<AiProvider>
export async function validateProvider(providerType: AiProviderType, settings: SettingsFile): Promise<Result<void>>
export async function testProviderConnection(providerType: AiProviderType, settings: SettingsFile): Promise<Result<string>>
```

- `createProvider()` reads the `provider` field from settings, instantiates the corresponding adapter, and returns it wrapped in `Result<T>`. Returns an error if `provider` is `null`.
- For OpenAI, Anthropic, Gemini, Ollama, and OpenAI Compatible API, the adapter uses the Vercel AI SDK `generateText()` function with the corresponding `@ai-sdk/*` provider package. This eliminates per-provider boilerplate — each adapter is a thin model selector (~5 lines).
- The Copilot adapter remains a custom implementation using `@github/copilot-sdk` directly, as the Vercel AI SDK does not support the Copilot SDK.
- All adapters share the same `AiProvider` interface — no provider-specific logic leaks into `client.ts` or screens.
- `validateProvider()` checks provider readiness without generating a question: Copilot auth check, env var existence, Ollama endpoint reachability, or OpenAI Compatible API endpoint reachability.
- `testProviderConnection()` validates provider readiness AND makes a real one-shot greeting API call. Classifies quota errors (`AI_ERRORS.QUOTA`), auth errors, and network errors independently.

**Adapter Implementations (all in `ai/providers.ts`):**

| Provider | SDK/Method | Auth Check |
|---|---|---|
| Copilot | `@github/copilot-sdk` — `CopilotClient` + `createSession` + `sendAndWait` (custom adapter) | Copilot SDK auth |
| OpenAI | `ai` + `@ai-sdk/openai` — `generateText({ model: openai(modelId), prompt })` | `OPENAI_API_KEY` env var |
| Anthropic | `ai` + `@ai-sdk/anthropic` — `generateText({ model: anthropic(modelId), prompt })` | `ANTHROPIC_API_KEY` env var |
| Gemini | `ai` + `@ai-sdk/google` — `generateText({ model: google(modelId), prompt })` | `GOOGLE_GENERATIVE_AI_API_KEY` env var |
| Ollama | Raw HTTP `fetch()` — `POST {endpoint}/api/generate` with `{ model, prompt, stream: false }` | Endpoint reachability |
| OpenAI Compatible API | `ai` + `@ai-sdk/openai-compatible` — `generateText({ model: openaiCompatible(modelId), prompt })` | `OPENAI_COMPATIBLE_API_KEY` env var + endpoint reachability |

**Vercel AI SDK usage example (OpenAI adapter):**

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const adapter: AiProvider = {
  async generateCompletion(prompt: string): Promise<string> {
    const { text } = await generateText({
      model: openai('gpt-5.4'),
      prompt,
    })
    return text
  },
}
```

The Anthropic, Gemini, Ollama, and OpenAI Compatible API adapters follow the same pattern — only the model constructor and model ID differ.

**Response Validation**

- All providers return raw text (Vercel AI SDK's `generateText()` returns `{ text }` directly; Copilot custom adapter returns raw content); `ai/client.ts` strips JSON fences and validates with the same Zod `QuestionResponseSchema`
- Generation schema covers: `question` (string), `options` (A–D strings), `difficultyLevel` (1–5 int), `speedThresholds` (`{ fastMs: number, slowMs: number }`) — generation does **not** return the trusted answer key
- Verification schema covers: `correctAnswer` (`A`–`D`) and `correctOptionText` (string copied verbatim from the chosen option)
- Provider-agnostic: if any provider returns malformed JSON, the same `AI_ERRORS.PARSE` path is taken
- **Answer verification gate:** After Zod validation and option shuffling, a separate verification prompt presents the finalized question and options to the AI **without revealing any pre-selected answer** and asks it to return both `correctAnswer` and `correctOptionText`. The candidate is accepted only when `correctAnswer` points to the same option whose text exactly matches `correctOptionText`. Any verification mismatch, network error, JSON parse error, or schema mismatch discards the candidate and triggers a fresh generation cycle. This applies to both the primary generation path and the deduplication regeneration path. The mechanism is **fail-closed** with a bounded budget of **3 candidate attempts total** (initial attempt + 2 retries); exhausting the budget returns an error and no question is shown to the user. The verification prompt includes the active language/tone voice instruction when settings are provided.

**`ai/client.ts` Role (Refactored)**

`client.ts` no longer imports any provider SDK directly. It:
1. Calls `createProvider(settings)` to get the active adapter
2. Calls `provider.generateCompletion(prompt)` to get the raw generation response
3. Validates the candidate with Zod and shuffles answer options via Fisher-Yates (using `crypto.randomInt` for unbiased distribution)
4. Calls the verification prompt on the finalized question and validates `correctAnswer` plus `correctOptionText` against the shuffled options
5. Retries with a fresh candidate when verification cannot be proven locally, up to 3 candidate attempts total
6. Returns `Result<Question>` only for verified questions and returns an error when the candidate budget is exhausted
7. Classifies errors (auth/network/parse/quota) and returns per-provider error messages

**Public exports:**
- `generateQuestion(domain, difficulty, hashes, prev, settings?)` — full generation + fail-closed verification + dedup cycle
- `generateMotivationalMessage(trigger, settings?)` — motivational one-liner for domain selection screen
- `generateExplanation(question, userAnswer, settings?)` — explains why the correct answer is right and the user's answer (if wrong) is wrong; returns `Result<string>` (raw text)
- `isAuthErrorMessage(error)` — returns `true` if the error string matches any `AI_ERRORS.AUTH_*` constant; allows callers to distinguish auth failures from network/parse errors without importing `AI_ERRORS` directly
- `AI_ERRORS` — re-exported from `providers.ts` for downstream consumers

**Error Handling Strategy — bounded verification retries, fail-to-domain-menu**

| Error Type | Behavior |
|---|---|
| No provider configured | Display: *“AI provider not ready. Go to Settings to configure.”* — return to domain sub-menu |
| Network/API unavailable | Display provider-specific network message — return to domain sub-menu |
| Authentication / API key failure | Display provider-specific auth message — return to domain sub-menu |
| Malformed generation response (Zod fail) | Discard candidate, retry fresh generation up to 2 additional times; on exhaustion display generation error and return to domain sub-menu |
| Verification mismatch / parse / schema / provider error | Discard candidate, retry fresh generation + verification up to 2 additional times; on exhaustion display generation error and return to domain sub-menu |

The retry loop is bounded at **3 candidate attempts total** per question (initial attempt + 2 retries). The app remains running and the user can navigate to Settings to reconfigure after any terminal failure.

**Per-Provider Error Messages:**

```typescript
export const AI_ERRORS = {
  NO_PROVIDER: 'AI provider not ready. Go to Settings to configure.',
  PARSE: 'Received an unexpected response from the AI provider. Please try again.',
  // Network errors
  NETWORK_COPILOT: 'Could not reach the Copilot API. Check your connection and try again.',
  NETWORK_OPENAI: 'Could not reach OpenAI API. Check your connection and try again.',
  NETWORK_ANTHROPIC: 'Could not reach Anthropic API. Check your connection and try again.',
  NETWORK_GEMINI: 'Could not reach Gemini API. Check your connection and try again.',
  NETWORK_OLLAMA: (endpoint: string) => `Could not reach Ollama at ${endpoint}. Ensure Ollama is running and try again.`,
  NETWORK_OPENAI_COMPATIBLE: (endpoint: string) => `Could not reach the OpenAI Compatible API endpoint at ${endpoint}. Verify the endpoint URL in Settings and try again.`,
  // Auth errors
  AUTH_COPILOT: 'Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in.',
  AUTH_OPENAI: 'OpenAI API key is invalid or missing. Set the OPENAI_API_KEY environment variable with a valid key and restart the app.',
  AUTH_ANTHROPIC: 'Anthropic API key is invalid or missing. Set the ANTHROPIC_API_KEY environment variable with a valid key and restart the app.',
  AUTH_GEMINI: 'Google API key is invalid or missing. Set the GOOGLE_GENERATIVE_AI_API_KEY environment variable with a valid key and restart the app.',
  AUTH_OLLAMA: 'Could not connect to Ollama. Check that the endpoint and model are correct in Settings.',
  AUTH_OPENAI_COMPATIBLE: 'OpenAI Compatible API key is invalid or missing. Set the OPENAI_COMPATIBLE_API_KEY environment variable with a valid key and restart the app.',
  // Quota errors
  QUOTA: 'API quota exceeded. Check your plan and billing details with your provider.',
} as const
```

---

### Terminal UI Architecture

**Navigation Pattern — Two-level menu with thin router**

No state machine framework. Navigation is explicit function calls dispatched from a `router.ts` module. The app uses a two-level menu model:

- **Level 1 — Home screen:** Lists active domains (with score/count) + actions: create domain, view archived, settings, buy me a coffee, exit
- **Level 2 — Domain sub-menu:** Selected from home; shows Play, Challenge, History, Bookmarks, Statistics, ASCII Art, Archive, Delete, Back

```
startup → readSettings()
  → provider === null         → router.showProviderSetup() → (fall through)
  → settings.showWelcome      → router.showWelcome() → (auto-proceed after 3s or Enter)
  → router.showHome()

router.showHome()
  → user creates domain     → router.showCreateDomain() → router.showHome()
  → user selects domain      → router.showDomainMenu(slug)
    → Play                   → router.showQuiz(slug) → router.showDomainMenu(slug)
    → Challenge              → router.showChallenge(slug) → router.showDomainMenu(slug)
      → showSprintSetup(slug)  → user confirms → showChallengeExecution(slug, config, questions)
      → showSprintSetup(slug)  → user backs    → router.showDomainMenu(slug)
    → History                 → router.showHistory(slug) → router.showDomainMenu(slug)
    → Bookmarks               → router.showBookmarks(slug) → router.showDomainMenu(slug)
    → Statistics              → router.showStats(slug) → router.showDomainMenu(slug)
    → ASCII Art               → router.showAsciiArt(slug) → router.showDomainMenu(slug)
    → Archive                 → router.archiveDomain(slug) → router.showHome()
    → Delete                  → router.deleteDomain(slug) → router.showHome()
    → Back                    → router.showHome()
  → user views archived      → router.showArchived() → router.showHome()
  → user opens settings      → router.showSettings() → router.showHome()
  → user exits
    → showWelcome ON          → router.showExit(totalQuestions) → (auto-exit after 3s or Enter) → process.exit(0)
    → showWelcome OFF         → process.exit(0)
```

Each screen is a standalone `async` function that resolves when the user exits it. `router.ts` is the only place that calls other screens — screens never call each other directly.

*Rationale:* 15 screens with clear parent-child flows, no concurrent state. A full state machine would be abstraction for its own sake.

**Screen Clearing Pattern — `clearScreen()` before every render**

Every screen entry point and every re-render cycle (e.g., history page navigation) calls `clearScreen()` as its **first** operation before any output:

```typescript
// ✅ Correct pattern — every screen, every render cycle
import { clearScreen } from '../utils/screen.js';

export async function showHome(): Promise<void> {
  clearScreen();
  // ... render domain list
}
```

**Exception — quiz post-answer feedback:** After the user answers a question, the feedback panel (correct/incorrect, correct answer reveal, time taken, speed tier, score delta) is rendered **inline on the same screen** as the question. `clearScreen()` is **not** called between the question display and the feedback panel — the user sees the original question, their chosen answer, and all feedback together. A terminal reset occurs only when the user selects Next question (triggering `clearScreen()` + rendering the next question) or exits the quiz. This same inline feedback exception applies to Challenge Mode (Feature 14) — post-answer feedback renders on the same screen as the question, with a terminal reset only on Next or Back.

```typescript
// ✅ Quiz feedback pattern — NO clearScreen between question and feedback
// question is already displayed on screen
const answer = await promptAnswer(options);  // user answers
// feedback renders inline below the question — no clearScreen()
console.log(formatFeedback(isCorrect, scoreDelta, speedTier));
const action = await promptNextAction();  // Next / Explain / Exit
if (action === 'next') {
  clearScreen();  // ← clear only when loading the next question
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

**Enforcement rule:** No screen may output content to the terminal without first calling `clearScreen()` — with one exception: the quiz post-answer feedback panel renders inline after the question without a terminal clear, so the user can see the original question alongside the feedback. This is verifiable: every `screens/*.ts` file must have `clearScreen()` as its first side-effectful call in every code path that renders a new screen state, except for post-answer feedback rendering in `screens/quiz.ts`.

*Rationale:* Centralizing the clear primitive in `utils/screen.ts` makes the contract testable (spy on `process.stdout.write` in unit tests), swappable (one place to change if a different clear strategy is needed), and makes the enforcement rule auditable by grep.

---

### Terminal UI Highlighting & Color System

All semantic coloring logic is centralized in `utils/format.ts`. No screen module defines its own color values.

**Menu highlighting — `menuTheme`**

`utils/format.ts` exports a `menuTheme` object consumed by `inquirer` as a custom theme. The focused menu item renders with inverted foreground/background colors (white text on colored background); unfocused items render in default terminal colors. Applies to all interactive menus: home screen, domain sub-menu, settings screen, archived domains list, history navigation, and post-quiz navigation.

**Semantic color helpers:**

| Helper | Purpose | Colors |
|---|---|---|
| `colorCorrect(text)` | Correct answer / positive feedback | Green |
| `colorIncorrect(text)` | Wrong answer / negative feedback | Red |
| `colorScoreDelta(delta)` | Score change display | Green (positive) / Red (negative) |
| `colorSpeedTier(tier)` | Speed tier badge | Fast = green, Normal = yellow, Slow = red |
| `colorDifficultyLevel(level)` | Difficulty badge | L1 = cyan, L2 = green, L3 = yellow, L4 = magenta, L5 = red |

**Additional format utilities:** `success()`, `error()`, `warn()`, `dim()`, `bold()`, `header()` chalk wrappers; `formatDuration(ms)`, `formatAccuracy(correct, total)`, `typewriterPrint(text)` typewriter animation, `cancellableSleep(ms)` interruptible timer (returns `{ promise, cancel }`); `ASCII_ART` constant (shared logo lines used by welcome + exit screens); gradient rendering: `CYAN` / `MAGENTA` color constants, `lerpColor(t)` linear interpolation, `getGradientWidth()` terminal-width clamp, `gradientBg(text, width)` full-width gradient background bar, `gradientShadow(width)` half-block gradient divider, `gradientText(text, index, total)` per-line gradient coloring.

**ANSI compatibility:** All color output uses standard 8/16-color ANSI escape codes as baseline (NFR 6). Extended color codes may be used where supported. Non-TTY output is out of scope.

---

### Coffee Supporter Screen

`screens/home.ts` exports `showCoffeeScreen()` — a dedicated screen that clears the terminal and displays an ASCII QR code (via `qrcode-terminal`) encoding the creator's Buy Me a Coffee URL, followed by the URL in plain text. A single Back action returns to the home screen. The coffee action is positioned between the archived domains separator and the Exit action on the home screen.

---

### Welcome Screen — 3-Second Auto-Proceed Timer

`screens/welcome.ts` exports `showWelcomeScreen()`. Shown on startup when `settings.showWelcome` is `true` (after the first-launch provider setup, before the home screen). The screen renders:
1. ASCII-art logo with gradient text
2. Typewriter-animated tagline (`"Train your brain, one question at a time"`)
3. App version
4. Gradient shadow divider
5. A "Press enter to continue..." prompt

**Auto-proceed behavior:** A 3-second `cancellableSleep(3000)` races against the Enter-key prompt (`Promise.race`). If the user does nothing for 3 seconds, the screen auto-proceeds to the home screen. If the user presses Enter before the timer expires, the timer is cancelled and the screen proceeds immediately. Ctrl+C exits the process.

---

### Exit Screen — 3-Second Auto-Exit Timer

`screens/exit.ts` exports `showExitScreen(totalQuestions: number)`. Shown when the user selects Exit from the home screen, **only if `settings.showWelcome` is `true`** (the same setting controls both welcome and exit screens). The screen renders:
1. ASCII-art logo with gradient text (same `ASCII_ART` as the welcome screen)
2. Typewriter-animated dynamic exit message based on `totalQuestions` (across all domains, including archived)
3. App version
4. Gradient shadow divider
5. A "Press enter to exit now..." prompt

**Dynamic exit messages** (`getExitMessage(totalQuestions)` — pure, exported for testing):
- 0 questions: `"Break's over, see you next round"`
- 1–9: `"N question(s) smashed, not bad for a break"`
- 10–49: `"N questions? Your brain's showing off"`
- 50–99: `"N questions deep, absolute brain breaker"`
- 100+: `"N questions mastered, certified brain breaker"`

**Auto-exit behavior:** A 3-second `cancellableSleep(3000)` races against the Enter-key prompt (`Promise.race`). If the user does nothing for 3 seconds, `process.exit(0)` is called automatically. If the user presses Enter before the timer expires, the timer is cancelled and the process exits immediately. Ctrl+C also exits.

**Total questions calculation:** The home screen aggregates `history.length` from all active domain files, plus `history.length` from all archived domain files, and passes the total to `showExitScreen(totalQuestions)`.

---

### Challenge Mode (Sprint) Architecture

`screens/sprint-setup.ts` exports `showSprintSetup(slug)`. `screens/challenge.ts` exports `showChallengeExecution(slug, config, questions)`. The router's `showChallenge(slug)` orchestrates: setup → preload → execute → return to domain sub-menu.

**Sprint Setup Screen — `screens/sprint-setup.ts`**

The Challenge action is positioned after Play in the domain sub-menu. Selecting it calls `router.showChallenge(slug)`, which first invokes `showSprintSetup(slug)`. The setup screen renders two `inquirer` select prompts navigated via arrow keys:
- **Time budget:** `2 min` / `5 min` / `10 min` (stored as milliseconds: 120_000, 300_000, 600_000)
- **Question count N:** `5` / `10` / `20`

Two actions: **Confirm** and **Back**. Back returns `null` to the router, which returns the user to the domain sub-menu. Confirm returns `{ timeBudgetMs: number, questionCount: number }`.

**Question Preloading — `preloadQuestions()` in `ai/client.ts`**

New public export:

```typescript
export async function preloadQuestions(
  count: number,
  domain: string,
  difficultyLevel: number,
  existingHashes: Set<string>,
  settings: SettingsFile
): Promise<Result<Question[]>>
```

- Sequential generation loop — accumulates each question's hash into a running `Set` (union of `existingHashes` + all hashes generated so far in this batch) to prevent intra-batch duplicates in addition to domain-history duplicates
- Each question goes through the same `generateQuestion()` pipeline: prompt → AI call → Zod parse → Fisher-Yates shuffle → fail-closed verification gate (`correctAnswer` + `correctOptionText`) → dedup check → result
- An `ora` spinner is shown by the calling screen during preload; the spinner text updates with progress (e.g., `"Generating questions (3/10)..."`)
- If the AI provider is unreachable or any question exhausts its 3-attempt candidate budget during generation, the entire preload fails — returns `{ ok: false, error: <provider-specific or generation error> }`; no partial results are returned
- On failure, the calling screen displays the error (same `AI_ERRORS` messages as Play mode) and returns the user to the domain sub-menu — no sprint is started
- Preloaded questions are passed to the execution screen in memory — not written to disk until answered

**Sprint Execution — `screens/challenge.ts`**

Receives `slug`, `config: { timeBudgetMs, questionCount }`, and `questions: Question[]` from the router. Owns the sprint loop and timer.

**Timer strategy — wall-clock `Date.now()` delta:**
- Record `sprintStartMs = Date.now()` when the first question renders
- On each render (question display, post-answer feedback), compute `remainingMs = config.timeBudgetMs - (Date.now() - sprintStartMs)` and format as `M:SS`
- The timer is rendered prominently above (or alongside) the question text in the terminal
- **No `setInterval` ticking** — remaining time is computed on-demand from the wall-clock delta to avoid drift accumulation

**Timer-based prompt interruption — `AbortController`:**
- Before each `inquirer` prompt (answer selection, post-answer navigation), create an `AbortController` and compute `timeLeftMs = config.timeBudgetMs - (Date.now() - sprintStartMs)`
- Schedule `setTimeout(abortController.abort, timeLeftMs)` to fire when the sprint timer expires
- Pass `signal: abortController.signal` to the `inquirer` prompt — when aborted, the prompt throws and the sprint loop handles the timeout
- Clear the timeout if the user answers before it fires

**Per-question execution flow:**
1. `clearScreen()` + render banner + render countdown timer (`M:SS`)
2. Render question text + options via `renderQuestionDetail()`
3. Start `inquirer` answer prompt with `AbortController` timeout
4. **User answers in time:** record answer, compute `applyAnswer()`, render inline feedback (same pattern as quiz — no `clearScreen()` between question and feedback), render countdown timer in feedback, prompt Next / Back with `AbortController` timeout
5. **Timer expires mid-question:** auto-submit as incorrect (`userAnswer: "TIMEOUT"`, `isCorrect: false`, speed tier: `slow`, scoring uses slow + incorrect multiplier); render brief timeout feedback; sprint ends
6. **Timer expires mid-post-answer-feedback:** sprint ends immediately — no further questions
7. **User selects Back:** sprint exits immediately — unanswered questions discarded

**Post-answer navigation (limited):**
- **Next question** — advances to next preloaded question; `clearScreen()` triggers
- **Back** — exits sprint immediately (termination condition d)
- No Explain answer, Bookmark, Remove bookmark, or Teach me more options during a sprint

**Per-answer persistence:**
Each answered question is written to the domain file immediately via `writeDomain(slug, updatedState)` — same write-after-every-answer pattern as `screens/quiz.ts`. No batch write at sprint end. This ensures crash safety: if the process terminates mid-sprint, all already-answered questions are persisted.

Fields written per answered question (appended to `history[]`):
- All standard `QuestionRecord` fields: `question`, `options`, `correctAnswer`, `userAnswer`, `isCorrect`, `answeredAt`, `timeTakenMs`, `speedTier`, `scoreDelta`, `difficultyLevel`, `bookmarked: false`
- For auto-submitted timeout questions: `userAnswer: "TIMEOUT"`, `isCorrect: false`, `speedTier: "slow"`
- Question hash added to `hashes[]` only for answered questions
- `meta` updated via `applyAnswer()` after each question (streak, difficulty, score, totalTimePlayedMs)

**Sprint termination — four conditions:**

| Condition | Trigger | Behavior |
|---|---|---|
| All N questions answered | Loop exhausts preloaded array | Normal completion — proceed to post-sprint |
| Timer expires mid-question | `AbortController` aborts answer prompt | Auto-submit current question as `TIMEOUT` → persist → proceed to post-sprint |
| Timer expires mid-post-answer | `AbortController` aborts navigation prompt | Sprint ends immediately → proceed to post-sprint |
| User selects Back | User action during post-answer nav | Sprint exits immediately → proceed to post-sprint |

**Unanswered question disposal:**
Preloaded questions that were never displayed or answered are discarded in memory. Their hashes are **not** added to the domain's `hashes[]` array — they remain eligible for future generation.

**Post-sprint:**
After termination, the challenge screen returns session data to the router: `{ questionsAnswered, totalQuestions, timeTakenMs, scoreDelta, sprintConfig }`. The router returns the user to `showDomainMenu(slug)`, which renders the Feature 14 session summary block on first re-render — including the sprint-specific **Sprint result** field (field 9: `"Completed X/N questions"` in green or `"Time expired — X/N questions answered"` in red).

---

### ASCII Art Screen

`screens/ascii-art.ts` exports `showAsciiArtScreen(slug)`. The router's `showAsciiArt(slug)` delegates to it, and `screens/domain-menu.ts` exposes the ASCII Art action between Statistics and Archive.

**Rendering model:**
- `figlet.textSync(slug, { font })` generates the banner locally — no AI provider call, no network dependency, and no loading spinner
- `pickRandomFont(previousFont?)` selects one font from a curated list of 14 FIGlet fonts; when regenerating, the immediate previous font is excluded so the banner style changes on the next render
- `clearAndBanner()` preserves the standard functional screen shell
- `header('🎨 ASCII Art — ' + slug)` matches the Statistics-style header pattern
- `colorAsciiArt()` trims trailing blank lines and applies `gradientText()` row-by-row from cyan (top) to magenta (bottom)

**Navigation:**
- The screen shows `🔄 Regenerate`, a separator, and `←  Back`
- Selecting Regenerate rerenders the banner immediately with a different font while staying on the same screen
- Selecting Back or receiving `ExitPromptError` returns to `router.showDomainMenu(slug)`
- No persistence, caching, or file I/O occurs on this screen

---

### Module Architecture

**`src/` Directory Structure**

```
src/
├── index.ts              # Entry point — bootstraps and calls router
├── router.ts             # Navigation dispatcher — 16 exported functions, only file that calls screens
├── screens/
│   ├── home.ts           # F1: domain list + coffee screen (F10)
│   ├── create-domain.ts  # F1: new domain input + starting difficulty selection + validation + duplicate check
│   ├── domain-menu.ts    # F1: domain sub-menu (Play, Challenge, History, Bookmarks, Statistics, ASCII Art, Archive, Delete, Back)
│   ├── select-domain.ts  # F1/F2: motivational message + quiz transition
│   ├── archived.ts       # F1: archived domain list + unarchive
│   ├── quiz.ts           # F3: question loop, timer, answer feedback
│   ├── sprint-setup.ts   # F14: sprint parameter selection (time budget + question count)
│   ├── challenge.ts      # F14: sprint execution loop — preload spinner, countdown timer, limited post-answer nav
│   ├── history.ts        # F6: single-question navigation history view
│   ├── bookmarks.ts      # F12: single-question bookmark navigation view
│   ├── stats.ts          # F7: stats dashboard
│   ├── ascii-art.ts      # F15: local FIGlet domain banner with randomized font selection + gradient coloring
│   ├── settings.ts       # F8: language, tone, welcome & exit screen toggle, AI provider settings screen
│   ├── provider-settings.ts # F8: per-provider model/endpoint prompts with defaults
│   ├── provider-setup.ts # F8: first-launch provider selection + validation
│   ├── welcome.ts        # F11: animated ASCII-art welcome screen with typewriter tagline + 3s auto-proceed timer
│   └── exit.ts           # F13: animated ASCII-art exit screen with dynamic session message + 3s auto-exit timer
├── ai/
│   ├── client.ts         # F2/F14: provider-agnostic AI client + fail-closed verification gating + error handling + preloadQuestions()
│   ├── providers.ts      # F2: AiProvider interface + 6 adapters (5 via Vercel AI SDK + 1 custom Copilot)
│   └── prompts.ts        # F2: generation + verification prompt templates + Zod response schemas + voice injection
├── domain/
│   ├── store.ts          # F5: read/write domain + settings files (atomic)
│   ├── schema.ts         # F5/F8: types + Zod schemas (DomainFile, SettingsFile, AiProviderType, ToneOfVoice)
│   └── scoring.ts        # F4: score delta formula, difficulty progression
└── utils/
    ├── hash.ts           # SHA-256 hashing helpers
    ├── slugify.ts        # Domain name → file slug
    ├── screen.ts         # clearScreen() — viewport reset before every render
    └── format.ts         # F9: semantic color helpers, menuTheme, gradient rendering utilities, formatting utilities; renderQuestionDetail() — unified options + feedback block used by quiz, history, and bookmarks screens
```

**Dependency Rules:**
- `screens/` may import from `domain/`, `ai/`, and `utils/` — never the reverse
- `router.ts` may import from `screens/` only — never from `domain/` or `ai/` directly (exception: `router.ts` may import from `domain/store.ts` for archiveDomain/deleteDomain operations that are thin wrappers)
- `domain/store.ts` is the **only** module that writes to disk (domain files and settings)
- `ai/providers.ts` is the **only** module that imports provider SDKs (`@github/copilot-sdk`, `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) and makes raw HTTP calls (Ollama via `fetch()`)
- `ai/client.ts` is the **only** module that calls `createProvider()` and orchestrates AI completions — screens never call providers directly
- `utils/format.ts` may use **type-only** imports from `domain/schema.ts` (e.g. `QuestionRecord`, `SpeedTier`) — no runtime imports from other `src/` directories

### Decision Impact Analysis

**Implementation Sequence:**
1. Scaffold: `package.json`, `tsconfig.json`, directory structure
2. `domain/schema.ts` — define types and Zod schema first (everything else depends on this) — includes `AiProviderType`
3. `domain/store.ts` — atomic reads/writes
4. `utils/` — hash, slugify, screen, format
5. `ai/providers.ts` — `AiProvider` interface + 6 adapters (5 via Vercel AI SDK `generateText()` + 1 custom Copilot adapter)
6. `ai/prompts.ts` + `ai/client.ts` — provider-agnostic AI integration with Zod validation
7. `domain/scoring.ts` — scoring formula and difficulty logic
8. `screens/` — provider-setup, home, quiz, history, stats, settings
9. `router.ts` + `index.ts` — wire everything together (first-launch provider setup flow)

**Cross-Component Dependencies:**
- Schema types flow from `domain/schema.ts` → all modules (includes `AiProviderType`)
- `screens/quiz.ts` depends on both `domain/store.ts` and `ai/client.ts` — the two slowest paths
- `screens/challenge.ts` depends on `domain/store.ts`, `ai/client.ts` (preloadQuestions), and `domain/scoring.ts` — same dependency profile as quiz.ts
- `ai/client.ts` depends on `ai/providers.ts` (provider factory) and `ai/prompts.ts` (prompt builders)
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
  NO_PROVIDER: 'AI provider not ready. Go to Settings to configure.',
  PARSE: 'Received an unexpected response from the AI provider. Please try again.',
  NETWORK_COPILOT: 'Could not reach the Copilot API. Check your connection and try again.',
  AUTH_COPILOT: 'Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in.',
  // ... per-provider NETWORK_* and AUTH_* variants (see API & Communication Patterns)
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
- Place all provider SDK imports in `ai/providers.ts` exclusively
- Route all AI completions through `ai/client.ts` — screens never call providers directly
- Treat verification as a mandatory approval gate — questions without a successful verification response must never be returned to callers
- Enforce the bounded retry budget of 3 candidate attempts total (initial attempt + 2 retries) for both quiz and preload flows
- Use `applyAnswer()` for all difficulty/streak/score mutations
- Store timestamps as ISO 8601 strings
- Use `utils/slugify.ts` for all domain name → slug conversions
- Use per-provider error messages from `AI_ERRORS` — never generic messages for provider-specific failures

**Anti-Patterns — Never Do These:**
- Raw `throw` or unhandled `try/catch` in screens
- `fs.writeFile()` called outside `domain/store.ts`
- Provider SDK imports (`CopilotClient`, `generateText`, `openai()`, etc.) outside `ai/providers.ts`
- Direct calls to `provider.generateCompletion()` outside `ai/client.ts`
- `meta.streakCount++` or any direct mutation of domain state
- Importing with bare specifiers (no `.js` extension) in ESM modules
- Barrel `index.ts` re-exports
- Storing API keys in `settings.json` or prompting users to enter them in-app

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
│   ├── index.ts                    # Entry: bootstraps app, reads settings, routes to provider setup / welcome / home
│   ├── router.ts                   # Navigation dispatcher — 16 exported functions, only file that calls screens
│   ├── screens/
│   │   ├── home.ts                 # F1/F10: domain list + coffee screen
│   │   ├── home.test.ts
│   │   ├── create-domain.ts        # F1: new domain input + starting difficulty selection + validation + duplicate check
│   │   ├── create-domain.test.ts
│   │   ├── domain-menu.ts          # F1: domain sub-menu (Play, Challenge, History, Bookmarks, Statistics, ASCII Art, Archive, Delete, Back)
│   │   ├── domain-menu.test.ts
│   │   ├── select-domain.ts        # F1/F2: motivational message + quiz transition
│   │   ├── select-domain.test.ts
│   │   ├── archived.ts             # F1: archived domain list + unarchive
│   │   ├── archived.test.ts
│   │   ├── quiz.ts                 # F3: question loop, timer, answer feedback
│   │   ├── quiz.test.ts
│   │   ├── sprint-setup.ts         # F14: sprint parameter selection (time budget + question count)
│   │   ├── sprint-setup.test.ts
│   │   ├── challenge.ts            # F14: sprint execution loop — preload spinner, countdown timer, limited post-answer nav
│   │   ├── challenge.test.ts
│   │   ├── history.ts              # F6: single-question navigation history view
│   │   ├── history.test.ts
│   │   ├── bookmarks.ts            # F12: single-question bookmark navigation view
│   │   ├── bookmarks.test.ts
│   │   ├── stats.ts                # F7: stats dashboard
│   │   ├── stats.test.ts
│   │   ├── ascii-art.ts            # F15: local FIGlet domain banner with randomized font selection + gradient coloring
│   │   ├── ascii-art.test.ts
│   │   ├── settings.ts             # F8: language, tone, welcome & exit screen toggle, AI provider settings screen
│   │   ├── settings.test.ts
│   │   ├── provider-settings.ts     # F8: per-provider model/endpoint prompts with defaults
│   │   ├── provider-setup.ts       # F8: first-launch provider selection + validation
│   │   ├── provider-setup.test.ts
│   │   ├── welcome.ts              # F11: animated ASCII-art welcome screen with typewriter tagline + 3s auto-proceed timer
│   │   ├── welcome.test.ts
│   │   ├── exit.ts                 # F13: animated ASCII-art exit screen with dynamic session message + 3s auto-exit timer
│   │   └── exit.test.ts
│   ├── ai/
│   │   ├── client.ts               # F2/F14: provider-agnostic AI client + Result<T> error wrapping + preloadQuestions()
│   │   ├── client.test.ts
│   │   ├── providers.ts            # F2: AiProvider interface + 6 adapters (5 via Vercel AI SDK + 1 custom Copilot)
│   │   ├── providers.test.ts
│   │   ├── prompts.ts              # F2: prompt templates + Zod QuestionResponseSchema + voice injection
│   │   └── prompts.test.ts
│   ├── domain/
│   │   ├── schema.ts               # F5/F8: DomainFile + SettingsFile + AiProviderType + ToneOfVoice types + Zod schemas + PROVIDER_CHOICES/LABELS + DEFAULT_* constants
│   │   ├── schema.test.ts
│   │   ├── store.ts                # F5/F8: read/write domain + settings files (atomic) + tone migration
│   │   ├── store.test.ts
│   │   ├── scoring.ts              # F4: applyAnswer(), score delta formula
│   │   └── scoring.test.ts
│   └── utils/
│       ├── hash.ts                 # SHA-256 hashing for deduplication
│       ├── hash.test.ts
│       ├── slugify.ts              # Domain name → kebab-case file slug
│       ├── slugify.test.ts
│       ├── screen.ts               # NFR 5: clearScreen() — ANSI viewport reset
│       ├── screen.test.ts
│       ├── format.ts               # F9: semantic color helpers, menuTheme, gradient rendering utilities, formatting utilities; renderQuestionDetail() — unified options + feedback block used by quiz, history, and bookmarks screens
│       └── format.test.ts
├── patches/                            # patch-package patches for transitive dependencies
│   └── vscode-jsonrpc+8.2.1.patch      # Patches vscode-jsonrpc (transitive dep of @github/copilot-sdk)
└── dist/                           # Compiled output — gitignored
```

### Architectural Boundaries

**External Boundaries (outside the process):**

| Boundary | Owner | Entry Point |
|---|---|---|
| AI Providers (Copilot, OpenAI, Anthropic, Gemini, Ollama, OpenAI Compatible API) | `ai/providers.ts` | Only module that imports provider SDKs (Vercel AI SDK `generateText` + `@ai-sdk/*` for 5 providers; `@github/copilot-sdk` for Copilot); `ai/client.ts` orchestrates via `AiProvider` interface |
| File system (`~/.brain-break/`) | `domain/store.ts` | Only module that calls `fs.*` write operations |
| Terminal I/O (stdout/stdin) | `screens/*` + `router.ts` | `inquirer`, `ora`, `chalk` used only here; `utils/screen.ts` owns the viewport-clear primitive |

**Internal Boundaries:**
- `screens/` → may import from `domain/`, `ai/`, `utils/` — never the reverse
- `router.ts` → imports from `screens/` only — never from `domain/` or `ai/` directly (exception: `router.ts` may import from `domain/store.ts` for archiveDomain/deleteDomain operations that are thin wrappers)
- `ai/client.ts` → imports from `ai/providers.ts` and `ai/prompts.ts` — never imports provider SDKs directly
- `ai/providers.ts` → the only module that imports provider SDKs (Vercel AI SDK + Copilot SDK); exports the `AiProvider` interface
- `domain/scoring.ts` → pure computation, no imports from `screens/` or `ai/`
- `utils/` → no runtime imports from any other `src/` directory; `utils/format.ts` uses **type-only** imports from `domain/schema.ts` (`QuestionRecord`, `SpeedTier`)

### Feature to Structure Mapping

| Feature | Primary Module(s) |
|---|---|
| F1 — Domain Management | `screens/home.ts`, `screens/create-domain.ts`, `screens/domain-menu.ts`, `screens/select-domain.ts`, `screens/archived.ts`, `domain/store.ts`, `utils/slugify.ts` |
| F2 — AI Question Generation | `ai/client.ts` (candidate loop + fail-closed verification gate), `ai/providers.ts`, `ai/prompts.ts` (generation + verification schemas), `domain/scoring.ts` (difficulty input) |
| F3 — Interactive Quiz | `screens/quiz.ts`, `ai/client.ts`, `domain/store.ts`, `domain/scoring.ts`, `utils/format.ts` (`renderQuestionDetail`) |
| F4 — Scoring System | `domain/scoring.ts` (pure logic), `domain/store.ts` (persist) |
| F5 — Persistent History | `domain/store.ts`, `domain/schema.ts` |
| F6 — View History | `screens/history.ts`, `domain/store.ts`, `utils/format.ts` (`renderQuestionDetail`) |
| F7 — View Stats | `screens/stats.ts`, `domain/store.ts` |
| F8 — Global Settings | `screens/settings.ts`, `screens/provider-setup.ts`, `domain/store.ts` (readSettings/writeSettings), `domain/schema.ts` (SettingsFile/AiProviderType/ToneOfVoice), `ai/prompts.ts` (voice injection), `ai/providers.ts` (provider validation) |
| F9 — Color System | `utils/format.ts` (semantic color helpers, menuTheme) + all `screens/*.ts` (consumers) |
| F10 — Coffee Screen | `screens/home.ts` (showCoffeeScreen) |
| F11 — Welcome Screen | `screens/welcome.ts` (animated ASCII-art + typewriter tagline + 3s auto-proceed timer), `domain/schema.ts` (`showWelcome` setting) |
| F12 — Question Bookmarks | `screens/bookmarks.ts`, `screens/quiz.ts` (bookmark toggle post-answer), `screens/history.ts` (bookmark toggle), `screens/domain-menu.ts` (View Bookmarks action), `domain/store.ts`, `utils/format.ts` (`renderQuestionDetail`) |
| F13 — Exit Screen | `screens/exit.ts` (dynamic session message + typewriter animation + 3s auto-exit timer), `screens/home.ts` (total questions aggregation + conditional exit routing), `domain/schema.ts` (`showWelcome` setting) |
| F14 — Challenge Mode (Sprint) | `screens/sprint-setup.ts` (setup UI), `screens/challenge.ts` (preload + execution loop + timer + per-answer write), `screens/domain-menu.ts` (Challenge action), `ai/client.ts` (`preloadQuestions()`), `domain/store.ts`, `domain/scoring.ts`, `utils/format.ts` (`renderQuestionDetail`) |
| F15 — ASCII Art Screen | `screens/ascii-art.ts` (local FIGlet rendering + randomized font selection + gradient coloring), `screens/domain-menu.ts` (ASCII Art action), `router.ts` (`showAsciiArt()`), `utils/format.ts` (`gradientText`) |
| NFR 5 — Terminal Screen Mgmt | `utils/screen.ts` (primitive) + all `screens/*.ts` (consumers) |
| NFR 6 — Color Rendering | `utils/format.ts` (ANSI 8/16-color baseline) |

**Cross-Cutting Concern Mapping:**

| Concern | Location |
|---|---|
| SHA-256 deduplication | `utils/hash.ts` (compute) + `domain/store.ts` (persist hashes) |
| Adaptive difficulty | `domain/scoring.ts` → `applyAnswer()` |
| Atomic file write | `domain/store.ts` → `writeDomain()`, `writeSettings()` |
| AI error messages | `ai/providers.ts` → `AI_ERRORS` constants (per-provider network + auth + quota messages); re-exported from `ai/client.ts` |
| Domain slug derivation | `utils/slugify.ts` exclusively |
| Terminal screen clearing | `utils/screen.ts` → `clearScreen()` — called as first operation in every screen render path; **exception:** post-answer feedback (both quiz and challenge mode) renders inline on the question screen (no `clearScreen()` between question and feedback) |
| Language & tone injection | `ai/prompts.ts` → voice instruction prepended to all AI prompts when non-default settings active |
| Answer verification gating | `ai/client.ts` → `generateQuestion()` requires successful verification with aligned `correctAnswer` + `correctOptionText`; retries are bounded at 3 candidate attempts total |
| Provider abstraction | `ai/providers.ts` → `AiProvider` interface + 6 adapters (5 via Vercel AI SDK `generateText()` + 1 custom Copilot adapter); `ai/client.ts` → `createProvider()` factory |
| Semantic color vocabulary | `utils/format.ts` → `colorCorrect()`, `colorIncorrect()`, `colorSpeedTier()`, `colorDifficultyLevel()`, `colorScoreDelta()`, `menuTheme`, gradient rendering (`lerpColor`, `gradientBg`, `gradientShadow`) |
| Question detail rendering | `utils/format.ts` → `renderQuestionDetail()` — unified options + feedback block (markers, correct/incorrect status, time/speed/difficulty, score delta, optional timestamp) consumed by `screens/quiz.ts`, `screens/history.ts`, `screens/bookmarks.ts`, and `screens/challenge.ts` |
| Settings tone migration | `domain/store.ts` → `migrateSettings()` — maps legacy tone values on read |
| Sprint countdown timer | `screens/challenge.ts` — wall-clock `Date.now()` delta rendered as `M:SS` on every question + post-answer screen; `AbortController` + `setTimeout` interrupts active `inquirer` prompt on timer expiry |
| Batch question preloading | `ai/client.ts` → `preloadQuestions()` — sequential N-question generation with intra-batch + domain-history dedup; `ora` spinner progress in `screens/challenge.ts`; provider failure aborts entire sprint |

### Integration Points

**Data Flow — Question Cycle:**
```
screens/quiz.ts
  → domain/store.ts.readSettings()                     [reads ~/.brain-break/settings.json]
  → ai/client.ts.generateQuestion(domain, difficulty, hashes, prev, settings)
    → ai/providers.ts.createProvider(settings)          [instantiates active provider adapter]
    → candidateAttempt loop (max 3 total attempts)
      → ai/prompts.ts (generation prompt + voice injection)
      → provider.generateCompletion(generationPrompt)    [calls active AI provider API]
      → ai/client.ts (strip fences + Zod parse + shuffle options)
      → ai/prompts.ts.buildVerificationPrompt(candidate, settings)
      → provider.generateCompletion(verificationPrompt)  [2nd AI call]
      → Zod parse VerificationResponseSchema
      → validate verification.correctAnswer maps to candidate.options[letter] === verification.correctOptionText
      → mismatch / network / parse / schema? → discard candidate and retry fresh
    → dedup check (hash ∈ hashes Set?) on verified candidate only
      → duplicate? → restart candidate loop with dedup prompt while attempt budget remains
  → returns Result<Question>
  → domain/scoring.ts.applyAnswer(meta, isCorrect, timeTakenMs, thresholds)
  → returns { updatedMeta, scoreDelta, speedTier }
  → domain/store.ts.writeDomain(slug, updatedState)    [fs.rename atomic]
```

**Data Flow — Startup:**
```
index.ts
  → domain/store.ts.readSettings()                      [reads ~/.brain-break/settings.json]
  → settings.provider === null
    → router.showProviderSetup()                        [first-launch provider selection]
    → screens/provider-setup.ts
      → ai/providers.ts.validateProvider(type, settings) [checks auth/env var/endpoint]
      → domain/store.ts.writeSettings(updated)           [saves selected provider]
  → settings.showWelcome === true
    → router.showWelcome()                              [animated ASCII-art splash screen]
    → screens/welcome.ts
      → clearScreen() + ASCII art + typewriter tagline + press-to-continue
      → 3-second cancellableSleep races against Enter-key prompt
      → auto-proceeds on timer expiry or user Enter press
  → router.showHome()
    → screens/home.ts
    → domain/store.ts.listDomains()                     [reads ~/.brain-break/]
    → renders domain list with scores
```

**Data Flow — Exit:**
```
screens/home.ts (user selects Exit)
  → domain/store.ts.readSettings()                      [reads ~/.brain-break/settings.json]
  → settings.showWelcome === true
    → aggregates totalQuestions from all domains          [active + archived history.length]
    → router.showExit(totalQuestions)
    → screens/exit.ts
      → clearScreen() + ASCII art + typewriter exit message + press-to-exit
      → 3-second cancellableSleep races against Enter-key prompt
      → process.exit(0) on timer expiry or user Enter press
  → settings.showWelcome === false
    → process.exit(0) immediately
```

**Data Flow — Settings Change:**
```
screens/settings.ts
  → domain/store.ts.readSettings()                     [reads current or defaults]
  → user modifies provider / language / tone
  → if provider changed: ai/providers.ts.validateProvider(type, settings)
  → domain/store.ts.writeSettings(updatedSettings)     [fs.rename atomic]
  → returns to home screen
```

**Data Flow — Sprint Cycle (Challenge Mode):**
```
router.showChallenge(slug)
  → screens/sprint-setup.ts.showSprintSetup(slug)
    → user selects timeBudget + questionCount → Confirm
    → returns { timeBudgetMs, questionCount }
  → domain/store.ts.readDomain(slug)                   [reads domain file for hashes + meta]
  → domain/store.ts.readSettings()                     [reads settings for AI provider]
  → ai/client.ts.preloadQuestions(count, domain, difficulty, hashes, settings)
    → sequential loop: for each of N questions:
      → generateQuestion(domain, difficulty, runningHashes, prev, settings)
        → same pipeline as Question Cycle (prompt → AI → Zod → shuffle → verify → dedup)
      → accumulates question hash into runningHashes Set (intra-batch dedup)
    → returns Result<Question[]>
  → preload failure → display AI_ERRORS message → router.showDomainMenu(slug)
  → preload success → screens/challenge.ts.showChallengeExecution(slug, config, questions)
    → sprintStartMs = Date.now()
    → for each preloaded question (index 0..N-1):
      → remainingMs = timeBudgetMs - (Date.now() - sprintStartMs)
      → clearScreen() + banner + render timer (M:SS) + render question
      → inquirer answer prompt + AbortController(remainingMs)
        → user answers in time:
          → domain/scoring.ts.applyAnswer(meta, isCorrect, timeTakenMs, thresholds)
          → append QuestionRecord to history + hash to hashes[]
          → domain/store.ts.writeDomain(slug, updatedState)    [fs.rename atomic — per answer]
          → render inline feedback + timer
          → inquirer Next/Back prompt + AbortController(remainingMs)
            → Next → continue loop
            → Back → break loop (termination d)
            → timeout → break loop (termination c)
        → timeout (AbortController fires):
          → auto-submit: userAnswer="TIMEOUT", isCorrect=false, speedTier="slow"
          → domain/scoring.ts.applyAnswer(meta, false, timeBudgetMs, thresholds)
          → append QuestionRecord + hash + writeDomain() (termination b)
          → break loop
    → return session data { questionsAnswered, totalQuestions, scoreDelta, ... }
  → router.showDomainMenu(slug) [renders session summary with sprint result field]
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

All technology choices are mutually compatible — Node.js v22.0.0+, ESM, NodeNext, `inquirer` v12, `@inquirer/prompts`, `ora` v8, `chalk` v5, `figlet`, `zod`, `qrcode-terminal`, `ai` (Vercel AI SDK), `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible`, `@github/copilot-sdk`, `patch-package`, and `vitest` are all ESM-native and internally consistent. The Vercel AI SDK unifies 4 of 6 provider adapters (OpenAI, Anthropic, Gemini, OpenAI Compatible API) under a single `generateText()` interface; Ollama uses raw HTTP `fetch()` and Copilot uses a custom SDK adapter — reducing per-provider boilerplate and SDK version maintenance burden. The `Result<T>` error pattern, atomic write strategy, provider abstraction (`AiProvider` interface), local FIGlet rendering for ASCII Art, and Zod validation approach are coherent and mutually reinforcing. The directory structure directly implements all dependency rules by design. Challenge Mode reuses the same `generateQuestion()` pipeline, `applyAnswer()` scoring, `writeDomain()` persistence, and `renderQuestionDetail()` rendering — no new architectural primitives needed; the `AbortController`-based prompt interruption uses native Node.js APIs already available in the runtime target.

### Requirements Coverage Validation ✅

| Feature | Status | Location |
|---|---|---|
| F1 — Domain Management | ✅ | `screens/home.ts`, `screens/create-domain.ts`, `screens/domain-menu.ts`, `screens/select-domain.ts`, `screens/archived.ts`, `domain/store.ts`, `utils/slugify.ts` |
| F2 — AI Question Generation | ✅ | `ai/client.ts`, `ai/providers.ts`, `ai/prompts.ts`, `domain/scoring.ts` |
| F3 — Interactive Quiz | ✅ | `screens/quiz.ts` + `ai/client.ts` + `ai/providers.ts` + both data layers |
| F4 — Scoring System | ✅ | `domain/scoring.ts` (pure) + `domain/store.ts` (persist) |
| F5 — Persistent History | ✅ | `domain/store.ts`, `domain/schema.ts` |
| F6 — View History | ✅ | `screens/history.ts` |
| F7 — View Stats | ✅ | `screens/stats.ts` |
| F8 — Global Settings | ✅ | `screens/settings.ts`, `screens/provider-setup.ts`, `domain/store.ts`, `domain/schema.ts`, `ai/prompts.ts`, `ai/providers.ts` |
| F9 — Color System | ✅ | `utils/format.ts` (semantic helpers + menuTheme + gradient rendering) |
| F10 — Coffee Screen | ✅ | `screens/home.ts` (showCoffeeScreen + qrcode-terminal) |
| F11 — Welcome Screen | ✅ | `screens/welcome.ts` (ASCII-art + typewriter + gradient rendering + 3s auto-proceed timer) |
| F12 — Question Bookmarks | ✅ | `screens/bookmarks.ts`, `screens/quiz.ts` (bookmark toggle post-answer), `screens/history.ts` (bookmark toggle), `screens/domain-menu.ts` (View Bookmarks action), `domain/store.ts` |
| F13 — Exit Screen | ✅ | `screens/exit.ts` (dynamic session message + typewriter + gradient rendering + 3s auto-exit timer), `screens/home.ts` (total questions aggregation) |
| F14 — Challenge Mode (Sprint) | ✅ | `screens/sprint-setup.ts` (setup UI), `screens/challenge.ts` (preload + execution + timer), `screens/domain-menu.ts` (Challenge action), `ai/client.ts` (`preloadQuestions()`), `domain/store.ts`, `domain/scoring.ts`, `utils/format.ts` |
| F15 — ASCII Art Screen | ✅ | `screens/ascii-art.ts` (local FIGlet rendering + randomized font selection + gradient coloring), `screens/domain-menu.ts` (ASCII Art action), `router.ts` (`showAsciiArt()`), `utils/format.ts` (`gradientText`) |

| NFR | Status | Addressed By |
|---|---|---|
| NFR 1 — ≤5s question generation | ✅ | `ora` spinner + `Result<T>` fast-fail path |
| NFR 2 — API error handling | ✅ | Per-provider `AI_ERRORS` constants + `Result<T>` in `ai/client.ts`; `NO_PROVIDER` guard for unconfigured state; same error path for `preloadQuestions()` batch failures |
| NFR 3 — Data integrity / corruption | ✅ | Write-then-rename atomic + Zod schema on read + `defaultDomainFile()` on ENOENT; sprint per-answer write ensures crash safety |
| NFR 4 — ≤2s startup | ✅ | No heavy imports at startup; `meta`-first schema design |
| NFR 5 — Terminal screen management | ✅ | `utils/screen.ts` → `clearScreen()` called as first operation in every screen render path; post-answer feedback (quiz and challenge) renders inline (no clear between question and feedback); sprint-setup and challenge screens follow standard clearScreen pattern |
| NFR 6 — Terminal color rendering | ✅ | `utils/format.ts` → ANSI 8/16-color baseline; `chalk` handles terminal capability detection |

### Implementation Readiness Validation ✅

All critical decisions are documented with explicit versions. Patterns are comprehensive with concrete examples and anti-patterns. Project structure is fully specified with feature-to-file mapping. All potential AI agent conflict points have been addressed with clear enforcement guidelines.

**2026-03-17 update (multi-provider):** Architecture updated for multi-provider AI integration (PRD 2026-03-17). Copilot-only backend replaced with 5-provider abstraction. Added `ai/providers.ts`, `screens/provider-setup.ts`. Settings schema expanded with `provider`, `ollamaEndpoint`, `ollamaModel`. All sections updated: auth, API patterns, error handling, navigation, boundaries, enforcement, validation. PRD Feature 8 tone inconsistency flagged (4 vs 7 tones — architecture keeps 7).

**2026-03-17 update:** Architecture synced with PRD 2026-03-15 and implemented codebase — added Feature 8 (Global Settings), Feature 9 (Color System), Feature 10 (Coffee Screen), Feature 1 Delete action; expanded screen list to 9 modules; updated navigation model to two-level menu; added `qrcode-terminal` and `@inquirer/prompts` dependencies; updated all coverage and mapping tables.

**2026-03-14 update:** NFR 5 (Terminal Screen Management) added — `utils/screen.ts` is a new module; all `screens/*.ts` files must call `clearScreen()` as their first render operation. The screen-clearing pattern and enforcement rule are documented in the Terminal UI Architecture section above.

### Gap Analysis Results

**No critical gaps.** One important behavior called out explicitly:

**Missing domain file = new domain (NFR 3):**
`domain/store.ts.readDomain()` MUST return a default value (not an error) when the target file does not exist. This "missing = clean start" behavior is required by NFR 3.

**Resolution:** `domain/schema.ts` exports a `defaultDomainFile(startingDifficulty?)` factory function returning a valid `DomainFile` at the specified starting difficulty level (defaults to level 2 — Elementary), score 0, empty history and hashes. `store.ts.readDomain()` calls this on `ENOENT` — no error propagated to the caller. `screens/create-domain.ts` calls `defaultDomainFile(selectedDifficulty)` when creating a new domain with the user's chosen starting difficulty.

**Missing settings file = defaults (F8):**
`domain/store.ts.readSettings()` MUST return `defaultSettings()` (`{ provider: null, language: 'English', tone: 'natural', openaiModel: 'gpt-5.4', anthropicModel: 'claude-sonnet-4.6-latest', geminiModel: 'gemini-2.5-pro', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama4', openaiCompatibleEndpoint: '', openaiCompatibleModel: '', showWelcome: true }`) when the settings file does not exist. No error propagated to the caller. A `null` provider triggers the first-launch Provider Setup screen.

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
- [x] All integration points mapped (question cycle, startup flow, sprint cycle)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Provider abstraction isolates all SDK complexity in a single file (`ai/providers.ts`) — adding a new provider requires only implementing the `AiProvider` interface
- All state mutations flow through pure functions — easy to test, easy to reason about
- All I/O in two dedicated modules — security and integrity enforced in one place each
- `Result<T>` pattern eliminates entire category of unhandled exceptions in screens
- API keys never stored in settings — env vars only; Copilot auth delegated to SDK

**Areas for Future Enhancement (Post-MVP):**
- Fuzzy/similarity deduplication (explicitly noted in PRD)
- Startup optimization: read only `meta` fields if history files grow large
- Retry with backoff on AI provider APIs
- Additional AI providers beyond the 6 built-in options (the OpenAI Compatible API provider already covers many services such as Azure OpenAI, Groq, Together AI, Mistral, Perplexity, DeepSeek, LM Studio, and vLLM)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently — refer to Enforcement Guidelines
- Respect module boundaries: `store.ts` owns all writes, `providers.ts` owns all SDK imports, `client.ts` orchestrates AI calls
- Always return `Result<T>` from I/O functions, never throw to callers
- Use `.js` extensions on all ESM imports
- Call `defaultDomainFile(startingDifficulty?)` from `domain/schema.ts` on ENOENT in `store.ts.readDomain()` (no parameter → defaults to level 2); in `screens/create-domain.ts`, pass the user-selected difficulty
- Use per-provider error messages from `AI_ERRORS` — never hardcode provider-specific strings outside `client.ts`
- Never store API keys in `settings.json` — read from env vars only

**First Implementation Step:**
```bash
npm init -y
npm install typescript tsx @types/node --save-dev
npx tsc --init --module nodenext --moduleResolution nodenext --target es2022
npm install openai @anthropic-ai/sdk @google/generative-ai
```
Then create the `src/` directory structure and begin with `domain/schema.ts` (includes `AiProviderType`).

---

**⚠️ PRD Inconsistency Flag (2026-03-17):**
The PRD Feature 8 lists 4 tones (Normal, Enthusiastic, Robot, Pirate) while the Implementation Decisions section lists 7 tones (`natural | expressive | calm | humorous | sarcastic | robot | pirate`). The architecture and codebase use the 7-tone set with migration support for the legacy names. The PRD Feature 8 section should be updated to match the Implementation Decisions section.
