---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/planning-artifacts/prd.md
  - docs/planning-artifacts/product-brief.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-03-07'
lastEdited: '2026-03-22'
editHistory:
  - date: '2026-03-22'
    changes: 'Per-provider model selection: settings schema expanded with openaiModel, anthropicModel, geminiModel fields and defaults. Settings JSON example updated. defaultSettings() output updated. First-launch provider setup and settings screen descriptions updated to reflect hosted provider model prompts with defaults and empty-string-resets-to-default. File tree updated with provider-settings.ts.'
  - date: '2026-03-21'
    changes: 'Adopted Vercel AI SDK (`ai` + `@ai-sdk/*` provider packages) for multi-provider abstraction. Replaced 4 individual provider SDKs (`openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, Ollama via fetch) with unified `generateText()` from Vercel AI SDK + thin `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `ollama-ai-provider` provider packages. GitHub Copilot SDK remains a custom adapter (not supported by Vercel AI SDK). Updated: Technical Constraints, AI Provider SDKs section, Multi-Provider Architecture (adapter table + usage example), Response Validation, dependency rules, module structure comments, enforcement guidelines, boundary tables, coherence validation.'
  - date: '2026-03-17'
    changes: 'Multi-provider AI integration: replaced Copilot-only AI backend with 5-provider abstraction (GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama). Added ai/providers.ts (AiProvider interface + 5 adapters), screens/provider-setup.ts (first-launch provider selection with non-blocking validation). Expanded settings schema with provider, ollamaEndpoint, ollamaModel fields. Rewrote Authentication & Security, API & Communication Patterns, and Error Handling sections for provider-agnostic architecture. Updated navigation flow with first-launch provider setup. Updated all dependency rules, boundaries, feature mapping, integration points, and validation tables. Flagged PRD Feature 8 tone list inconsistency (4 vs 7 tones — architecture keeps 7).'
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
10 features covering: domain lifecycle management (create, select, archive, unarchive, delete), multi-provider AI-powered question generation (GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama) with adaptive difficulty (5 levels, streak-driven) and language/tone injection, interactive terminal quiz with silent response timer, a scoring system using a base-points × speed-multiplier formula, full persistent question history per domain, single-question history navigation, a stats dashboard with trend analysis, global settings (AI provider, language & tone of voice) with first-launch provider setup, terminal UI highlighting with semantic color system, and a coffee supporter screen.

**Non-Functional Requirements:**
- Performance: Question generation ≤ 5s (API + persist); startup ≤ 2s
- Reliability: Graceful degradation on provider unavailability or auth failure with per-provider error messages; corrupted domain file recovery without crash
- Data integrity: SHA-256 deduplication persisted across sessions; missing file treated as clean new domain
- Terminal screen management: every state-changing navigation action clears the viewport before rendering new content — no residual output from the previous screen persists
- Terminal color rendering: ANSI 8/16-color baseline for cross-terminal compatibility

**Scale & Complexity:**

- Primary domain: CLI / terminal application (Unix-like: macOS, Linux, WSL)
- Complexity level: Low-Medium
- External dependencies: 5 AI provider adapters via Vercel AI SDK (`ai` + `@ai-sdk/*` provider packages) for OpenAI, Anthropic, Gemini, and Ollama; GitHub Copilot SDK as a custom adapter — one provider active at runtime, user-selected
- Estimated architectural components: 12–14 focused modules

### Technical Constraints & Dependencies

- Runtime: Node.js v25.8.0
- Interface: Terminal only — no web UI, no GUI
- AI: 5 interchangeable providers — OpenAI (`@ai-sdk/openai`), Anthropic (`@ai-sdk/anthropic`), Google Gemini (`@ai-sdk/google`) via the Vercel AI SDK (`ai`), Ollama via raw HTTP fetch, plus GitHub Copilot SDK (`@github/copilot-sdk`) as a custom adapter wrapping the `AiProvider` interface. All providers receive identical prompts and must return the same JSON schema (question text, options A–D, correct answer, difficulty, speed tier thresholds). API keys read from environment variables at runtime — never stored in settings
- Storage: `~/.brain-break/<domain-slug>.json` — one file per domain; `~/.brain-break/settings.json` — global settings (includes provider selection)
- Distribution: npm / npx — must reach home screen in ≤ 2s cold start
- Platform: Unix-like only (macOS, Linux, WSL)

### Cross-Cutting Concerns Identified

- **AI integration & error resilience:** Every question cycle routes through the active AI provider — one of 5 supported backends (GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama); network/auth failure paths produce per-provider error messages and must be handled uniformly across the quiz engine
- **File I/O with integrity guarantees:** Read/write/permission enforcement is needed everywhere domain state is touched — must be centralized, not scattered
- **State management:** Streak counter, difficulty level, score, and question hashes all evolve per answer and must be atomically persisted
- **Terminal rendering:** All user-facing output (home screen, quiz, feedback, history, stats, spinner) requires a consistent rendering approach — `utils/screen.ts` owns the viewport-clear primitive; all screens call `clearScreen()` as their first operation before any output
- **Deduplication:** SHA-256 lookup on every question generation — must be fast and correctly scoped per domain
- **Global settings & AI voice injection:** Language, tone of voice, and AI provider selection stored in a global settings file; language + tone injected into every AI prompt — affects questions, answer options, and motivational messages; provider setting determines which AI backend is used; must be read before any AI call
- **Semantic color system:** Post-answer feedback, speed tier badges, difficulty level badges, and menu highlighting all use a consistent color vocabulary defined in a single utility module

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
- `inquirer` v12 + `@inquirer/prompts` — interactive prompts (menus, free-text input, confirmations), ESM-native
- `ora` v8 — loading spinner during question generation
- `chalk` v5 — terminal color and styling, ESM-native
- `qrcode-terminal` — ASCII QR code rendering for Coffee Supporter Screen (Feature 10)

**AI Provider SDKs (via Vercel AI SDK):**
- `ai` — Vercel AI SDK core (`generateText()` unified interface)
- `@ai-sdk/openai` — OpenAI provider adapter
- `@ai-sdk/anthropic` — Anthropic provider adapter
- `@ai-sdk/google` — Google Gemini provider adapter
- `@github/copilot-sdk` — GitHub Copilot integration (custom adapter — not supported by Vercel AI SDK)

**CLI Entry & Distribution:**
- `bin` field in `package.json` pointing to compiled `dist/index.js`
- `engines.node` field set to `">=25.8.0"` (reflects actual dev environment)
- `npx`-compatible out of the box

**Testing Framework:**
- `vitest` — TypeScript-native, ESM-compatible, minimal config
- Unit tests per module — co-located in `src/` as `*.test.ts`
- Regression tests — cross-boundary integration tests using real file I/O (`_setDataDir` injected temp dir); cover the store → router chain and stats screen output snapshots

**CI/CD:**
- CI pipeline (`.github/workflows/ci.yml`) — runs on every branch push and pull request: typecheck → test
- Release pipeline (`.github/workflows/release.yml`) — triggered on `v*.*.*` tags: typecheck → test → build → GitHub Release (auto-generated notes) → publish to GitHub Packages

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
- AI response validation (Zod) — same schema enforced for all 5 providers (Vercel AI SDK `generateText()` for 4 providers + Copilot SDK custom adapter)
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

### Global Settings Architecture

**Settings File Schema**

A single global settings file at `~/.brain-break/settings.json` stores user preferences that affect AI provider selection and all AI-generated content:

```jsonc
{
  "provider": "copilot",        // Enum: copilot | openai | anthropic | gemini | ollama — null on first launch
  "language": "English",        // Free-text — any language name
  "tone": "natural",            // Enum: natural | expressive | calm | humorous | sarcastic | robot | pirate
  "openaiModel": "gpt-4o-mini",           // OpenAI — preferred model name
  "anthropicModel": "claude-sonnet-4-20250514", // Anthropic — preferred model name
  "geminiModel": "gemini-2.0-flash",       // Gemini — preferred model name
  "ollamaEndpoint": "http://localhost:11434",  // Ollama only — endpoint URL
  "ollamaModel": "llama3"       // Ollama only — model name
}
```

**AI Provider Enum:**

| Value | Label | Auth Mechanism |
|---|---|---|
| `copilot` | GitHub Copilot | Copilot SDK auth (existing Copilot credentials) |
| `openai` | OpenAI | `OPENAI_API_KEY` env var |
| `anthropic` | Anthropic | `ANTHROPIC_API_KEY` env var |
| `gemini` | Google Gemini | `GOOGLE_API_KEY` env var |
| `ollama` | Ollama | Local endpoint (no API key) |

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

**Schema types:** `SettingsFileSchema` (Zod) and `SettingsFile` / `ToneOfVoice` / `AiProviderType` types live in `domain/schema.ts` alongside domain types. Factory function `defaultSettings()` returns `{ provider: null, language: 'English', tone: 'natural', openaiModel: 'gpt-4o-mini', anthropicModel: 'claude-sonnet-4-20250514', geminiModel: 'gemini-2.0-flash', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }`.

**Store functions:** `readSettings()` and `writeSettings()` in `domain/store.ts` follow the same atomic write-then-rename pattern. `readSettings()` returns `defaultSettings()` on ENOENT — no error propagated.

**Tone migration:** `store.ts` includes a migration layer that maps legacy tone values (`normal` → `natural`, `enthusiastic` → `expressive`) transparently on read. This ensures forward compatibility when the enum evolves.

**AI prompt injection:** `ai/prompts.ts` conditionally prepends a voice instruction to every prompt when language ≠ `"English"` or tone ≠ `"natural"` — e.g., `"Respond in Greek using a pirate tone of voice."`. The settings object is passed through from the screen layer to `ai/client.ts` to `ai/prompts.ts`.

**Settings screen:** `screens/settings.ts` provides a menu-driven loop where the user can change AI provider (select from 5 presets — triggers provider validation and, for OpenAI/Anthropic/Gemini, prompts for a preferred model name with a sensible default; entering an empty string resets to the default), language (free-text input), and tone (select from 7 presets). For Ollama, the user can also edit the endpoint URL and model name. GitHub Copilot does not prompt for a model. Save persists + returns to home; Back discards + returns to home.

**First-launch provider setup:** `screens/provider-setup.ts` displays a one-time provider selection screen on first launch (when `provider` is `null`). The user selects a provider via arrow keys; the app validates readiness:
- **Copilot:** checks Copilot authentication
- **OpenAI / Anthropic / Gemini:** checks for the corresponding env var (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`); if present, prompts for a preferred model name (pre-filled with the provider's default: `gpt-4o-mini` for OpenAI, `claude-sonnet-4-20250514` for Anthropic, `gemini-2.0-flash` for Gemini — entering an empty string resets to the default)
- **Ollama:** prompts for endpoint URL + model name, tests connection

If validation fails, the app displays what’s needed and proceeds to the home screen anyway — all features except Play are accessible. If validation succeeds, the provider is saved to `settings.json` and the app proceeds with full functionality. On subsequent launches, the saved provider is used automatically.

---

### Authentication & Security

- **Provider auth — delegated, never stored:**
  - GitHub Copilot: auth fully delegated to the Copilot SDK — no token management in the app
  - OpenAI / Anthropic / Gemini: API keys read from environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`) at runtime — never stored in `settings.json`, never prompted in-app
  - Ollama: local instance, no API key — endpoint URL and model name stored in settings
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

export type AiProviderType = 'copilot' | 'openai' | 'anthropic' | 'gemini' | 'ollama'

export function createProvider(settings: SettingsFile): Result<AiProvider>
export async function validateProvider(providerType: AiProviderType, settings: SettingsFile): Promise<Result<void>>
```

- `createProvider()` reads the `provider` field from settings, instantiates the corresponding adapter, and returns it wrapped in `Result<T>`. Returns an error if `provider` is `null`.
- For OpenAI, Anthropic, Gemini, and Ollama, the adapter uses the Vercel AI SDK `generateText()` function with the corresponding `@ai-sdk/*` provider package. This eliminates per-provider boilerplate — each adapter is a thin model selector (~5 lines).
- The Copilot adapter remains a custom implementation using `@github/copilot-sdk` directly, as the Vercel AI SDK does not support the Copilot SDK.
- All adapters share the same `AiProvider` interface — no provider-specific logic leaks into `client.ts` or screens.
- `validateProvider()` checks provider readiness without generating a question: Copilot auth check, env var existence, or Ollama endpoint reachability.

**Adapter Implementations (all in `ai/providers.ts`):**

| Provider | SDK/Method | Auth Check |
|---|---|---|
| Copilot | `@github/copilot-sdk` — `CopilotClient` + `createSession` + `sendAndWait` (custom adapter) | Copilot SDK auth |
| OpenAI | `ai` + `@ai-sdk/openai` — `generateText({ model: openai(modelId), prompt })` | `OPENAI_API_KEY` env var |
| Anthropic | `ai` + `@ai-sdk/anthropic` — `generateText({ model: anthropic(modelId), prompt })` | `ANTHROPIC_API_KEY` env var |
| Gemini | `ai` + `@ai-sdk/google` — `generateText({ model: google(modelId), prompt })` | `GOOGLE_API_KEY` env var |
| Ollama | Raw HTTP `fetch()` — `POST {endpoint}/api/generate` with `{ model, prompt, stream: false }` | Endpoint reachability |

**Vercel AI SDK usage example (OpenAI adapter):**

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const adapter: AiProvider = {
  async generateCompletion(prompt: string): Promise<string> {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    })
    return text
  },
}
```

The Anthropic, Gemini, and Ollama adapters follow the same pattern — only the model constructor and model ID differ.

**Response Validation**

- All providers return raw text (Vercel AI SDK's `generateText()` returns `{ text }` directly; Copilot custom adapter returns raw content); `ai/client.ts` strips JSON fences and validates with the same Zod `QuestionResponseSchema`
- Schema covers: `question` (string), `options` (A–D strings), `correctAnswer` (enum), `difficultyLevel` (1–5 int), `speedThresholds` (`{ fastMs: number, slowMs: number }`)
- Provider-agnostic: if any provider returns malformed JSON, the same `AI_ERRORS.PARSE` path is taken

**`ai/client.ts` Role (Refactored)**

`client.ts` no longer imports any provider SDK directly. It:
1. Calls `createProvider(settings)` to get the active adapter
2. Calls `provider.generateCompletion(prompt)` to get the raw response
3. Validates with Zod
4. Shuffles answer options via Fisher-Yates (using `crypto.randomInt` for unbiased distribution) to mitigate LLM positional bias toward option B; remaps `correctAnswer` to the new position
5. Returns `Result<Question>`
6. Classifies errors (auth/network/parse) and returns per-provider error messages

**Error Handling Strategy — No retry, fail-to-domain-menu**

| Error Type | Behaviour |
|---|---|
| No provider configured | Display: *“AI provider not ready. Go to Settings to configure.”* — return to domain sub-menu |
| Network/API unavailable | Display provider-specific network message — return to domain sub-menu |
| Authentication / API key failure | Display provider-specific auth message — return to domain sub-menu |
| Malformed response (Zod fail) | Display generic parse error — return to domain sub-menu |

No retry loop for MVP. The app remains running and the user can navigate to Settings to reconfigure.

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
  // Auth errors
  AUTH_COPILOT: 'Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in.',
  AUTH_OPENAI: 'OpenAI API key is invalid or missing. Set the OPENAI_API_KEY environment variable with a valid key and restart the app.',
  AUTH_ANTHROPIC: 'Anthropic API key is invalid or missing. Set the ANTHROPIC_API_KEY environment variable with a valid key and restart the app.',
  AUTH_GEMINI: 'Google API key is invalid or missing. Set the GOOGLE_API_KEY environment variable with a valid key and restart the app.',
  AUTH_OLLAMA: 'Could not connect to Ollama. Check that the endpoint and model are correct in Settings.',
} as const
```

---

### Terminal UI Architecture

**Navigation Pattern — Two-level menu with thin router**

No state machine framework. Navigation is explicit function calls dispatched from a `router.ts` module. The app uses a two-level menu model:

- **Level 1 — Home screen:** Lists active domains (with score/count) + actions: create domain, view archived, settings, buy me a coffee, exit
- **Level 2 — Domain sub-menu:** Selected from home; shows Play, View History, View Stats, Archive, Delete, Back

```
startup → readSettings()
  → provider === null         → router.showProviderSetup() → router.showHome()
  → provider !== null         → router.showHome()

router.showHome()
  → user creates domain     → router.showCreateDomain() → router.showHome()
  → user selects domain      → router.showDomainMenu(slug)
    → Play                   → router.showQuiz(slug) → router.showDomainMenu(slug)
    → View History            → router.showHistory(slug) → router.showDomainMenu(slug)
    → View Stats              → router.showStats(slug) → router.showDomainMenu(slug)
    → Archive                 → router.archiveDomain(slug) → router.showHome()
    → Delete                  → router.deleteDomain(slug) → router.showHome()
    → Back                    → router.showHome()
  → user views archived      → router.showArchived() → router.showHome()
  → user opens settings      → router.showSettings() → router.showHome()
  → user exits               → process.exit(0)
```

Each screen is a standalone `async` function that resolves when the user exits it. `router.ts` is the only place that calls other screens — screens never call each other directly.

*Rationale:* 10 screens with clear parent-child flows, no concurrent state. A full state machine would be abstraction for its own sake.

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

### Terminal UI Highlighting & Color System

All semantic coloring logic is centralised in `utils/format.ts`. No screen module defines its own color values.

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

**Additional format utilities:** `success()`, `error()`, `warn()`, `dim()`, `bold()`, `header()` chalk wrappers; `formatDuration(ms)`, `formatAccuracy(correct, total)`, `typewrite(text, delayMs)` animation.

**ANSI compatibility:** All color output uses standard 8/16-color ANSI escape codes as baseline (NFR 6). Extended color codes may be used where supported. Non-TTY output is out of scope.

---

### Coffee Supporter Screen

`screens/home.ts` exports `showCoffeeScreen()` — a dedicated screen that clears the terminal and displays an ASCII QR code (via `qrcode-terminal`) encoding the creator's Buy Me a Coffee URL, followed by the URL in plain text. A single Back action returns to the home screen. The coffee action is positioned between the archived domains separator and the Exit action on the home screen.

---

### Module Architecture

**`src/` Directory Structure**

```
src/
├── index.ts              # Entry point — bootstraps and calls router
├── router.ts             # Navigation between screens — 11 exported functions
├── screens/
│   ├── home.ts           # F1: domain list + coffee screen (F10)
│   ├── create-domain.ts  # F1: new domain input + validation + duplicate check
│   ├── domain-menu.ts    # F1: domain sub-menu (Play, History, Stats, Archive, Delete, Back)
│   ├── select-domain.ts  # F1/F2: motivational message + quiz transition
│   ├── archived.ts       # F1: archived domain list + unarchive
│   ├── quiz.ts           # F3: question loop, timer, answer feedback
│   ├── history.ts        # F6: single-question navigation history view
│   ├── stats.ts          # F7: stats dashboard
│   ├── settings.ts       # F8: language, tone & AI provider settings screen
│   ├── provider-settings.ts # F8: per-provider model/endpoint prompts with defaults
│   └── provider-setup.ts # F8: first-launch provider selection + validation
├── ai/
│   ├── client.ts         # F2: provider-agnostic AI client + error handling
│   ├── providers.ts      # F2: AiProvider interface + 5 adapters (4 via Vercel AI SDK + 1 custom Copilot)
│   └── prompts.ts        # F2: prompt templates + Zod response schema + voice injection
├── domain/
│   ├── store.ts          # F5: read/write domain + settings files (atomic)
│   ├── schema.ts         # F5/F8: types + Zod schemas (DomainFile, SettingsFile, AiProviderType, ToneOfVoice)
│   └── scoring.ts        # F4: score delta formula, difficulty progression
└── utils/
    ├── hash.ts           # SHA-256 hashing helpers
    ├── slugify.ts        # Domain name → file slug
    ├── screen.ts         # clearScreen() — viewport reset before every render
    └── format.ts         # F9: semantic color helpers, menuTheme, formatting utilities
```

**Dependency Rules:**
- `screens/` may import from `domain/`, `ai/`, and `utils/` — never the reverse
- `router.ts` may import from `screens/` only — never from `domain/` or `ai/` directly (exception: `router.ts` may import from `domain/store.ts` for archiveDomain/deleteDomain operations that are thin wrappers)
- `domain/store.ts` is the **only** module that writes to disk (domain files and settings)
- `ai/providers.ts` is the **only** module that imports provider SDKs (`@github/copilot-sdk`, `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) and makes raw HTTP calls (Ollama via `fetch()`)
- `ai/client.ts` is the **only** module that calls `createProvider()` and orchestrates AI completions — screens never call providers directly

### Decision Impact Analysis

**Implementation Sequence:**
1. Scaffold: `package.json`, `tsconfig.json`, directory structure
2. `domain/schema.ts` — define types and Zod schema first (everything else depends on this) — includes `AiProviderType`
3. `domain/store.ts` — atomic reads/writes
4. `utils/` — hash, slugify, screen, format
5. `ai/providers.ts` — `AiProvider` interface + 5 adapters (4 via Vercel AI SDK `generateText()` + 1 custom Copilot adapter)
6. `ai/prompts.ts` + `ai/client.ts` — provider-agnostic AI integration with Zod validation
7. `domain/scoring.ts` — scoring formula and difficulty logic
8. `screens/` — provider-setup, home, quiz, history, stats, settings
9. `router.ts` + `index.ts` — wire everything together (first-launch provider setup flow)

**Cross-Component Dependencies:**
- Schema types flow from `domain/schema.ts` → all modules (includes `AiProviderType`)
- `screens/quiz.ts` depends on both `domain/store.ts` and `ai/client.ts` — the two slowest paths
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
│   ├── index.ts                    # Entry: bootstraps app, reads settings, routes to provider setup or home
│   ├── router.ts                   # Navigation dispatcher — 11 exported functions, only file that calls screens
│   ├── screens/
│   │   ├── home.ts                 # F1/F10: domain list + coffee screen
│   │   ├── home.test.ts
│   │   ├── create-domain.ts        # F1: new domain input + validation + duplicate check
│   │   ├── create-domain.test.ts
│   │   ├── domain-menu.ts          # F1: domain sub-menu (Play, History, Stats, Archive, Delete, Back)
│   │   ├── domain-menu.test.ts
│   │   ├── select-domain.ts        # F1/F2: motivational message + quiz transition
│   │   ├── select-domain.test.ts
│   │   ├── archived.ts             # F1: archived domain list + unarchive
│   │   ├── archived.test.ts
│   │   ├── quiz.ts                 # F3: question loop, timer, answer feedback
│   │   ├── quiz.test.ts
│   │   ├── history.ts              # F6: single-question navigation history view
│   │   ├── history.test.ts
│   │   ├── stats.ts                # F7: stats dashboard
│   │   ├── stats.test.ts
│   │   ├── settings.ts             # F8: language, tone & AI provider settings screen
│   │   ├── settings.test.ts
│   │   ├── provider-settings.ts     # F8: per-provider model/endpoint prompts with defaults
│   │   ├── provider-settings.test.ts
│   │   ├── provider-setup.ts       # F8: first-launch provider selection + validation
│   │   └── provider-setup.test.ts
│   ├── ai/
│   │   ├── client.ts               # F2: provider-agnostic AI client + Result<T> error wrapping
│   │   ├── client.test.ts
│   │   ├── providers.ts            # F2: AiProvider interface + 5 adapters (4 via Vercel AI SDK + 1 custom Copilot)
│   │   ├── providers.test.ts
│   │   ├── prompts.ts              # F2: prompt templates + Zod QuestionResponseSchema + voice injection
│   │   └── prompts.test.ts
│   ├── domain/
│   │   ├── schema.ts               # F5/F8: DomainFile + SettingsFile + AiProviderType + ToneOfVoice types + Zod schemas
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
│       ├── format.ts               # F9: semantic color helpers, menuTheme, formatting utilities
│       └── format.test.ts
└── dist/                           # Compiled output — gitignored
```

### Architectural Boundaries

**External Boundaries (outside the process):**

| Boundary | Owner | Entry Point |
|---|---|---|
| AI Providers (Copilot, OpenAI, Anthropic, Gemini, Ollama) | `ai/providers.ts` | Only module that imports provider SDKs (Vercel AI SDK `generateText` + `@ai-sdk/*` for 4 providers; `@github/copilot-sdk` for Copilot); `ai/client.ts` orchestrates via `AiProvider` interface |
| File system (`~/.brain-break/`) | `domain/store.ts` | Only module that calls `fs.*` write operations |
| Terminal I/O (stdout/stdin) | `screens/*` + `router.ts` | `inquirer`, `ora`, `chalk` used only here; `utils/screen.ts` owns the viewport-clear primitive |

**Internal Boundaries:**
- `screens/` → may import from `domain/`, `ai/`, `utils/` — never the reverse
- `router.ts` → imports from `screens/` only — never from `domain/` or `ai/` directly (exception: `router.ts` may import from `domain/store.ts` for archiveDomain/deleteDomain operations that are thin wrappers)- `ai/client.ts` → imports from `ai/providers.ts` and `ai/prompts.ts` — never imports provider SDKs directly
- `ai/providers.ts` → the only module that imports provider SDKs (Vercel AI SDK + Copilot SDK); exports the `AiProvider` interface- `domain/scoring.ts` → pure computation, no imports from `screens/` or `ai/`
- `utils/` → no imports from any other `src/` directory

### Feature to Structure Mapping

| Feature | Primary Module(s) |
|---|---|
| F1 — Domain Management | `screens/home.ts`, `screens/create-domain.ts`, `screens/domain-menu.ts`, `screens/select-domain.ts`, `screens/archived.ts`, `domain/store.ts`, `utils/slugify.ts` |
| F2 — AI Question Generation | `ai/client.ts`, `ai/providers.ts`, `ai/prompts.ts`, `domain/scoring.ts` (difficulty input) |
| F3 — Interactive Quiz | `screens/quiz.ts`, `ai/client.ts`, `domain/store.ts`, `domain/scoring.ts` |
| F4 — Scoring System | `domain/scoring.ts` (pure logic), `domain/store.ts` (persist) |
| F5 — Persistent History | `domain/store.ts`, `domain/schema.ts` |
| F6 — View History | `screens/history.ts`, `domain/store.ts` |
| F7 — View Stats | `screens/stats.ts`, `domain/store.ts` |
| F8 — Global Settings | `screens/settings.ts`, `screens/provider-setup.ts`, `domain/store.ts` (readSettings/writeSettings), `domain/schema.ts` (SettingsFile/AiProviderType/ToneOfVoice), `ai/prompts.ts` (voice injection), `ai/providers.ts` (provider validation) |
| F9 — Color System | `utils/format.ts` (semantic color helpers, menuTheme) + all `screens/*.ts` (consumers) |
| F10 — Coffee Screen | `screens/home.ts` (showCoffeeScreen) |
| NFR 5 — Terminal Screen Mgmt | `utils/screen.ts` (primitive) + all `screens/*.ts` (consumers) |
| NFR 6 — Color Rendering | `utils/format.ts` (ANSI 8/16-color baseline) |

**Cross-Cutting Concern Mapping:**

| Concern | Location |
|---|---|
| SHA-256 deduplication | `utils/hash.ts` (compute) + `domain/store.ts` (persist hashes) |
| Adaptive difficulty | `domain/scoring.ts` → `applyAnswer()` |
| Atomic file write | `domain/store.ts` → `writeDomain()`, `writeSettings()` |
| AI error messages | `ai/client.ts` → `AI_ERRORS` constants (per-provider network + auth messages) |
| Domain slug derivation | `utils/slugify.ts` exclusively |
| Terminal screen clearing | `utils/screen.ts` → `clearScreen()` — called as first operation in every screen render path |
| Language & tone injection | `ai/prompts.ts` → voice instruction prepended to all AI prompts when non-default settings active |
| Provider abstraction | `ai/providers.ts` → `AiProvider` interface + 5 adapters (4 via Vercel AI SDK `generateText()` + 1 custom Copilot adapter); `ai/client.ts` → `createProvider()` factory |
| Semantic color vocabulary | `utils/format.ts` → `colorCorrect()`, `colorIncorrect()`, `colorSpeedTier()`, `colorDifficultyLevel()`, `colorScoreDelta()`, `menuTheme` |
| Settings tone migration | `domain/store.ts` → `migrateSettings()` — maps legacy tone values on read |

### Integration Points

**Data Flow — Question Cycle:**
```
screens/quiz.ts
  → domain/store.ts.readSettings()                     [reads ~/.brain-break/settings.json]
  → ai/client.ts.generateQuestion(domain, difficulty, hashes, prev, settings)
    → ai/providers.ts.createProvider(settings)          [instantiates active provider adapter]
    → ai/prompts.ts (prompt + voice injection)
    → provider.generateCompletion(prompt)               [calls active AI provider API]
    → ai/client.ts (strip fences + Zod parse + shuffle options)
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
    → router.showHome()
  → settings.provider !== null
    → router.showHome()
    → screens/home.ts
    → domain/store.ts.listDomains()                     [reads ~/.brain-break/]
    → renders domain list with scores
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

All technology choices are mutually compatible — Node.js v25.8.0, ESM, NodeNext, `inquirer` v12, `@inquirer/prompts`, `ora` v8, `chalk` v5, `zod`, `qrcode-terminal`, `ai` (Vercel AI SDK), `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@github/copilot-sdk`, and `vitest` are all ESM-native and internally consistent. The Vercel AI SDK unifies 3 of 5 provider adapters (OpenAI, Anthropic, Gemini) under a single `generateText()` interface; Ollama uses raw HTTP `fetch()` and Copilot uses a custom SDK adapter — reducing per-provider boilerplate and SDK version maintenance burden. The `Result<T>` error pattern, atomic write strategy, provider abstraction (`AiProvider` interface), and Zod validation approach are coherent and mutually reinforcing. The directory structure directly implements all dependency rules by design.

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
| F9 — Color System | ✅ | `utils/format.ts` (semantic helpers + menuTheme) |
| F10 — Coffee Screen | ✅ | `screens/home.ts` (showCoffeeScreen + qrcode-terminal) |

| NFR | Status | Addressed By |
|---|---|---|
| NFR 1 — ≤5s question generation | ✅ | `ora` spinner + `Result<T>` fast-fail path |
| NFR 2 — API error handling | ✅ | Per-provider `AI_ERRORS` constants + `Result<T>` in `ai/client.ts`; `NO_PROVIDER` guard for unconfigured state |
| NFR 3 — Data integrity / corruption | ✅ | Write-then-rename atomic + Zod schema on read + `defaultDomainFile()` on ENOENT |
| NFR 4 — ≤2s startup | ✅ | No heavy imports at startup; `meta`-first schema design |
| NFR 5 — Terminal screen management | ✅ | `utils/screen.ts` → `clearScreen()` called as first operation in every screen render path |
| NFR 6 — Terminal color rendering | ✅ | `utils/format.ts` → ANSI 8/16-color baseline; `chalk` handles terminal capability detection |

### Implementation Readiness Validation ✅

All critical decisions are documented with explicit versions. Patterns are comprehensive with concrete examples and anti-patterns. Project structure is fully specified with feature-to-file mapping. All potential AI agent conflict points have been addressed with clear enforcement guidelines.

**2026-03-17 update (multi-provider):** Architecture updated for multi-provider AI integration (PRD 2026-03-17). Copilot-only backend replaced with 5-provider abstraction. Added `ai/providers.ts`, `screens/provider-setup.ts`. Settings schema expanded with `provider`, `ollamaEndpoint`, `ollamaModel`. All sections updated: auth, API patterns, error handling, navigation, boundaries, enforcement, validation. PRD Feature 8 tone inconsistency flagged (4 vs 7 tones — architecture keeps 7).

**2026-03-17 update:** Architecture synced with PRD 2026-03-15 and implemented codebase — added Feature 8 (Global Settings), Feature 9 (Color System), Feature 10 (Coffee Screen), Feature 1 Delete action; expanded screen list to 9 modules; updated navigation model to two-level menu; added `qrcode-terminal` and `@inquirer/prompts` dependencies; updated all coverage and mapping tables.

**2026-03-14 update:** NFR 5 (Terminal Screen Management) added — `utils/screen.ts` is a new module; all `screens/*.ts` files must call `clearScreen()` as their first render operation. The screen-clearing pattern and enforcement rule are documented in the Terminal UI Architecture section above.

### Gap Analysis Results

**No critical gaps.** One important behaviour called out explicitly:

**Missing domain file = new domain (NFR 3):**
`domain/store.ts.readDomain()` MUST return a default value (not an error) when the target file does not exist. This "missing = clean start" behaviour is required by NFR 3.

**Resolution:** `domain/schema.ts` exports a `defaultDomainFile()` factory function returning a valid `DomainFile` at difficulty level 2, score 0, empty history and hashes. `store.ts.readDomain()` calls this on `ENOENT` — no error propagated to the caller.

**Missing settings file = defaults (F8):**
`domain/store.ts.readSettings()` MUST return `defaultSettings()` (`{ provider: null, language: 'English', tone: 'natural', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }`) when the settings file does not exist. No error propagated to the caller. A `null` provider triggers the first-launch Provider Setup screen.

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
- Provider abstraction isolates all SDK complexity in a single file (`ai/providers.ts`) — adding a new provider requires only implementing the `AiProvider` interface
- All state mutations flow through pure functions — easy to test, easy to reason about
- All I/O in two dedicated modules — security and integrity enforced in one place each
- `Result<T>` pattern eliminates entire category of unhandled exceptions in screens
- API keys never stored in settings — env vars only; Copilot auth delegated to SDK

**Areas for Future Enhancement (Post-MVP):**
- Fuzzy/similarity deduplication (explicitly noted in PRD)
- Startup optimisation: read only `meta` fields if history files grow large
- Retry with backoff on AI provider APIs
- Additional AI providers (e.g., Mistral, Groq)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently — refer to Enforcement Guidelines
- Respect module boundaries: `store.ts` owns all writes, `providers.ts` owns all SDK imports, `client.ts` orchestrates AI calls
- Always return `Result<T>` from I/O functions, never throw to callers
- Use `.js` extensions on all ESM imports
- Call `defaultDomainFile()` from `domain/schema.ts` on ENOENT in `store.ts.readDomain()`
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
