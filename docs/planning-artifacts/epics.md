---
stepsCompleted: [1, 2, 3, 4]
lastEdited: '2026-04-07'
status: 'complete'
editHistory:
  - date: '2026-04-07'
    changes: 'OpenAI Compatible API provider added as 6th provider: FR6 updated (provider list includes OpenAI Compatible API). FR15 updated (5→6 providers). FR17 updated (OpenAI Compatible API fields noted — no defaults, stored only when configured). FR26 updated (provider list includes OpenAI Compatible API). FR27 updated (OpenAI Compatible API validation: checks OPENAI_COMPATIBLE_API_KEY env var, prompts for endpoint URL and model name, tests connection). FR28 updated (OpenAI Compatible API endpoint/model editing added). FR30 updated (Ollama and OpenAI Compatible API errors include endpoint URL). NFR2 updated (network and auth error messages for OpenAI Compatible API). Epic 7 description updated (5→6 adapters, OpenAI Compatible API in provider list). Story 7.1 updated (AiProviderType union gains openai-compatible, SettingsFileSchema gains optional openaiCompatibleEndpoint/openaiCompatibleModel, backward compatibility list updated). Story 7.2 updated (6 adapters including OpenAI Compatible via @ai-sdk/openai-compatible, createProvider AC for openai-compatible, validateProvider AC for openai-compatible, test coverage 5→6 providers). Story 7.3 updated (AI_ERRORS gains NETWORK_OPENAI_COMPATIBLE and AUTH_OPENAI_COMPATIBLE, import restriction list gains @ai-sdk/openai-compatible). Story 7.4 updated (provider list 5→6, OpenAI Compatible API setup AC with endpoint/model prompts and env var check, test coverage 5→6). Story 7.5 updated (provider selector 5→6, OpenAI Compatible API editing AC, writeSettings persistence list, test coverage 5→6). Reflects PRD edits 2026-04-07 (OpenAI Compatible API provider).'
  - date: '2026-04-05'
    changes: 'Theme setting added: FR50 added (🌓 Theme toggle — Dark/Light, default Dark — controls color palette for readability on dark and light terminal backgrounds; stored as `theme` in settings.json; takes effect immediately). FR15 updated (Settings screen gains Theme toggle). FR17 updated (settings defaults expanded with `theme: "dark"`). FR21–FR23 updated with Dark/Light color variants (bold green, bold yellow, blue substitutions for Light theme). NFR6 updated (dual Dark/Light palette support). FR Coverage Map updated (FR50 → Epic 5, Epic 6). Epic 5 FRs covered updated (FR50 added). Epic 6 description and FRs covered updated (FR50, dual palette, NFR6). Story 5.1 schema updated with `theme` field and default. Story 5.2 settings screen updated with Theme toggle. Story 6.1 rewritten as theme-aware semantic color helpers with Dark/Light branching for all helpers. Story 6.3 test coverage updated for both themes. Story 6.4 added (Theme-Aware Gradient Colors — gradient endpoints adapt per theme for Welcome/Exit/Banner/ASCII Art screens). Story 7.1 defaultSettings() updated with `theme: "dark"`. Reflects PRD edit 2026-04-05 (Feature 8, Feature 9 Theme support).'
  - date: '2026-04-05'
    changes: 'Answer verification redesign synced from PRD: FR6 now defines a fail-closed approval gate where generation returns question text plus four options, verification returns explicit `correctAnswer` and `correctOptionText`, and the app accepts questions only when those values align locally. FR44 and Story 11.2 updated for the same bounded verification budget during Challenge preload. Story 3.1 generation schema and Story 3.5 verification flow rewritten around 3 total candidate attempts (initial attempt + 2 retries) with no fail-open passthrough.'
  - date: '2026-04-04'
    changes: 'Provider Setup skip option: FR26 updated (provider list now ends with a line separator and ⏭️ Skip — set up later in ⚙️ Settings option). FR27 updated (validation failure now offers 🔄 Retry and ⏭️ Skip options instead of proceeding automatically; Skip saves provider: null). Story 7.4 ACs updated (skip option in provider list, skip AC, retry/skip on failure for OpenAI and Ollama paths, test coverage updated). Story 7.6 ACs updated (skip-after-failure and skip-from-list routing both save null provider and call showHome). Reflects PRD edit 2026-04-04 (Feature 8 First-Launch Provider Setup skip option).'
  - date: '2026-04-04'
    changes: 'ASCII Art Milestone setting: FR49 added (configurable milestone threshold with three options — 0, 10, 100 — default 100; stored as asciiArtMilestone in settings.json). FR3 updated (ASCII Art label references configurable threshold via FR49). FR48 updated (milestone-gated behind configurable threshold instead of hardcoded 100). FR15 updated (Settings screen gains ASCII Art Milestone selector). FR17 updated (settings defaults expanded with asciiArtMilestone: 100). FR Coverage Map updated (FR49 → Epic 5, Epic 12). Epic 12 description and FRs covered updated. Story 12.3 added (ASCII Art Milestone Setting). Reflects PRD edit 2026-04-04 (Feature 8 and Feature 18 configurable threshold).'
    changes: 'ASCII Art milestone unlock gating: FR48 updated (ASCII Art locked behind 100 cumulative correct answers per domain; domain sub-menu label shows gradient progress bar when locked, sparkle when unlocked; locked screen shows motivational message with progress bar; unlocked screen renders FIGlet art as before). FR3 updated (ASCII Art label dynamic with unlock status). FR Coverage Map FR48 description updated. Epic 12 description and Story 12.1 ACs updated with locked/unlocked states. Reflects PRD edit 2026-04-03 (Feature 18 milestone unlock).'
  - date: '2026-04-03'
    changes: 'Duplicate domain name validation added: FR47 added to Requirements Inventory (slugified comparison against active and archived domains with context-specific messages). FR Coverage Map updated (FR47 → Epic 2). Epic 2 FRs covered updated to include FR47. Story 2.2 duplicate AC replaced — previously a single vague AC ("informs me the domain already exists and returns to home screen"); now two explicit ACs: active duplicate shows "already exists" and returns to name prompt; archived duplicate shows "already exists in your archived domains" and returns to name prompt. Both cases keep the user in the create flow. Reflects PRD edit 2026-04-03 (Feature 1 duplicate-domain validation).'
  - date: '2026-04-01'
    changes: 'Label alignment pass (synced with PRD 2026-04-01 update): Domain sub-menu actions renamed from "View History" / "View Bookmarks" / "View Stats" to "History" / "Bookmarks" / "Statistics". Home screen "View archived domains" renamed to "Archived domains". Settings "Question Language" shortened to "Language". Sprint setup "Time budget" / "Question count" renamed to "Sprint duration" / "Sprint size". FR8/FR35 post-answer option order corrected to Explain → Bookmark → Next → Back. FRs updated: FR3, FR5, FR8, FR15, FR35, FR39, FR43, FR44. FR Coverage Map updated. Epic descriptions updated: Epic 2, 5, 10, 11. Story ACs updated: 2.1, 2.4, 2.5, 4.1, 4.2, 5.2, 7.5, 9.x session summary, 10.4, 11.1, 11.3. Historical editHistory entries preserved as-is.'
  - date: '2026-04-02'
    changes: 'Model selection UX updated: for hosted providers (OpenAI, Anthropic, Gemini), model input changed from free-text prompt to a select box with 3 predefined models per provider (Fast / Normal / Complex) plus a "🧙 Custom model" free-text option and a "↩️ Back" option. Default Anthropic model changed from `claude-sonnet-4.6-latest` to `claude-opus-4-6`. FR17 defaults updated. FR27 and FR28 model prompt descriptions updated. Story 7.1 defaultSettings() AC updated. Story 7.4 OpenAI/Anthropic/Gemini model prompt ACs updated. Story 7.5 model prompt AC updated.'
  - date: '2026-03-31'
    changes: 'Feature 17 (Challenge Mode — Sprint) added: FR44 (Sprint Setup Screen — Challenge action in domain sub-menu, sprint setup screen with time budget and question count presets, Confirm/Back, question preloading with dedup and self-consistency rules), FR45 (Sprint Execution — visible countdown timer that never pauses, limited post-answer nav to Next/Back only, per-question speed tier by individual answer time), FR46 (Sprint Termination & History — four termination conditions, auto-submit on timer expiry, only answered questions in history, preloaded unanswered questions discarded, sprint result in session summary). FR3 updated (Challenge added to domain sub-menu actions). FR39 updated (Sprint result field 9 added to session summary for Challenge sessions). FR Coverage Map updated (FR44/45/46 → Epic 11, FR3/FR39 cross-reference updated). Epic 11 (Challenge Mode — Sprint) added with 4 stories (11.1–11.4). Epic 2 and Epic 9 headers updated with Challenge Mode references.'
  - date: '2026-03-30'
    changes: 'FR41-FR43 added (Question Bookmarking): FR41 — bookmarked boolean field on question records, toggleable from quiz/history/bookmarks. FR42 — Bookmark/Remove bookmark option in quiz post-answer and history navigation with ⭐ indicator. FR43 — View Bookmarks screen in domain sub-menu with navigation identical to View History. FR3 updated (View Bookmarks added to sub-menu actions). FR8 updated (4 post-answer options including Bookmark). FR11 updated (bookmarked field). FR12 updated (Bookmark in history navigation + ⭐ indicator). FR35 updated (Bookmark in post-explanation quiz nav). FR37 updated (Bookmark in post-explanation history nav). NFR5 updated (bookmarks navigation in screen list). FR Coverage Map updated (FR41 → Epic 10/3/4, FR42 → Epic 3/4/10, FR43 → Epic 10). Epic 2 description and Story 2.5 updated with View Bookmarks. Epic 3 FRs updated (FR41, FR42 added). Epic 4 FRs updated (FR42 added). Stories 3.3, 3.4, 3.8, 4.3, 4.4 ACs updated with Bookmark navigation. Epic 10 (Question Bookmarking) added with 4 stories (10.1-10.4).'
  - date: '2026-03-30'
    changes: 'PRD sync for Exit Message and settings toggle rename: FR40 added (Exit Message screen shown on explicit home Exit when showWelcome=true; skipped when false). FR3 updated with conditional Exit behavior. FR15 and FR33 updated to rename settings label to "🎬 Welcome & Exit screen". FR32 updated so showWelcome=false skips both welcome and exit branded screens. NFR5 updated to include Exit Message screen and clearScreen() exception list (Welcome/Exit/Provider Setup). FR and NFR Coverage Maps updated (FR40 → Epic 8). Epic 8 updated and Story 8.3 (Exit Message) added.'
  - date: '2026-03-29'
    changes: 'FR39 added (Session Summary): after a quiz session ends, the domain sub-menu renders a one-time ephemeral session summary block between the domain header and the action menu — displaying score delta, questions answered, correct/incorrect split, accuracy, fastest/slowest answer times, session duration, and difficulty change. FR3 updated (post-quiz return now includes session summary reference). FR Coverage Map updated with FR39 → Epic 9. Epic 9 (Session Summary) added with 1 story (9.1: Session Summary Display). Reflects PRD Feature 14 (2026-03-29).'
  - date: '2026-03-28'
    changes: 'FR38 added (Explanation Drill-Down): after viewing an AI explanation in both quiz and history, user can select \"Teach me more\" to get a micro-lesson on the underlying concept. FR8 updated (\"Exit quiz\" → \"Back\"). FR35 updated (post-explanation prompt expanded to Teach me more/Next/Back; \"Exit quiz\" → \"Back\"). FR37 updated (post-explanation navigation expanded to include Teach me more). FR Coverage Map updated with FR38 → Epic 3, Epic 4. Epic 3 and Epic 4 FRs covered updated. Story 3.4 and Story 4.3 ACs updated with Teach me more and Back references. Story 3.8 (Explanation Drill-Down — Quiz) added to Epic 3. Story 4.4 (Explanation Drill-Down — History) added to Epic 4. Reflects PRD Feature 13 (2026-03-28).'
  - date: '2026-03-28'
    changes: 'FR37 added (Explain Answer from History): history navigation includes an Explain answer option that uses the same AI explain flow as Feature 3. FR12 updated (navigation expanded to Previous/Next/Explain answer/Back). FR Coverage Map updated with FR37 → Epic 4. Epic 4 description and FRs covered updated. Story 4.3 (Explain Answer from History) added to Epic 4. Reflects PRD Feature 6 update (2026-03-28).'
  - date: '2026-03-25'
    changes: 'Source code alignment pass: Story 3.1 rewritten — Copilot-only SDK integration replaced with provider-agnostic AI client using createProvider(settings). Story 3.3 ACs updated — per-provider error constants (AI_ERRORS.NETWORK_<PROVIDER>/AUTH_<PROVIDER>) replace flat NETWORK/AUTH errors; error returns user to domain sub-menu instead of exiting app. Story 4.1 rewritten — paginated 10-per-page history replaced with single-question navigation (Previous/Next/Back controls, progress indicator). Story 5.1 tone enum updated from 4 values (normal, enthusiastic, robot, pirate) to 7 (natural, expressive, calm, humorous, sarcastic, robot, pirate); default tone "normal" → "natural". Story 5.2 tone selector list updated to match 7 tones. Story 5.3 neutral case tone reference "normal" → "natural". FR27 and Stories 7.2/7.4 Gemini env var corrected from GOOGLE_API_KEY to GOOGLE_GENERATIVE_AI_API_KEY. Story 8.1 tagline styling corrected from bold yellow to styled line with bold cyan > / dim white typewriter text / bold cyan _ per FR31.'
  - date: '2026-03-25'
    changes: 'FR13 updated: stats dashboard now includes starting difficulty level. Story 4.2 user story and ACs updated to display starting difficulty alongside current difficulty. Reflects GitHub issue #46.'
  - date: '2026-03-25'
    changes: 'FR2 updated: create-domain flow now includes a starting difficulty selection step (1–5, default level 2) after entering the domain name. Corrected to match implementation (prompt text is `New domain name:`, back via Save/Back nav menu). FR7 updated — new domains start at the user-selected level instead of always level 2. Domain Data Schema note updated (defaultDomainFile accepts optional startingDifficulty). Story 2.2 ACs updated with difficulty selection step and Save/Back navigation. Reflects GitHub issue #46.'
  - date: '2026-03-26'
    changes: 'FR36 added (Unified Question Detail Rendering): a shared renderQuestionDetail() function in utils/format.ts becomes the sole renderer for the quiz post-answer feedback options/result block and the history question detail block. History display updated to match quiz feedback layout. showTimestamp option added for history-only timestamp rendering. Story 3.7 (Unified Question Detail Rendering) added to Epic 3. FR Coverage Map updated FR36 → Epic 3. Reflects GitHub issue #52.'
  - date: '2026-03-25'
    changes: 'FR8 updated: post-answer feedback now renders on the same screen as the quiz question — no terminal clear between question and feedback. NFR5 updated to exclude post-answer feedback from full terminal reset list. Story 3.3 ACs updated (no clearAndBanner between question and feedback). Story 1.6 AC updated (quiz post-answer feedback renders inline). Reflects GitHub issue #50.'
  - date: '2026-03-25'
    changes: 'FR35 added (Explain Answer): post-answer feedback now offers "Explain answer" option that calls AI to explain the correct answer. FR8 updated (post-answer prompt includes Explain option). FR18 updated (answer explanations included in language/tone injection). FR Coverage Map updated with FR35 → Epic 3. Story 3.4 (Answer Explanation) added to Epic 3. Reflects GitHub issue #48.'
  - date: '2026-03-25'
    changes: 'FR31 updated: welcome screen subtitle changed from bold-yellow tagline ("Train your brain, one question at a time!") to styled line (`> Train your brain, one question at a time_`) where `>` is cyan and `_` is magenta. Epic 8 story descriptions unaffected. Reflects GitHub issue #47 (implemented and closed).'
  - date: '2026-03-23'
    changes: 'Welcome Screen & Static Banner: FR31–FR34 added (Welcome Screen on launch, showWelcome setting, Welcome Screen settings toggle, Static Banner via clearAndBanner). FR15 updated (Settings screen adds Welcome Screen toggle). FR17 updated (settings defaults expanded with showWelcome: true). NFR5 updated (banner rendering after terminal reset on all screens except Welcome/Provider Setup). FR Coverage Map updated with FR31–FR34. Epic 8 (Welcome Screen & Static Banner) added with 2 stories (8.1–8.2). Final validation passed — 34/34 FRs + 6/6 NFRs covered across 8 epics, 30 stories.'
  - date: '2026-03-22'
    changes: 'Per-provider model selection: FR17 updated (settings defaults expanded with openaiModel, anthropicModel, geminiModel); FR27 updated (hosted providers prompt for model name with defaults); FR28 updated (hosted provider model editing with empty-string-resets-to-default); FR Coverage Map FR28 updated; Story 7.1 ACs updated with per-provider model fields and defaults; Story 7.4 ACs updated with model prompt on hosted provider selection; Story 7.5 ACs updated with model editing for hosted providers.'
  - date: '2026-03-21'
    changes: 'Multi-provider sync: FR6 updated (Copilot-only → 5-provider abstraction); FR12 updated (paginated → single-question navigation); FR15 updated (4 tones → 7 tones + AI Provider selector); FR17 updated (settings defaults expanded with provider, ollamaEndpoint, ollamaModel); NFR2 updated (per-provider error messages); FR26–FR30 added (Provider Setup screen, provider validation, Settings provider selector, no-provider guard, per-provider errors); FR/NFR coverage maps updated; Epic 7 (Multi-Provider AI Integration) added with 6 stories (7.1–7.6): Settings Schema Provider Fields, AI Provider Abstraction Layer, Provider-Agnostic AI Client, First-Launch Provider Setup Screen, Settings Screen Provider Configuration, Router & Startup Flow Provider Setup Wiring. Final validation passed — 30/30 FRs + 6/6 NFRs covered across 7 epics, 28 stories.'
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

FR2: Users can create a new domain at any time from the home screen by typing any free-text topic name; the name is slugified and saved as a new domain file. After entering the domain name, the user selects a starting difficulty level via arrow key navigation from labeled options (1 — Beginner, 2 — Elementary, 3 — Intermediate, 4 — Advanced, 5 — Expert; default: 2 — Elementary). The selected difficulty becomes the domain's initial `difficultyLevel`. The create-domain screen shows an input prompt followed by a Save/Back navigation menu; pressing Ctrl+C or selecting Back returns the user to the home screen without creating a domain.

FR3: Selecting an active domain from the home screen opens a domain sub-menu. The sub-menu prompt header displays the domain name, current score, and total questions answered (refreshed each time). Available actions: Play, Challenge, History, Bookmarks, Statistics, ASCII Art, Archive, Delete, and Back. The ASCII Art label dynamically reflects the domain's unlock status: when the domain has fewer correct answers than the configured ASCII Art Milestone threshold (FR49, default: 100), the label shows a cyan-to-magenta gradient progress bar with percentage (e.g., `ASCII Art [████░░░░░░] 42%`); when the domain has reached the threshold, the label shows `ASCII Art ✨`. Selecting Play displays a contextual motivational message (if the user returned within 7 days or score is trending upward), then begins the quiz. Selecting Challenge opens the sprint setup screen (see FR44). Selecting ASCII Art opens the milestone-gated ASCII Art screen (see FR48). After a quiz or challenge sprint session ends, the user returns to the domain sub-menu; on this first re-render, a session summary block is displayed between the domain header and the action menu (see FR39). On the home screen, selecting Exit follows `showWelcome`: if `true`, the app shows the branded Exit Message screen (FR40) before terminating; if `false`, the app terminates immediately.

FR4: Domains can be archived from the domain sub-menu — archived domains are removed from the active list but all their history, score, and progress are fully preserved. Archiving returns the user to the home screen.

FR5: The home screen includes an "Archived domains" action that opens the archived list, where the user can unarchive any domain to resume exactly where they left off.

FR6: Questions are generated on demand via the user's configured AI provider (OpenAI, Anthropic, Google Gemini, GitHub Copilot SDK, Ollama, or OpenAI Compatible API) as multiple-choice (4 options: A–D). The generation prompt returns question text plus four answer options, difficulty level, and speed thresholds; it does not provide the trusted answer key. A second verification prompt independently returns `correctAnswer` and `correctOptionText`, and the app accepts the question only when those two values align locally on the same option. Verification is fail-closed with a bounded budget of 3 candidate attempts total (initial attempt + 2 retries); if no verified answer is obtained, the question is rejected. Questions never repeat within a domain — SHA-256 deduplication is persisted across all sessions.

FR7: Difficulty adapts automatically on a 5-level scale: 3 consecutive correct answers increases difficulty by 1 (max level 5); 3 consecutive wrong answers decreases it by 1 (min level 1). New domains start at the difficulty level selected during domain creation (default: level 2). Difficulty and streak counter persist across sessions per domain.

FR8: Questions are displayed one at a time in the terminal. A silent timer starts when the question is displayed and stops when the user submits their answer. After answering, the post-answer feedback is rendered on the same screen as the original question — no terminal clear or screen transition occurs. The user sees the question text, answer options, their chosen answer, and all feedback together: correct/incorrect status, the right answer if they were wrong, time taken, speed tier (fast/normal/slow), and score delta. The post-answer prompt offers four options: Explain answer, Bookmark (or Remove bookmark if already bookmarked), Next question, and Back.

FR9: Score is per-domain, cumulative, and never resets. Score delta = base points × speed multiplier (rounded to nearest integer). Base points by difficulty: L1=10, L2=20, L3=30, L4=40, L5=50. Speed multipliers: Fast+Correct=×2, Normal+Correct=×1, Slow+Correct=×0.5, Fast+Incorrect=−1×, Normal+Incorrect=−1.5×, Slow+Incorrect=−2×.

FR10: All domain data (score, difficulty level, streak, total time played, complete question history) persists locally in ~/.brain-break/<domain-slug>.json across sessions. Each domain's state is fully isolated.

FR11: Every answered question is recorded with: question text, all answer options, the user's chosen answer, correct answer, whether it was correct, timestamp (ISO 8601), time taken (ms), speed tier, score delta, difficulty level, and bookmarked status (boolean, default: false).

FR12: Users can view their full question history for the active domain using single-question navigation with Previous/Next/Explain answer/Bookmark (or Remove bookmark)/Back controls and a progress indicator (e.g., "Question 3 of 47"), displaying all fields recorded per question. Bookmarked questions display a ⭐ indicator next to the question text.

FR13: Users can view a stats dashboard for the active domain showing: current score, total questions answered, correct/incorrect count and accuracy %, total time played, starting difficulty level, current difficulty level, score trend over the last 30 days (growing/flat/declining), days since first session, and current return streak.

FR14: The home screen includes a Settings action positioned above the "Buy me a coffee" action.

FR15: The Settings screen allows configuring: AI Provider (selectable from 6 providers: OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama, OpenAI Compatible API), Language (free-text entry), Tone of Voice (selectable from 7 presets: Natural, Expressive, Calm, Humorous, Sarcastic, Robot, Pirate), ASCII Art Milestone (selectable from 3 options: Instant/0, Quick/10, Classic/100; default: Classic), Theme (toggle: Dark/Light; default: Dark), and Welcome & Exit Screen toggle (ON/OFF).

FR16: Settings are global — they apply to all domains and all AI-generated content (questions, answer options, motivational messages).

FR17: Settings persist between sessions in a global settings file at `~/.brain-break/settings.json`. Defaults on missing file: `{ provider: null, language: "English", tone: "natural", openaiModel: "gpt-5.4", anthropicModel: "claude-opus-4-6", geminiModel: "gemini-2.5-pro", ollamaEndpoint: "http://localhost:11434", ollamaModel: "llama4", asciiArtMilestone: 100, theme: "dark", showWelcome: true }`. OpenAI Compatible API fields (`openaiCompatibleEndpoint`, `openaiCompatibleModel`) are stored only when the user configures them — no defaults are applied.

FR18: Every AI call (questions, motivational messages, answer explanations) injects the active language and tone from global settings — generated content renders in the configured language and voice.

FR19: Settings screen provides Save (persist + return home) and Back (discard changes + return home) navigation.

FR20: All interactive menus render the focused item with inverted foreground/background colors (white text on colored background); unfocused items render in default terminal colors. Applies to: home screen, domain sub-menu, settings screen, archived domains list, history navigation controls, and post-quiz navigation.

FR21: Post-answer feedback colors: correct answer = green (Dark) / bold green (Light); user's wrong answer = red; correct answer reveal = green (Dark) / bold green (Light); score delta positive = green (Dark) / bold green (Light); score delta negative = red.

FR22: Speed tier badge colors: Fast = green (Dark) / bold green (Light), Normal = yellow (Dark) / yellow bold (Light), Slow = red.

FR23: Difficulty level badge colors: L1 = cyan (Dark) / blue (Light), L2 = green (Dark) / bold green (Light), L3 = yellow (Dark) / yellow bold (Light), L4 = magenta, L5 = red.

FR24: Users can permanently delete a domain from the domain sub-menu. Selecting Delete presents a blocking confirmation dialog ("Delete '[domain]' permanently? This cannot be undone.") — confirming permanently removes the domain file and all associated data (history, score, progress) with no recovery path and returns the user to the home screen; declining returns the user to the domain sub-menu.

FR25: The home screen includes a "☕ Buy me a coffee" action positioned between the archived domains separator and the Exit action. Selecting it opens a dedicated screen displaying an ASCII QR code (small, indented) encoding the creator's support URL and the URL in plain text, with a single Back action that returns the user to the home screen.

FR26: On first launch (no `settings.json` exists), a one-time Provider Setup screen appears before the home screen. The user selects an AI provider from a fixed list (OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama, OpenAI Compatible API) using arrow key navigation — followed by a line separator and a **⏭️ Skip — set up later in ⚙️ Settings** option. Selecting Skip saves settings with `provider: null`, skips the connection test entirely, and navigates directly to the home screen.

FR27: After provider selection on the Provider Setup screen, the app validates provider readiness: GitHub Copilot checks authentication; OpenAI/Anthropic/Gemini check for the corresponding environment variable (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`) and present a select box with 3 predefined models (labelled Fast / Normal / Complex) plus a "🧙 Custom model" option for free-text entry and a "↩️ Back" option (default models: `gpt-5.4` for OpenAI, `claude-opus-4-6` for Anthropic, `gemini-2.5-pro` for Gemini); Ollama prompts for endpoint URL and model name and tests connection; OpenAI Compatible API checks for the `OPENAI_COMPATIBLE_API_KEY` environment variable and prompts for endpoint URL and model name (both free-text, required) and tests connection. If validation fails, the app displays a provider-specific error message and offers **🔄 Retry** and **⏭️ Skip** options — selecting Retry re-runs the connection test for the same provider; selecting Skip saves settings with `provider: null` and proceeds to the home screen (all features except Play are accessible). If validation succeeds, the provider is saved to `settings.json` and the app proceeds with full functionality. On subsequent launches, the saved provider is used automatically.

FR28: The Settings screen includes an AI Provider selector that allows the user to change providers at any time. Selecting a provider triggers the same validation logic as first-launch setup. For OpenAI, Anthropic, and Google Gemini, the user is presented with a select box offering 3 predefined models (labelled Fast / Normal / Complex) plus a "🧙 Custom model" option for free-text entry and a "↩️ Back" option (default models: `gpt-5.4` for OpenAI, `claude-opus-4-6` for Anthropic, `gemini-2.5-pro` for Gemini). For Ollama, the user can edit the endpoint URL and model name. For OpenAI Compatible API, the user can edit the endpoint URL and model name — both are free-text with no defaults; the API key is read from the `OPENAI_COMPATIBLE_API_KEY` environment variable. GitHub Copilot does not prompt for a model. API keys are never entered in-app — they are read from environment variables at runtime. Changing providers takes effect on the next AI call.

FR29: If no provider is configured or the configured provider is unreachable, Play displays: "AI provider not ready. Go to Settings to configure." and returns the user to the domain sub-menu. All other app features remain functional.

FR30: All AI provider error messages are provider-specific: network errors identify the specific provider and suggest checking the connection; authentication errors include the specific environment variable name or auth mechanism; Ollama and OpenAI Compatible API errors include the configured endpoint URL. The app remains running after any AI error and the user can navigate to Settings to reconfigure.

FR31: On every launch where the `showWelcome` setting is `true` (default), a Welcome Screen is displayed after the Provider Setup screen (if shown) and before the home screen. The Welcome Screen shows: the app emoji branding (`🧠🔨`), a gradient-colored ASCII art rendering of "Brain Break" (cyan-to-magenta row interpolation; bold cyan fallback on limited terminals), a styled subtitle (`> Train your brain, one question at a time_`) where `>` is rendered in cyan and `_` is rendered in magenta, the current version number (dim white), and a gradient shadow bar. The user dismisses the screen by pressing Enter. Ctrl+C exits the app cleanly.

FR32: The `showWelcome` setting is a boolean (default: `true`) stored in `~/.brain-break/settings.json`. When `false`, both branded screens are skipped: the Welcome Screen on launch and the Exit Message on explicit home-screen Exit.

FR33: The Settings screen includes a "🎬 Welcome & Exit screen" toggle (displayed as ON/OFF) that controls the `showWelcome` setting for both branded screens. Toggling it takes immediate effect in-memory and is persisted on Save.

FR34: Every screen in the app (except the Welcome Screen and Provider Setup screen) renders a persistent static banner at the top after clearing the terminal. The banner displays `🧠🔨 Brain Break` in bold text followed by a cyan-to-magenta gradient shadow bar, rendered via a shared `clearAndBanner()` utility. The Welcome Screen and Provider Setup screen use `clearScreen()` instead (no banner) because they render their own branded layout.

FR35: After answering a quiz question and viewing the feedback panel, the user is presented with four options: Explain answer, Bookmark (or Remove bookmark if already bookmarked), Next question, and Back. Selecting "Explain answer" calls the AI provider with the question context (question text, all options, correct answer, and the user's chosen answer) to generate a concise explanation (2–4 sentences) of why the correct answer is correct — optionally noting why common wrong choices are incorrect. The explanation is displayed inline below the feedback panel using the active language and tone settings, with a loading spinner shown during generation. After the explanation is displayed, the user sees a four-option prompt: Teach me more, Bookmark (or Remove bookmark), Next question, and Back (Explain is not offered again for the same question). If the AI explanation call fails, a non-critical warning is displayed and the user is returned to the Next/Bookmark/Back prompt without interrupting the quiz session.

FR36: The post-answer options/result block in the quiz session and the question detail block in the history screen are rendered by a single shared function `renderQuestionDetail(record: QuestionRecord, opts?: { showTimestamp?: boolean })` exported from `utils/format.ts`. The function renders in order: all four answer options (A–D) with `►` marking the user's answer, a blank separator line, correct/incorrect status, the correct answer reveal when the user was wrong (highlighted in green), a compound time/speed/difficulty line, and a score delta line. When `opts.showTimestamp` is `true`, an answered-at timestamp line is appended (used by history only). The quiz post-answer screen calls `renderQuestionDetail(record)` without a timestamp. The history detail view prints the question text as a plain (non-bold, non-numbered) line and calls `renderQuestionDetail(record, { showTimestamp: true })`. The private `showAnswerOptions()` and `showFeedback()` functions in `screens/quiz.ts` and the body of `displayEntry()` options/result block in `screens/history.ts` are replaced by calls to this shared function. The `globalIndex` parameter is removed from `displayEntry()` since numbered headers are no longer rendered.

FR37: The history navigation screen includes an "Explain answer" option that calls the AI provider to generate a concise explanation (2–4 sentences) of why the correct answer is correct — using the same explain flow as the quiz (Feature 3) with the active language and tone settings. The explanation is displayed inline on the same screen as the question detail. While the explanation is visible, the navigation menu shows Teach me more, Previous, Next, Bookmark (or Remove bookmark), and Back (Explain is hidden). If the user navigates away and returns to the same question, Explain answer is available again. If the AI call fails, a non-critical warning is displayed and the user returns to the navigation menu.

FR38: After an AI-generated explanation is displayed — in both the quiz post-answer flow (Feature 3) and history navigation (Feature 6) — the user is presented with a "Teach me more" option alongside the existing navigation controls. Selecting "Teach me more" calls the AI provider to generate a concise micro-lesson (~1-minute read, 3–5 paragraphs) on the underlying concept behind the question — going deeper than the initial explanation to cover foundational principles, related concepts, and practical context. The micro-lesson is displayed inline below the explanation on the same screen using the active language and tone settings, with a loading spinner during generation. After the micro-lesson is displayed, "Teach me more" is removed from the navigation controls. If the user navigates away and returns to the same question, "Teach me more" is available again only after selecting "Explain answer" again — micro-lesson availability follows explanation availability. If the AI call fails, a non-critical warning is displayed and the user is returned to the navigation controls.

FR39: After a quiz session or challenge sprint ends and the user is returned to the domain sub-menu, a one-time session summary block is displayed between the domain header and the action menu. The summary is ephemeral — it appears only on the first render of the domain sub-menu immediately after a session; navigating to History, Statistics, or any other screen and returning does not re-display it; re-entering the domain from the home screen does not re-display it. A session is defined as the period from selecting Play (or confirming sprint setup) to selecting Back — every session with at least one answered question produces a summary. The summary displays: score delta (green if positive, red if negative), questions answered (shown as `X / N` for sprint sessions, e.g. `7 / 10`), correct/incorrect split, accuracy %, fastest answer time (green), slowest answer time (red), session duration (using the same `formatTotalTimePlayed` format as the stats dashboard), and difficulty change (starting → ending level with ▲/▼/— indicator using `colorDifficultyLevel`). For Challenge Mode sprint sessions, a ninth field **Sprint result** is appended: `Completed X / N questions` in green when all N questions were answered, or `Time expired — X / N questions answered` in red when the timer ran out. The summary block is framed by dim horizontal divider lines and renders on the domain sub-menu screen using the standard `clearAndBanner()` flow.

FR40: The app has a branded Exit Message screen shown only on explicit home-screen Exit when `showWelcome` is `true`. The screen uses `clearScreen()` (not `clearAndBanner()`) and renders the same visual language as the Welcome Screen: app emoji branding, gradient ASCII art "Brain Break" (cyan→magenta with bold-cyan fallback on limited terminals), styled subtitle `> Train your brain, one question at a time_`, version in dim white, and gradient shadow bar. Interaction model: auto-exit after 3 seconds with exit code 0; Enter exits immediately; Ctrl+C exits immediately. When `showWelcome` is `false`, explicit Exit terminates immediately without showing this screen.

FR41: Every answered question record includes a `bookmarked` boolean field (default: `false`). Users can toggle this field from the quiz post-answer screen, the history navigation screen, and the bookmarks navigation screen. Toggling a bookmark updates the question record in the domain JSON file immediately and persists across sessions.

FR42: The quiz post-answer screen and post-explanation navigation include a **Bookmark** option (or **Remove bookmark** if the question is already bookmarked), placed after the Explain answer option. A bookmarked question displays a ⭐ indicator next to the question text on the post-answer screen. The bookmark toggle is available in both the pre-explanation state (Next/Explain/Bookmark/Back) and the post-explanation state (Teach me more/Next/Bookmark/Back). The history navigation screen includes the same Bookmark/Remove bookmark toggle in its navigation controls, with the ⭐ indicator on bookmarked questions.

FR43: The domain sub-menu includes a **Bookmarks** action positioned after History. Selecting it opens a bookmarks navigation screen that displays only bookmarked questions for the active domain. Navigation is identical to History (Feature 6): single-question display with Previous/Next/Explain answer/Remove bookmark/Back controls and a progress indicator (e.g., "Bookmark 2 of 8"). Explain answer and Teach me more follow the same flow as History. Selecting Remove bookmark removes the flag, updates the domain file, and navigates to the next bookmarked question (or previous if it was the last); if no bookmarks remain, the user is returned to the domain sub-menu with a message: "No bookmarked questions." If the domain has no bookmarked questions when Bookmarks is selected, the screen displays "No bookmarked questions." with a Back action.

FR44: The domain sub-menu includes a **Challenge** action positioned after Play. Selecting Challenge opens a sprint setup screen with two parameter selectors navigated via arrow keys: **Sprint duration** (2 min / 5 min / 10 min) and **Sprint size N** (5 / 10 / 20). The setup screen provides Confirm and Back actions; Back returns to the domain sub-menu without starting a sprint. On Confirm, all N questions are preloaded before the sprint starts — applying the same SHA-256 deduplication and fail-closed verification rules as FR6, including the same bounded budget of 3 candidate attempts total per question. A loading spinner is shown during preload. If the AI provider is unreachable or any question exhausts its verification budget during preload, the corresponding provider-specific or generation error message is displayed and the user is returned to the domain sub-menu; no sprint starts.

FR45: Challenge Mode sprint execution — the sprint starts immediately after all N questions are preloaded. A visible countdown timer in `M:SS` format (e.g., `4:32`) is rendered prominently on every screen during the sprint (question display and post-answer screens). The timer **never pauses** — it runs continuously through question display, answer selection, and post-answer review. Questions are displayed and scored identically to FR8 (same post-answer inline feedback: correct/incorrect status, correct answer reveal, time taken, speed tier, score delta). Per-question speed tier is measured by the individual answer time (time from question display to answer selection) — not the sprint clock. Post-answer navigation in Challenge Mode is limited to two options only: **Next question** and **Back** — no Explain answer, Bookmark, Remove bookmark, or Teach me more options are available during a sprint.

FR46: Challenge Mode sprint termination and history — the sprint ends on whichever condition occurs first: (a) all N questions answered — sprint completes normally; (b) timer reaches zero while a question is displayed — the unanswered question is auto-submitted as incorrect using the slow + incorrect scoring multiplier; (c) timer reaches zero while the post-answer feedback is displayed — the sprint ends immediately after the current feedback; (d) user selects Back — sprint exits immediately. Only answered questions (including auto-submitted timed-out questions) are recorded in domain history with all FR11 fields. Preloaded questions that were never displayed to the user are discarded — their hashes are not added to the deduplication store. Score and difficulty level persist to the domain file after sprint termination. After sprint termination, the user is returned to the domain sub-menu and the FR39 session summary block is displayed on first render, including the sprint-specific Sprint result field (field 9 of FR39).

FR47: When creating a new domain, after the user enters a name the app validates uniqueness by comparing the slugified form against all existing domain files (both active and archived). If a matching active domain exists, the app displays: "A domain named '[name]' already exists." and returns the user to the name input prompt. If a matching archived domain exists, the app displays: "A domain named '[name]' already exists in your archived domains." and returns the user to the name input prompt. Creation only proceeds when no duplicate is found.

FR48: The domain sub-menu includes an **ASCII Art** action positioned after **Statistics**. The ASCII Art feature is milestone-gated behind the configured ASCII Art Milestone threshold (FR49, default: 100 cumulative correct answers per domain). When locked (below threshold), the screen shows a motivational message with the threshold value, a gradient progress bar with percentage (capped at 100%), and a Back choice. When unlocked (at or above threshold), the screen renders the current domain slug locally via `figlet.textSync()` using a randomly selected font from a curated list of 14 FIGlet fonts. The screen uses the standard banner shell, displays the header `🎨 ASCII Art — <domain>`, colorizes the rendered rows with the cyan-to-magenta gradient system, and provides `🔄 Regenerate`, separator, and `↩️  Back` controls. Selecting Regenerate rerenders immediately using a different font from the curated list. Selecting Back or pressing Ctrl+C returns the user to the domain sub-menu. No AI provider, network call, or loading spinner is involved.

FR49: The Settings screen includes an **ASCII Art Milestone** selector positioned before the Welcome & Exit Screen toggle. The selector offers three options via arrow key navigation: **Instant (0 questions)**, **Quick (10 questions)**, and **Classic (100 questions)** — default is Classic (100). The selected value is stored as `asciiArtMilestone` (number: `0` | `10` | `100`) in `settings.json` and determines the cumulative correct answer threshold required to unlock ASCII Art per domain (FR48). The setting is global and retroactive — changing the threshold immediately affects all domains. When set to 0, ASCII Art is unlocked from the start for all domains.

FR50: The Settings screen includes a **🌓 Theme** toggle (displayed as Dark/Light) positioned before the Welcome & Exit Screen toggle. Default is Dark — optimized for dark terminal backgrounds; uses standard cyan, yellow, green, and dim styling. When set to Light — optimized for light terminal backgrounds; substitutes low-contrast colors with readable alternatives (blue for cyan, bold green for green, gray for dim, bold yellow for yellow) as defined in FR21–FR23. The setting is global, applies to all screens and all color output. Changing the theme takes effect immediately — no restart required; the next screen render uses the new palette. The selected value is stored as `theme` (string: `"dark"` | `"light"`) in `settings.json`. Gradient colors (Welcome Screen, Exit Message, Static Banner, ASCII Art) use darker endpoints in Light theme: teal `rgb(0, 140, 160)` → magenta `rgb(180, 0, 100)`. Dim text uses `chalk.gray` in Light theme instead of `chalk.dim`. Header text uses `chalk.bold.blue` in Light theme instead of `chalk.bold.cyan`.

### NonFunctional Requirements

NFR1: The next question must appear within ≤ 5 seconds of the user submitting an answer (covering Copilot API call + local persistence). A loading spinner (ora) is displayed during generation so the terminal does not appear frozen.

NFR2: If the configured AI provider is unreachable, the app displays a provider-specific error message and returns the user to the domain sub-menu without crashing. Per-provider messages: GitHub Copilot — "Could not reach the Copilot API. Check your connection and try again."; OpenAI/Anthropic/Gemini — "Could not reach [Provider] API. Check your connection and try again."; Ollama — "Could not reach Ollama at [endpoint]. Ensure Ollama is running and try again."; OpenAI Compatible API — "Could not reach the OpenAI Compatible API at [endpoint]. Check your connection and endpoint URL and try again." If authentication fails: GitHub Copilot — "Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in."; OpenAI/Anthropic/Gemini — "[Provider] API key is invalid or missing. Set the `[VAR_NAME]` environment variable with a valid key and restart the app."; Ollama — "Could not connect to Ollama. Check that the endpoint and model are correct in Settings."; OpenAI Compatible API — "OpenAI Compatible API key is invalid or missing. Set the `OPENAI_COMPATIBLE_API_KEY` environment variable with a valid key and restart the app." In all error cases, the app remains running and the user can navigate to Settings to reconfigure.

NFR3: Missing domain file → treated as a new domain (score 0, no history, no error displayed). Corrupted domain file → warning displayed, domain reset to clean state, corrupted file overwritten on next save.

NFR4: The app must reach the home screen within ≤ 2 seconds of launch on a standard developer machine.

NFR5: All screen transitions (home screen, domain sub-menu, quiz questions, history navigation, bookmarks navigation, stats dashboard, welcome screen, exit message screen, settings screen) perform a full terminal reset, clearing both the visible viewport and the scroll-back buffer. All content renders at the top of the terminal window; no prior output is visible or accessible by scrolling after any navigation action. Exception: the post-answer feedback panel does not trigger a terminal reset — it renders inline on the same screen as the quiz question so the user can see the original question alongside the feedback. A terminal reset occurs only when the user selects Next question (loading the next question) or exits the quiz. On all screens except the Welcome Screen, Exit Message screen, and Provider Setup screen, a static banner (`🧠🔨 Brain Break` + gradient shadow bar) is rendered immediately after the terminal reset and before any screen content via the shared `clearAndBanner()` utility.

NFR6: All ANSI color output uses standard 8/16-color ANSI escape codes as baseline — ensuring compatibility across macOS Terminal, iTerm2, Linux terminals, and WSL. Extended 256-color or true-color codes may be used where supported. The application ships two color palettes (Dark and Light) to ensure readability across both dark and light terminal backgrounds; the active palette is determined by the 🌓 Theme setting (FR50, default: Dark). All semantic color mappings are defined in FR20–FR23. The application is interactive-only; non-TTY and piped execution modes are out of scope.

### Additional Requirements

- **Project Scaffold (Epic 1, Story 1):** Minimal TypeScript scaffold (ESM) — not oclif. Initialize with `npm init -y`, install `typescript`, `tsx`, `@types/node` as dev deps. Run `npx tsc --init --module nodenext --moduleResolution nodenext --target es2022`. Create full `src/` directory structure as defined in Architecture.

- **Language & Configuration:** TypeScript strict mode, `"type": "module"` in package.json, NodeNext module resolution, target ES2022. All ESM imports MUST include `.js` extension.

- **Runtime Dependencies:** `@inquirer/prompts` v8 (prompts), `ora` v9 (spinner), `chalk` v5 (styling); all ESM-native.

- **Dev Dependencies:** `typescript`, `tsx`, `@types/node`, `vitest`.

- **Error Handling Pattern:** All I/O and AI functions return `Result<T>` (`{ ok: true; data: T } | { ok: false; error: string }`). No raw `throw` in screens — all `try/catch` lives in `ai/client.ts` and `domain/store.ts`.

- **Atomic File Writes:** All domain writes use write-then-rename (`~/.brain-break/.tmp-<slug>.json` → target), exclusively in `domain/store.ts`.

- **Domain Data Schema:** Split meta + history JSON. `hashes` array on disk, loaded as `Set<string>` at runtime for O(1) lookup. `defaultDomainFile(startingDifficulty?)` factory called on `ENOENT` in `store.ts.readDomain()` and during domain creation (with the user-selected difficulty level).

- **Zod Validation:** All Copilot API responses validated with a Zod schema before any field is accessed. AI output is treated as an untrusted external boundary.

- **CI:** GitHub Actions workflow (`ci.yml`) running `tsc --noEmit` + `vitest` on push.

- **Distribution:** `bin` field in `package.json` pointing to `dist/index.js`. `engines.node: ">=22.0.0"`. npx-compatible.

- **Testing:** Co-located `*.test.ts` files alongside each source file. No separate `__tests__/` folder.

### FR Coverage Map

| FR | Epic | Brief Description |
|---|---|---|
| FR1 | Epic 2 | Home screen — domain list with score + count; select opens domain sub-menu |
| FR2 | Epic 2 | Create new domain via free-text input |
| FR3 | Epic 2 | Domain sub-menu — Play/Challenge/History/Bookmarks/Statistics/ASCII Art/Archive/Delete/Back + motivational message on Play |
| FR4 | Epic 2 | Archive domain from domain sub-menu (preserves all data) |
| FR5 | Epic 2 | Archived domains + unarchive |
| FR6 | Epic 3, Epic 7 | Multi-provider question generation + SHA-256 deduplication |
| FR7 | Epic 3 | Adaptive difficulty (5 levels, streak-driven, persists) |
| FR8 | Epic 3 | Quiz loop — silent timer + post-answer feedback |
| FR9 | Epic 3 | Scoring system — base points × speed multiplier |
| FR10 | Epic 3 | Full domain state persistence (score, difficulty, streak, history) |
| FR11 | Epic 3 | Per-question record written after every answer |
| FR12 | Epic 4 | Single-question navigation history view (Previous/Next/Explain answer/Back) |
| FR13 | Epic 4 | Stats dashboard (score, accuracy, trend, streak, time) |
| FR14 | Epic 5 | Settings action on home screen menu |
| FR15 | Epic 5, Epic 7 | Settings screen — AI provider (5 options) + language (free-text) + tone (7 presets) |
| FR16 | Epic 5 | Global scope — all domains and all AI-generated content |
| FR17 | Epic 5, Epic 7 | Settings persistence at `~/.brain-break/settings.json` (expanded with provider fields) |
| FR18 | Epic 5 | Language + tone injected into every AI call |
| FR19 | Epic 5 | Settings screen Save/Back navigation |
| FR20 | Epic 6 | Full-row inverted highlight on focused menu item — all menus |
| FR21 | Epic 6 | Post-answer feedback colors (correct/incorrect/delta) |
| FR22 | Epic 6 | Speed tier badge colors |
| FR23 | Epic 6 | Difficulty level badge colors |
| FR24 | Epic 2 | Delete domain from sub-menu — confirmation dialog, permanent removal, navigate home |
| FR25 | Epic 1 | Coffee Supporter Screen — QR code + URL + Back navigation |
| FR26 | Epic 7 | First-launch Provider Setup screen |
| FR27 | Epic 7 | Provider readiness validation (non-blocking) |
| FR28 | Epic 7 | Settings screen — AI Provider selector + per-provider model config + Ollama config |
| FR29 | Epic 7 | No-provider guard on Play action |
| FR30 | Epic 7 | Per-provider AI error messages |
| FR31 | Epic 8 | Welcome Screen — gradient ASCII art, tagline, version, press-enter dismiss |
| FR32 | Epic 8 | `showWelcome` boolean setting (default: true) — skip welcome when false |
| FR33 | Epic 8, Epic 5 | Settings screen — 🎬 Welcome & Exit screen toggle (ON/OFF) |
| FR34 | Epic 8 | Static banner — `🧠🔨 Brain Break` + gradient shadow bar via `clearAndBanner()` |
| FR35 | Epic 3 | Post-answer "Explain answer" option — AI-generated explanation of the correct answer |
| FR36 | Epic 3 | Unified question detail rendering — shared `renderQuestionDetail()` used in quiz feedback and history detail view |
| FR37 | Epic 4 | Explain answer from history — AI-generated explanation available in History navigation |
| FR38 | Epic 3, Epic 4 | Explanation Drill-Down — "Teach me more" micro-lesson after AI explanation in quiz and history |
| FR39 | Epic 9, Epic 11 | Session Summary — ephemeral post-session summary on domain sub-menu; Sprint result field for Challenge sessions |
| FR40 | Epic 8 | Exit Message — branded farewell screen on explicit Exit when showWelcome is enabled |
| FR41 | Epic 10, Epic 3, Epic 4 | Bookmarked boolean field on question records — toggle from quiz, history, and bookmarks screens |
| FR42 | Epic 3, Epic 4, Epic 10 | Bookmark/Remove bookmark option in quiz post-answer and history navigation + ⭐ indicator |
| FR43 | Epic 10 | Bookmarks screen — domain sub-menu action, per-domain bookmarked question navigation |
| FR44 | Epic 11 | Challenge action in domain sub-menu + sprint setup screen (sprint duration / sprint size presets) + question preloading |
| FR45 | Epic 11 | Sprint execution — visible countdown timer, limited post-answer nav (Next/Back only), per-question speed tier |
| FR46 | Epic 11 | Sprint termination (four conditions), auto-submit on timer expiry, history rules (answered only), sprint result in session summary |
| FR48 | Epic 12 | ASCII Art screen — milestone-gated behind configurable threshold (FR49, default: 100 correct answers); locked state shows progress bar + motivational message; unlocked state renders FIGlet art with gradient coloring and Regenerate/Back navigation |
| FR49 | Epic 5, Epic 12 | ASCII Art Milestone setting — three threshold options (Instant/0, Quick/10, Classic/100), default Classic; stored as `asciiArtMilestone` in settings.json; affects all ASCII Art unlock gating |
| FR47 | Epic 2 | Duplicate domain name validation — slugified comparison against active and archived domains with context-specific messages |
| FR50 | Epic 5, Epic 6 | Theme toggle (Dark/Light, default Dark) — controls color palette for readability on dark and light terminal backgrounds |

| NFR | Epic | Coverage |
|---|---|---|
| NFR1 | Epic 3 | ≤ 5s + ora spinner |
| NFR2 | Epic 3, Epic 7 | Graceful per-provider API/auth error → domain sub-menu |
| NFR3 | Epic 2 | ENOENT → defaultDomainFile(); corrupted → warn + reset |
| NFR4 | Epic 2 | ≤ 2s startup to home screen |
| NFR5 | Story 1.6, Epic 8 | Full terminal reset (viewport + scroll-back buffer) + static banner via `clearAndBanner()` before every screen render (cross-cutting); Welcome/Exit Message/Provider Setup use `clearScreen()` only |
| NFR6 | Epic 6 | ANSI 8/16-color baseline; dual Dark/Light palettes; interactive-only |

## Epic List

### Epic 1: Project Foundation & Developer Infrastructure
Users can clone the repo, install dependencies, and run `tsx src/index.ts` to reach a working (if minimal) entry point — with the full typed domain schema, atomic file store, and CI in place as the verified foundation every other epic builds on.
**FRs covered:** FR25 (Coffee Supporter Screen)
**NFRs covered:** partial NFR4 (startup path wired)
**Additional requirements covered:** TypeScript scaffold, ESM/NodeNext/strict, full `src/` directory structure, `Result<T>` type, Zod domain schema, `defaultDomainFile()`, atomic write store, CI pipeline, npm/npx distribution config

### Epic 2: Domain Management
Users can launch the app, see their domain list with scores, create a new domain, select a domain to open its sub-menu (Play, Challenge, History, Bookmarks, Statistics, ASCII Art, Archive, Delete, Back), archive domains they're not actively using, unarchive them to resume exactly where they left off, and permanently delete domains they no longer need.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR24, FR47
**NFRs covered:** NFR3 (missing/corrupted file handling), NFR4 (≤ 2s startup)

### Epic 3: AI-Powered Adaptive Quiz
Users can take an AI-generated, never-repeating, multiple-choice quiz session in their chosen domain — with a silent response timer, adaptive difficulty that tracks streaks across sessions, cumulative domain-scoped scoring with speed multipliers, graceful error handling if the Copilot API is unavailable, and an on-demand AI explanation of the correct answer after every question.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR35, FR38, FR41, FR42
**NFRs covered:** NFR1 (≤ 5s generation + spinner), NFR2 (API error handling)

### Epic 4: Learning Insights
Users can review their complete question history for any domain (single-question navigation with all recorded fields), request an AI-generated explanation for any past question, and view a stats dashboard showing score, accuracy, difficulty level, time played, score trend, and return streak — giving them a genuine signal of their knowledge growth over time and turning history from a passive record into an active learning tool.
**FRs covered:** FR12, FR13, FR37, FR38, FR42
### Epic 5: Global Settings
Users can configure their preferred language and AI tone of voice from a dedicated Settings screen accessible from the home menu — settings persist across sessions, apply to all domains, and take effect on the next AI-generated content (questions, answers, motivational messages).
**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR19, FR50
**FRs updated:** FR3 (motivational message → AI-generated with language/tone), FR6/FR18 (language + tone injected into all AI calls)
**NFRs covered:** none directly
**Additional requirements covered:** SettingsFile schema + Zod validation, settings store (read/write `~/.brain-break/settings.json`), prompt builder updated to accept `{ language, tone }` context

### Epic 6: Terminal UI Highlighting & Color System
Every menu in the application renders the focused item with a full-row inverted highlight navigable by arrow keys; post-answer feedback, score deltas, speed-tier badges, and difficulty badges are color-coded with semantic ANSI colors using the active theme’s palette (Dark or Light) — making the app feel polished and the feedback loop immediately readable on any terminal background.
**FRs covered:** FR20, FR21, FR22, FR23, FR50
**NFRs covered:** NFR6 (ANSI baseline color compatibility, dual Dark/Light palettes)
**Additional requirements covered:** `utils/format.ts` semantic color helpers, `inquirer` select theme configuration across all screens

### Epic 7: Multi-Provider AI Integration
Users can select their preferred AI provider (OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama, or OpenAI Compatible API) at first launch and change it at any time from Settings — all providers are interchangeable behind a unified adapter layer, with provider-specific error messages and non-blocking validation that lets users explore the full app even before their provider is ready.
**FRs covered:** FR26, FR27, FR28, FR29, FR30
**FRs updated:** FR6 (Copilot-only → multi-provider), FR15 (4 tones → 7 tones + provider selector), FR17 (settings defaults expanded with provider fields)
**NFRs covered:** NFR2 (per-provider error handling)
**Additional requirements covered:** `ai/providers.ts` — `AiProvider` interface + 6 adapters (4 via Vercel AI SDK + 1 custom Copilot + 1 OpenAI Compatible), `createProvider()` factory, `validateProvider()` readiness checks; `ai/client.ts` refactored to provider-agnostic orchestration; `screens/provider-setup.ts` first-launch screen; `domain/schema.ts` expanded with `AiProviderType`; startup flow wired in `index.ts`/`router.ts`

### Epic 8: Welcome & Exit Screens + Static Banner
When enabled, branded launch/exit screens frame the session: a Welcome Screen on startup and an Exit Message screen on explicit home Exit, both sharing the same visual language (gradient ASCII art, styled subtitle, version, and shadow bar). Every normal app screen renders a persistent static banner (`🧠🔨 Brain Break` + gradient shadow bar) at the top of the terminal, providing consistent visual branding across navigation states.
**FRs covered:** FR31, FR32, FR33, FR34, FR40
**FRs updated:** FR15 (Settings screen label renamed to Welcome & Exit Screen toggle), FR17 (settings defaults include `showWelcome: true`)
**NFRs covered:** NFR5 (banner rendering after terminal reset on all screens except Welcome/Exit/Provider Setup)
**Additional requirements covered:** `screens/welcome.ts` — Welcome Screen; `screens/exit.ts` — Exit Message screen; `utils/screen.ts` — `banner()` and `clearAndBanner()` utilities; `utils/format.ts` — gradient color utilities; `domain/schema.ts` — `showWelcome` boolean; startup flow wired in `index.ts`/`router.ts`

### Epic 9: Session Summary
After completing a quiz or challenge sprint session, the domain sub-menu displays a one-time ephemeral session summary block — score delta, accuracy, speed, difficulty change, and (for sprints) sprint completion result — giving every session a tangible scorecard before the user decides what to do next.
**FRs covered:** FR39
**FRs updated:** FR3 (post-session return includes session summary for both Play and Challenge)

### Epic 10: Question Bookmarking
Users can bookmark any answered question to flag it for later revisiting — from the quiz post-answer screen or from history navigation. Bookmarked questions are accessible via a dedicated Bookmarks screen in the domain sub-menu, with navigation identical to History.
**FRs covered:** FR41, FR42, FR43

### Epic 11: Challenge Mode (Sprint)
Users can launch a timed sprint session from the domain sub-menu — configuring a sprint size (5/10/20) and sprint duration (2/5/10 min), with all N questions preloaded upfront. A visible countdown timer runs throughout without pausing; post-answer nav is limited to Next and Back. Sprint ends when questions run out or time expires. Answered questions are stored in domain history; the session summary shows the sprint completion result.
**FRs covered:** FR44, FR45, FR46
**FRs updated:** FR3 (Challenge added to domain sub-menu), FR39 (Sprint result field added)
**NFRs covered:** NFR2 (AI provider error during preload), NFR5 (sprint setup screen in terminal reset list)

### Epic 12: ASCII Art
Users can select an ASCII Art option from the domain sub-menu to view their progress toward unlocking FIGlet ASCII art for the domain name. The art unlocks after reaching the configured ASCII Art Milestone threshold (default: 100 cumulative correct answers, configurable in Settings to 0 or 10) — until then, the menu label shows a gradient progress bar with percentage, and the screen displays a motivational message with progress. Once unlocked, the screen renders FIGlet ASCII art colored with the app's signature cyan-to-magenta gradient.
**FRs covered:** FR48, FR49
**FRs updated:** FR3 (ASCII Art label dynamic with configurable threshold), FR15 (Settings screen gains milestone selector), FR17 (settings defaults expanded)
**NFRs covered:** none — local rendering only, with no provider or network dependency

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
**Then** all runtime deps (`@inquirer/prompts@8`, `ora@9`, `chalk@5`, `zod@4`) and dev deps (`typescript@6`, `tsx`, `@types/node`, `vitest`) are installed without errors  

**Given** the project is installed  
**When** I run `npm run typecheck`  
**Then** `tsc --noEmit` exits with code 0 and no errors  

**Given** the project is installed  
**When** I run `tsx src/index.ts`  
**Then** the process starts without crashing (may print a placeholder message and exit cleanly)  

**Given** the project structure  
**When** I inspect the repo  
**Then** `package.json` has `"type": "module"`, a `bin` field pointing to `dist/index.js`, `engines.node: ">=22.0.0"`, and all required scripts (`dev`, `build`, `start`, `typecheck`, `test`, `test:watch`)  
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
**When** a new question is displayed  
**Then** `clearScreen()` is called before rendering the question  
**And** when the user answers the question, the post-answer feedback is rendered inline on the same screen — no `clearScreen()` or `clearAndBanner()` is called between the question and the feedback panel  
**And** `clearScreen()` is called only when the user selects Next question (to display the next question) or exits the quiz  

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

Users can launch the app, see their domain list with scores, create a new domain, select a domain to open its sub-menu (Play, Challenge, History, Bookmarks, Statistics, Archive, Delete, Back), archive domains they're not actively using, unarchive them to resume exactly where they left off, and permanently delete domains they no longer need.

### Story 2.1: Home Screen — Display Domain List

As a user,
I want the app to display a home screen on launch listing all active domains with their scores and question counts,
So that I can see my current progress at a glance and choose what to do next.

**Acceptance Criteria:**

**Given** `screens/home.ts` and `router.ts` are implemented and `index.ts` bootstraps the app  
**When** I run `tsx src/index.ts`  
**Then** the home screen renders within ≤ 2 seconds showing a list of all active (non-archived) domains  
**And** each domain entry shows: domain name, current score, and total questions answered  
**And** the available actions include: select a domain (opens domain sub-menu), create a new domain, archived domains, and exit  
**And** archive / history / statistics actions are NOT shown on the home screen — they are accessed from the domain sub-menu  

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
**Then** an input prompt is shown: `New domain name:`  

**Given** I am on the create domain screen  
**When** I press Ctrl+C  
**Then** I return to the home screen without creating a domain  

**Given** I am on the create domain screen  
**When** I type a domain name (e.g. "Spring Boot microservices") and press Enter  
**Then** a difficulty selection prompt appears with options: 1 (Beginner), 2 (Elementary), 3 (Intermediate), 4 (Advanced), 5 (Expert) — navigated via arrow keys, defaulting to level 2 (Elementary)  

**Given** I have entered a domain name and the difficulty selection prompt is shown  
**When** I select a difficulty level and press Enter  
**Then** a Save/Back navigation prompt is shown  

**Given** I am on the Save/Back navigation prompt  
**When** I select "💾  Save"  
**Then** the app calls `slugify()` to derive a file slug (e.g. `spring-boot-microservices`)  
**And** a new domain file is created at `~/.brain-break/spring-boot-microservices.json` with `defaultDomainFile(selectedDifficulty)` values (the selected difficulty becomes `meta.difficultyLevel`)  
**And** the home screen refreshes showing the new domain in the active list  

**Given** I am on the Save/Back navigation prompt  
**When** I select "←  Back"  
**Then** I return to the home screen without creating a domain  

**Given** I am on the difficulty selection prompt  
**When** I press Ctrl+C  
**Then** I return to the home screen without creating a domain  

**Given** I type a domain name that slugifies to the same slug as an existing **active** domain (e.g. "Python 3" when `python-3.json` already exists as active)  
**When** I press Enter after entering the name  
**Then** the app displays: *"A domain named '[name]' already exists."*  
**And** the user is returned to the `New domain name:` input prompt — the create flow is not exited  
**And** no domain file is created  

**Given** I type a domain name that slugifies to the same slug as an existing **archived** domain  
**When** I press Enter after entering the name  
**Then** the app displays: *"A domain named '[name]' already exists in your archived domains."*  
**And** the user is returned to the `New domain name:` input prompt — the create flow is not exited  
**And** no domain file is created  

**Given** I am creating a domain  
**When** I leave the name field empty and confirm  
**Then** the app displays a validation message and re-prompts without creating a file  

---

### Story 2.5: Domain Sub-Menu

As a user,
I want selecting a domain to open a sub-menu showing the domain's current stats and actions I can take,
So that I can choose to play, review history, check statistics, or archive — all from a focused, per-domain context.

**Acceptance Criteria:**

**Given** I am on the home screen and at least one active domain exists  
**When** I select a domain  
**Then** the domain sub-menu opens with the prompt header showing: domain name, current score, and total questions answered (read fresh from disk)  
**And** the available options are: Play, History, Bookmarks, Statistics, Archive, Delete, and Back  

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
**When** I select "Archived domains" from the home screen  
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

### Story 3.1: AI Client & Question Generation

As a developer,
I want `ai/client.ts` and `ai/prompts.ts` to integrate with the provider abstraction layer and return validated question objects via `Result<T>`,
So that any screen can request a question and always receive either a valid result or a clear error — never a crash.

**Acceptance Criteria:**

**Given** `ai/prompts.ts` is implemented  
**When** I call `buildQuestionPrompt(domain, difficultyLevel, settings)`  
**Then** it returns a structured prompt string instructing the model to return a JSON object with: `question`, `options` (A–D), `difficultyLevel`, and `speedThresholds` (`{ fastMs, slowMs }`)  
**And** the prompt includes the active language and tone voice instruction from `settings`  
**And** `QuestionResponseSchema` (Zod) is exported and validates this exact shape  

**Given** `ai/client.ts` is implemented  
**When** I call `generateQuestion(domain, difficultyLevel, existingHashes, previousQuestions, settings)`  
**Then** it calls `createProvider(settings)` to get the active provider adapter  
**And** calls `provider.generateCompletion(prompt)` with the prompt from `buildQuestionPrompt()`  
**And** validates the response with `QuestionResponseSchema` before returning  
**And** computes `hashQuestion()` on the returned question text and checks it against `existingHashes`  
**And** if the hash already exists (duplicate), retries with `buildDeduplicationPrompt()` including previous questions to avoid  
**And** returns `{ ok: true, data: Question }` on success  

**Given** `createProvider(settings)` returns `{ ok: false }` (no provider configured)  
**When** `generateQuestion()` is called  
**Then** it returns `{ ok: false, error: AI_ERRORS.NO_PROVIDER }`  

**Given** the configured AI provider is unreachable or returns a network error  
**When** `generateQuestion()` is called  
**Then** it returns `{ ok: false, error: AI_ERRORS.NETWORK_<PROVIDER> }` with the provider-specific network error message  

**Given** the configured AI provider returns an authentication failure  
**When** `generateQuestion()` is called  
**Then** it returns `{ ok: false, error: AI_ERRORS.AUTH_<PROVIDER> }` with the provider-specific auth error message  

**Given** the AI provider returns a response that fails Zod validation  
**When** `generateQuestion()` is called  
**Then** it returns `{ ok: false, error: AI_ERRORS.PARSE }`  

**Given** `ai/client.test.ts` exists  
**When** I run `npm test`  
**Then** all tests pass, covering success path, no-provider error, per-provider network error, per-provider auth error, parse error, and deduplication retry (provider mocked via `createProvider`)  

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
**And** the feedback panel is rendered **on the same screen** as the question — no terminal clear or `clearAndBanner()` call occurs between the question and the feedback  
**And** the feedback panel shows: correct/incorrect, the correct answer (if I was wrong), time taken (ms), speed tier (fast/normal/slow based on `speedThresholds`), and score delta  
**And** the user can see the original question text, answer options, and their chosen answer above the feedback panel  

**Given** an answer has been processed  
**When** `writeDomain()` is called  
**Then** the full updated domain state (meta, hashes + new hash appended, history + new record appended) is atomically persisted before the next question is shown  
**And** every `QuestionRecord` field specified in FR11 is written (question, options, correctAnswer, userAnswer, isCorrect, answeredAt ISO8601, timeTakenMs, speedTier, scoreDelta, difficultyLevel, bookmarked)  

**Given** `generateQuestion()` returns `{ ok: false }` with a provider-specific error (network, auth, no provider, or parse)  
**When** the error is received in the quiz screen  
**Then** the provider-specific error message is displayed and the user is returned to the domain sub-menu without crashing  
**And** the app remains running — the user can navigate to Settings to reconfigure  

**Given** I am in an active quiz session  
**When** I choose "Exit quiz" (available after each answer)  
**Then** all persisted data is preserved and I am returned to the domain sub-menu  

---

### Story 3.4: Answer Explanation

As a user,
I want an "Explain answer" option after each quiz question so the AI can explain why the correct answer is right,
So that I can learn from every question immediately instead of having to look it up externally.

**Acceptance Criteria:**

**Given** I have answered a quiz question and the feedback panel is displayed  
**When** I inspect the post-answer navigation options  
**Then** three options are shown: "💡 Explain answer", "⭐ Bookmark" (or "⭐ Remove bookmark" if already bookmarked), "▶️  Next question", and "🚪 Back"  

**Given** I select "💡 Explain answer"  
**When** the action is triggered  
**Then** an `ora` spinner starts with "Generating explanation..." while `generateExplanation()` is called  
**And** the spinner stops and the explanation is displayed inline below the feedback panel  
**And** the explanation is 2–4 sentences, covering why the correct answer is correct and optionally why common wrong choices are incorrect  
**And** the explanation uses the active language and tone from global settings  

**Given** the explanation has been displayed  
**When** I inspect the post-explanation navigation options  
**Then** three options are shown: "📚 Teach me more", "⭐ Bookmark" (or "⭐ Remove bookmark"), "▶️  Next question", and "🚪 Back" — the "Explain answer" option is no longer available for this question  

**Given** `ai/prompts.ts` is updated  
**When** I call `buildExplanationPrompt(question, userAnswer, settings)`  
**Then** it returns a structured prompt instructing the model to explain the correct answer for the given question, including the question text, all four options, the correct answer, and the user's chosen answer  
**And** the prompt includes the active language and tone voice instruction  

**Given** `ai/client.ts` exports `generateExplanation(question, userAnswer, settings)`  
**When** called  
**Then** it calls the active provider via `createProvider(settings).generateCompletion(prompt)` and returns `Result<string>`  
**And** on success returns `{ ok: true, data: <explanation text> }`  
**And** on failure returns `{ ok: false, error: <provider-specific error message> }`  

**Given** the AI call for explanation fails (network error, auth error, or any other failure)  
**When** `generateExplanation()` returns `{ ok: false }`  
**Then** a warning message is displayed (e.g. "Could not generate explanation.") and the user is returned to the Next/Back prompt  
**And** the quiz session continues normally — the failure is non-critical  

**Given** I press Ctrl+C on the explain/next/back prompt  
**When** the exit is detected  
**Then** the app handles it gracefully and returns to the domain sub-menu  

**Given** `ai/client.test.ts`, `ai/prompts.test.ts`, and `screens/quiz.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: explain option present in post-answer prompt, `generateExplanation()` success and failure paths, explanation displayed after selection, explain option removed after use, Teach me more option shown after explanation, language/tone injected into explanation prompt, graceful degradation on API failure  

---

### Story 3.5: Answer Verification Gate (Fail-Closed)

As a user,
I want the system to independently verify the AI's correct answer before presenting the question to me,
So that I can trust the quiz results and not be penalized for choosing the right answer when the AI got it wrong.

**Acceptance Criteria:**

**Given** `ai/prompts.ts` exports `buildVerificationPrompt(question, settings?)`  
**When** called with a generated question  
**Then** it returns a structured prompt that presents the finalized question text and all four options without revealing any pre-selected answer  
**And** instructs the AI to return both `correctAnswer` and `correctOptionText` for the selected option  
**And** includes the active language and tone voice instruction when settings are provided  
**And** `VerificationResponseSchema` (Zod) is exported and validates the response shape `{ correctAnswer: "A" | "B" | "C" | "D", correctOptionText: string }`  

**Given** `ai/client.ts` implements `verifyAnswer(question, provider, settings?)`  
**When** called after a question is generated  
**Then** it sends the verification prompt to the same provider and validates the returned `correctAnswer` and `correctOptionText` against the candidate question's finalized options  
**And** accepts the verification result only when `correctAnswer` points to the same option whose text exactly matches `correctOptionText`  
**And** explicitly marks the candidate as retry-required whenever the verification response cannot be proven consistent locally  

**Given** the verification response is not valid JSON, does not match the schema, or the verification call throws a network/provider error  
**When** `verifyAnswer()` encounters the failure  
**Then** the candidate question is rejected and `generateQuestion()` starts a fresh generation + shuffle + verification cycle  

**Given** `generateQuestion()` receives a valid question from the AI  
**When** the verification response's `correctAnswer` and `correctOptionText` do not align on the same option  
**Then** the question is discarded and regenerated with a fresh prompt  
**And** the full candidate cycle is retried with a bounded budget of 3 candidate attempts total (initial attempt + 2 retries)  
**And** if all attempts fail, `generateQuestion()` returns `{ ok: false, error: <generation/verification error> }` and no question is shown to the user  

**Given** a duplicate question triggers the deduplication retry path  
**When** the dedup question is generated  
**Then** it is also verified via `verifyAnswer()` before being returned  
**And** the same fail-closed candidate budget applies to the dedup path  

**Given** `ai/client.test.ts` and `ai/prompts.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: verification accepts only aligned `correctAnswer` + `correctOptionText`, verification parse/schema/network failures trigger retries, retry budget exhaustion returns `{ ok: false }`, verification prompt does not reveal a pre-selected answer, voice instruction injected into verification prompt, and dedup path verification uses the same fail-closed budget  

---

### Story 3.7: Unified Question Detail Rendering

As a user,
I want the post-answer feedback layout in the quiz to be replicated exactly in the question detail view in my history,
So that the experience is consistent and I recognise the same layout whether I just answered a question or I'm reviewing it later.

**Acceptance Criteria:**

**Given** `utils/format.ts` exports `renderQuestionDetail(record: QuestionRecord, opts?: { showTimestamp?: boolean }): void`  
**When** called with a `QuestionRecord` where `isCorrect` is `true`  
**Then** all 4 answer options (A–D) are rendered with `►` prefixing `record.userAnswer` and a single space prefix on all others  
**And** a blank separator line is printed after the options  
**And** `colorCorrect('✓ Correct!')` is rendered  
**And** no correct-answer-reveal line is rendered  
**And** a compound line is rendered: `Time: ${formatDuration(timeTakenMs)} | Speed: ${colorSpeedTier(speedTier)} | Difficulty: ${colorDifficultyLevel(difficultyLevel)}`  
**And** a score line is rendered: `Score: ${colorScoreDelta(scoreDelta)}`  

**Given** `renderQuestionDetail` is called with a `QuestionRecord` where `isCorrect` is `false`  
**When** the function renders  
**Then** `colorIncorrect('✗ Incorrect')` is rendered  
**And** a correct-answer reveal line is rendered: `Correct answer: colorCorrect(bold('<key>) <text>'))`  
**And** `►` is prefixed on the wrong user-answer key, not on the correct answer key  

**Given** `renderQuestionDetail` is called with `opts.showTimestamp === true`  
**When** the function renders  
**Then** a `dim` timestamp line (`Answered: <formatted date>`) is appended as the last line  

**Given** `renderQuestionDetail` is called without `opts` or with `opts.showTimestamp` omitted  
**When** the function renders  
**Then** no timestamp line is output  

**Given** `screens/quiz.ts` is updated  
**When** a user answers a question and the feedback is rendered  
**Then** the private `showAnswerOptions()` and `showFeedback()` functions are removed  
**And** a single call to `renderQuestionDetail(record)` (without timestamp) replaces the `showAnswerOptions(question, userAnswer)` + `console.log()` + `showFeedback(...)` call site  
**And** the post-answer actions — 💡 Explain answer / ▶️ Next question / 🚪 Back — are fully preserved and render immediately after `renderQuestionDetail(record)`, unchanged  

**Given** `screens/history.ts` is updated  
**When** a history entry is displayed  
**Then** the `📜 Question History — {domainSlug}` header rendered by `navigateHistory` is unchanged  
**And** `displayEntry()` prints the question text as a plain (non-bold, non-numbered) line — matching the visual style of the quiz answer screen — then calls `renderQuestionDetail(record, { showTimestamp: true })`  
**And** the `globalIndex` parameter is removed from `displayEntry()` since the `#N` prefix is no longer rendered  
**And** the `formatTimestamp` export in `history.ts` is removed — timestamp formatting moves to `utils/format.ts` as a non-exported helper used by `renderQuestionDetail`  

**Given** the same `QuestionRecord` is rendered in quiz feedback and in history detail  
**When** the output of both screens is compared  
**Then** the options block, correct/incorrect status, time/speed/difficulty line, score line, and color semantics are pixel-identical  
**And** the only difference is that history appends the answered-at timestamp line and quiz does not  

**Given** `utils/format.test.ts`, `screens/quiz.test.ts`, and `screens/history.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: `renderQuestionDetail` correct path (all 4 options, `►` on correct key, `✓ Correct!` present, no reveal, time/speed/difficulty and score lines), incorrect path (`✗ Incorrect`, reveal line, `►` on wrong key), `showTimestamp: true` appends timestamp, omitted `showTimestamp` produces no timestamp line, all existing quiz and history tests pass with no behavioral regressions  

---

### Story 3.8: Explanation Drill-Down (Quiz)

As a user,
I want a "Teach me more" option after viewing an AI-generated explanation so the AI generates a deeper micro-lesson on the underlying concept,
So that I can go beyond the immediate answer and understand the foundational principles behind the question.

**Acceptance Criteria:**

**Given** an AI-generated explanation has been displayed for the current quiz question  
**When** I inspect the post-explanation navigation options  
**Then** three options are shown: "📚 Teach me more", "⭐ Bookmark" (or "⭐ Remove bookmark"), "▶️  Next question", and "🚪 Back"  

**Given** I select "📚 Teach me more"  
**When** the action is triggered  
**Then** an `ora` spinner starts with "Generating micro-lesson..." while `generateMicroLesson()` is called  
**And** the spinner stops and the micro-lesson is displayed inline below the explanation on the same screen — no terminal clear or screen transition occurs  
**And** the micro-lesson is ~1-minute read (3–5 paragraphs), covering foundational principles, related concepts, and practical context behind the question  
**And** the micro-lesson uses the active language and tone from global settings  

**Given** the micro-lesson has been displayed  
**When** I inspect the post-micro-lesson navigation options  
**Then** two options are shown: "⭐ Bookmark" (or "⭐ Remove bookmark"), "▶️  Next question", and "🚪 Back" — "Teach me more" is no longer available for this question  

**Given** `ai/prompts.ts` is updated  
**When** I call `buildMicroLessonPrompt(question, explanation, settings)`  
**Then** it returns a structured prompt instructing the model to generate a concise micro-lesson on the underlying concept, including the question text, all four options, the correct answer, the explanation already provided, and context instructions for depth  
**And** the prompt includes the active language and tone voice instruction  

**Given** `ai/client.ts` exports `generateMicroLesson(question, explanation, settings)`  
**When** called  
**Then** it calls the active provider via `createProvider(settings).generateCompletion(prompt)` and returns `Result<string>`  
**And** on success returns `{ ok: true, data: <micro-lesson text> }`  
**And** on failure returns `{ ok: false, error: <provider-specific error message> }`  

**Given** the AI call for the micro-lesson fails (network error, auth error, or any other failure)  
**When** `generateMicroLesson()` returns `{ ok: false }`  
**Then** a warning message is displayed (e.g. "Could not generate micro-lesson.") and the user is returned to the Next/Back prompt  
**And** the quiz session continues normally — the failure is non-critical  

**Given** I press Ctrl+C on the teach-me-more/next/back prompt  
**When** the exit is detected  
**Then** the app handles it gracefully and returns to the domain sub-menu  

**Given** `ai/client.test.ts`, `ai/prompts.test.ts`, and `screens/quiz.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: Teach me more option present after explanation is displayed, `generateMicroLesson()` success and failure paths, micro-lesson displayed inline after selection, Teach me more option removed after use, language/tone injected into micro-lesson prompt, graceful degradation on API failure  

---

## Epic 4: Learning Insights

Users can review their complete question history for any domain (single-question navigation), request an AI-generated explanation for any past question, and view a stats dashboard with score, accuracy, trend, and return streak — giving them a genuine signal of knowledge growth over time.

### Story 4.1: Single-Question History Navigation

As a user,
I want to view my full question history for the active domain — one question at a time with Previous/Next navigation and a progress indicator,
So that I can review past questions in detail, see where I went wrong, and track my learning.

**Acceptance Criteria:**

**Given** I am on the domain sub-menu and choose "History"  
**When** `screens/history.ts` loads  
**Then** the history is read from the domain file and displayed one entry at a time, starting from the most recent question  
**And** each entry shows: question text, all 4 options, my chosen answer, the correct answer, whether I was correct, timestamp (formatted), time taken (ms), speed tier, score delta, and difficulty level  

**Given** the domain has more than 1 history entry  
**When** viewing history  
**Then** navigation controls are shown (Previous / Next / Back) and a progress indicator displays the current position (e.g., "Question 3 of 47")  
**And** Previous navigates to the older question; Next navigates to the newer question  
**And** at the first (most recent) entry, Previous is available and Next is not; at the last (oldest) entry, Next is available and Previous is not  

**Given** the domain has exactly 1 history entry  
**When** viewing history  
**Then** the single entry is shown with the progress indicator ("Question 1 of 1") and only a "Back" option — no Previous/Next controls  

**Given** the domain has no history entries  
**When** I navigate to History  
**Then** a message is shown ("No questions answered yet") and a "Back" option returns me to the domain sub-menu  

**Given** I am on the history screen  
**When** I select "Back"  
**Then** I return to the domain sub-menu  

---

### Story 4.2: Stats Dashboard

As a user,
I want to view a stats dashboard for the active domain showing my score, accuracy, time played, starting difficulty, current difficulty level, score trend, and return streak,
So that I have a clear, motivating picture of my progress and know whether my skills are genuinely growing.

**Acceptance Criteria:**

**Given** I am on the domain sub-menu and choose "Statistics"  
**When** `screens/stats.ts` loads  
**Then** the stats dashboard displays all of the following, derived from the domain file:  
- Current score
- Total questions answered
- Correct answer count, incorrect answer count, and accuracy % (rounded to 1 decimal)
- Total time played across all sessions (formatted as h/m/s)
- Starting difficulty level (number + label, e.g. "2 — Elementary") — set at domain creation, never changes
- Current difficulty level (number + label, e.g. "3 — Intermediate")
- Score trend over the last 30 days: "Growing 📈", "Flat ➡️", or "Declining 📉" (derived from `answeredAt` timestamps and `scoreDelta` values in history)
- Days since first session (derived from earliest `answeredAt`)
- Current return streak in days (consecutive days with at least one answered question, derived from `answeredAt` history)

**Given** the domain has no history entries  
**When** I navigate to Statistics  
**Then** the dashboard shows current score (0), totals (0), and placeholders for derived fields (e.g. "No data yet")  

**Given** I am on the stats screen  
**When** I select "Back"  
**Then** I return to the domain sub-menu  

---

### Story 4.3: Explain Answer from History

As a user,
I want to select "Explain answer" while browsing my question history so the AI explains why the correct answer is correct,
So that I can reinforce understanding of past questions and turn my history into an active learning tool.

**Acceptance Criteria:**

**Given** I am viewing a question in the history screen  
**When** the navigation controls are displayed  
**Then** the options include Previous, Next, Explain answer, Bookmark (or Remove bookmark if already bookmarked), and Back (alongside the progress indicator)  

**Given** I am viewing a question in the history screen  
**When** I select "Explain answer"  
**Then** a loading spinner is displayed while the AI generates an explanation  
**And** `generateExplanation()` is called with the question context (question text, all options, correct answer, and the user's chosen answer) and the active language/tone settings  
**And** the explanation (2–4 sentences) is displayed inline on the same screen below the question detail — no terminal clear or screen transition occurs  

**Given** the explanation is already displayed on the screen  
**When** the navigation menu re-appears  
**Then** the options are Teach me more, Previous, Next, Bookmark (or Remove bookmark), and Back — Explain answer is hidden while the explanation is visible  

**Given** the explanation was previously displayed for a question  
**When** I navigate away (Previous or Next) and then navigate back to the same question  
**Then** Explain answer is available again in the navigation controls  

**Given** I select "Explain answer" and the AI call fails (network error, auth error, parse error)  
**When** the error is caught  
**Then** a warning message is displayed (e.g., "Could not generate explanation.") and I am returned to the full navigation menu (Previous/Next/Explain answer/Back) — the failure is non-critical and does not interrupt history browsing  

**Given** the domain has exactly 1 history entry  
**When** I view the entry and select "Explain answer"  
**Then** the explanation is displayed inline and the navigation menu shows only Explain answer and Bookmark (before explaining) or Teach me more, Bookmark, and Back (after explaining) — Previous and Next are not shown for single-entry history  

**Given** `screens/history.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: Explain answer option present in navigation, `generateExplanation()` called with correct arguments, explanation rendered inline, Explain hidden after explanation displayed, Teach me more option shown after explanation, Explain available again after navigating away and back, AI failure handled gracefully with warning message  

---

### Story 4.4: Explanation Drill-Down (History)

As a user,
I want a "Teach me more" option after viewing an AI-generated explanation in the history screen so the AI generates a deeper micro-lesson on the underlying concept,
So that I can turn my question history into a genuine learning resource by exploring concepts in depth.

**Acceptance Criteria:**

**Given** an AI-generated explanation has been displayed for the current history question  
**When** the navigation menu re-appears  
**Then** the options include Teach me more, Previous, Next, Bookmark (or Remove bookmark), and Back — Explain answer is hidden  

**Given** I select "Teach me more"  
**When** the action is triggered  
**Then** a loading spinner is displayed while `generateMicroLesson()` is called with the question context, the explanation, and the active language/tone settings  
**And** the micro-lesson (~1-minute read, 3–5 paragraphs) is displayed inline on the same screen below the explanation — no terminal clear or screen transition occurs  

**Given** the micro-lesson has been displayed  
**When** the navigation menu re-appears  
**Then** the options are Previous, Next, Bookmark (or Remove bookmark), and Back — Teach me more is no longer available for this question  

**Given** the micro-lesson was previously displayed for a question  
**When** I navigate away (Previous or Next) and then navigate back to the same question  
**Then** Teach me more is available again only after selecting Explain answer again — micro-lesson availability follows explanation availability  

**Given** I select "Teach me more" and the AI call fails (network error, auth error, parse error)  
**When** the error is caught  
**Then** a warning message is displayed (e.g., "Could not generate micro-lesson.") and I am returned to the navigation menu (Teach me more/Previous/Next/Bookmark/Back) — the failure is non-critical and does not interrupt history browsing  

**Given** the domain has exactly 1 history entry and an explanation has been displayed  
**When** I select "Teach me more"  
**Then** the micro-lesson is displayed inline and the navigation menu shows only Bookmark (or Remove bookmark) and Back — Previous and Next are not shown for single-entry history  

**Given** `screens/history.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: Teach me more option present after explanation, `generateMicroLesson()` called with correct arguments, micro-lesson rendered inline, Teach me more removed after micro-lesson displayed, micro-lesson availability follows explanation availability after navigation, AI failure handled gracefully with warning message  

---

## Epic 5: Global Settings

Users can configure their preferred language and AI tone of voice from a dedicated Settings screen accessible from the home menu — settings persist across sessions, apply to all domains, and take effect on the next AI-generated content.

### Story 5.1: Settings Schema & Store

As a developer,
I want a `SettingsFile` Zod schema and read/write store functions for `~/.brain-break/settings.json`,
So that all modules have a single, type-safe, tested source of truth for user settings.

**Acceptance Criteria:**

**Given** `domain/schema.ts` (or a new `settings/schema.ts`) is updated  
**When** I import `SettingsFileSchema`  
**Then** it is a Zod schema validating `{ language: string, tone: z.enum(["natural", "expressive", "calm", "humorous", "sarcastic", "robot", "pirate"]), theme: z.enum(["dark", "light"]) }`  
**And** `defaultSettings()` returns `{ language: "English", tone: "natural", theme: "dark" }`  

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
I want a Settings option in the home screen menu that opens a screen where I can configure my language and tone of voice,
So that I can personalise how questions and AI responses are delivered to me.

**Acceptance Criteria:**

**Given** I am on the home screen  
**When** I inspect the menu options  
**Then** a "⚙️  Settings" action is present between "Archived domains" and "☕  Buy me a coffee"  

**Given** I select "⚙️  Settings" from the home screen  
**When** the settings screen loads  
**Then** the terminal is cleared and current settings are read from disk via `readSettings()`  
**And** the screen displays the current values for Language, Tone of Voice, and Theme  

**Given** the settings screen is open  
**When** I edit the Language field  
**Then** I can type any free-text value (e.g. `Greek`, `Japanese`, `Pirate English`)  

**Given** the settings screen is open  
**When** I navigate the Tone of Voice selector  
**Then** I can choose from: Natural, Expressive, Calm, Humorous, Sarcastic, Robot, Pirate — navigated with arrow keys  

**Given** the settings screen is open  
**When** I toggle the 🌓 Theme setting  
**Then** the value switches between Dark and Light  
**And** the change takes effect immediately on the next screen render — no restart required  

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
**And** when `settings.language` is `"English"` and `settings.tone` is `"natural"`, no voice instruction prefix is added (or a neutral one)  

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
I want `utils/format.ts` extended with theme-aware semantic color helper functions for all UI feedback states,
So that every screen can apply consistent, tested color semantics that adapt to the active Dark/Light theme without duplicating chalk logic.

**Acceptance Criteria:**

**Given** `utils/format.ts` is updated  
**When** I call `colorCorrect(text)` with the Dark theme active  
**Then** it returns the text styled in ANSI green  

**Given** `utils/format.ts` is updated  
**When** I call `colorCorrect(text)` with the Light theme active  
**Then** it returns the text styled in bold green  

**Given** `utils/format.ts` is updated  
**When** I call `colorIncorrect(text)`  
**Then** it returns the text styled in ANSI red (same for both themes)  

**Given** `utils/format.ts` exports `colorSpeedTier(tier)`  
**When** called with `"fast"`, `"normal"`, or `"slow"`  
**Then** it returns the text in green/yellow/red respectively (Dark theme) or bold green/bold yellow/red (Light theme)  

**Given** `utils/format.ts` exports `colorDifficultyLevel(level)`  
**When** called with levels 1–5  
**Then** it returns the label styled in: cyan/green/yellow/magenta/red (Dark theme) or blue/bold green/bold yellow/magenta/red (Light theme)  

**Given** `utils/format.ts` exports `colorScoreDelta(delta)`  
**When** called with a positive number  
**Then** it returns the formatted delta string in green (Dark) / bold green (Light)  
**When** called with a negative number  
**Then** it returns the formatted delta string in red (same for both themes)  

**Given** `utils/format.ts` exports `dim(text)`  
**When** called with the Dark theme active  
**Then** it returns the text styled with `chalk.dim`  
**When** called with the Light theme active  
**Then** it returns the text styled with `chalk.gray`  

**Given** `utils/format.ts` exports `header(text)`  
**When** called with the Dark theme active  
**Then** it returns the text styled with `chalk.bold.cyan`  
**When** called with the Light theme active  
**Then** it returns the text styled with `chalk.bold.blue`  

**Given** the active theme is determined by reading `settings.theme` from the current settings  
**When** any color helper is called  
**Then** it uses the active theme's palette without requiring the caller to pass the theme explicitly  

**Given** co-located tests exist in `utils/format.test.ts`  
**When** I run `npm test`  
**Then** all new color helper tests pass for all branches — covering both Dark and Light theme outputs for each helper  

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
**Then** all tests pass, covering: correct answer path uses colorCorrect, incorrect path uses colorIncorrect + colorCorrect reveal, score delta uses colorScoreDelta, speed tier uses colorSpeedTier, difficulty uses colorDifficultyLevel — all color helpers produce the correct output for both Dark and Light themes  

---

### Story 6.4: Theme-Aware Gradient Colors

As a user,
I want the gradient colors used in the Welcome Screen, Exit Message, Static Banner, and ASCII Art to adapt to my chosen theme,
So that gradient visuals remain readable and vibrant on both dark and light terminal backgrounds.

**Acceptance Criteria:**

**Given** `utils/format.ts` defines gradient start/end color constants  
**When** the Dark theme is active  
**Then** the gradient uses cyan `rgb(0, 180, 200)` → magenta `rgb(200, 0, 120)`  

**Given** `utils/format.ts` defines gradient start/end color constants  
**When** the Light theme is active  
**Then** the gradient uses teal `rgb(0, 140, 160)` → magenta `rgb(180, 0, 100)` — darker endpoints for contrast against light backgrounds  

**Given** the Welcome Screen renders its gradient ASCII art (FR31)  
**When** the Light theme is active  
**Then** the art uses the Light theme gradient endpoints instead of the Dark theme defaults  
**And** the fallback for limited color support (chalk level < 3) renders in bold blue (Light) instead of bold cyan (Dark)  

**Given** the Static Banner renders its gradient shadow bar (FR34)  
**When** any theme is active  
**Then** the shadow bar uses the active theme's gradient endpoints  

**Given** the Exit Message renders its gradient ASCII art (FR40)  
**When** any theme is active  
**Then** it uses the active theme's gradient endpoints and fallback color  

**Given** the ASCII Art screen renders the FIGlet art or progress bar (FR48)  
**When** any theme is active  
**Then** `lerpColor` uses the active theme's gradient endpoints  
**And** unfilled progress bar blocks (`░`) use the active theme's dim style (dim for Dark, gray for Light)  

**Given** `utils/format.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: gradient constants return correct RGB values for each theme; fallback color is cyan (Dark) or blue (Light)

---

## Epic 7: Multi-Provider AI Integration

Users can select their preferred AI provider (OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama, or OpenAI Compatible API) at first launch and change it at any time from Settings — all providers are interchangeable behind a unified adapter layer powered by the Vercel AI SDK, with provider-specific error messages and non-blocking validation that lets users explore the full app even before their provider is ready.

### Story 7.1: Settings Schema — Provider Fields

As a developer,
I want `domain/schema.ts` extended with `AiProviderType`, `provider`, `openaiModel`, `anthropicModel`, `geminiModel`, `ollamaEndpoint`, `ollamaModel`, `openaiCompatibleEndpoint`, and `openaiCompatibleModel` fields in the `SettingsFile` schema,
So that the settings store and all downstream modules have a single, type-safe source of truth for multi-provider configuration.

**Acceptance Criteria:**

**Given** `domain/schema.ts` is updated  
**When** I import `AiProviderType`  
**Then** it resolves to the union type `'copilot' | 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openai-compatible'`  
**And** a corresponding `AiProviderTypeSchema` Zod enum is exported  

**Given** `domain/schema.ts` is updated  
**When** I import `SettingsFileSchema`  
**Then** it validates a JSON object with fields: `provider` (nullable `AiProviderType`), `language` (string), `tone` (`ToneOfVoice`), `openaiModel` (string), `anthropicModel` (string), `geminiModel` (string), `ollamaEndpoint` (string), `ollamaModel` (string), `openaiCompatibleEndpoint` (optional string), and `openaiCompatibleModel` (optional string)  

**Given** `domain/schema.ts` is updated  
**When** I call `defaultSettings()`  
**Then** it returns `{ provider: null, language: 'English', tone: 'natural', openaiModel: 'gpt-5.4', anthropicModel: 'claude-opus-4-6', geminiModel: 'gemini-2.5-pro', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama4', theme: 'dark' }`  

**Given** `domain/store.ts` already handles `readSettings()` and `writeSettings()`  
**When** the expanded schema is deployed  
**Then** existing `settings.json` files without `provider`, `openaiModel`, `anthropicModel`, `geminiModel`, `ollamaEndpoint`, `ollamaModel`, `openaiCompatibleEndpoint`, or `openaiCompatibleModel` fields are handled gracefully — missing fields fall back to defaults via Zod `.default()` or post-parse merge  

**Given** `domain/schema.test.ts` is updated  
**When** I run `npm test`  
**Then** all schema tests pass, covering: `AiProviderType` enum validation, expanded `SettingsFileSchema` valid input, `defaultSettings()` output includes all 8 fields, backward compatibility with settings files missing provider fields  

---

### Story 7.2: AI Provider Abstraction Layer

As a developer,
I want `ai/providers.ts` to define an `AiProvider` interface and implement 6 provider adapters (4 via Vercel AI SDK + 1 custom Copilot + 1 OpenAI Compatible via Vercel AI SDK with `@ai-sdk/openai-compatible`) with a `createProvider()` factory and `validateProvider()` readiness check,
So that all AI calls are routed through a unified interface and adding a new provider requires only implementing the adapter — no changes to business logic.

**Acceptance Criteria:**

**Given** `ai/providers.ts` is implemented  
**When** I import `AiProvider`  
**Then** it is an interface with a single method: `generateCompletion(prompt: string): Promise<string>`  

**Given** `ai/providers.ts` is implemented  
**When** I call `createProvider(settings)` with `settings.provider = 'openai'`  
**Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `@ai-sdk/openai`  

**Given** `ai/providers.ts` is implemented  
**When** I call `createProvider(settings)` with `settings.provider = 'anthropic'`  
**Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `@ai-sdk/anthropic`  

**Given** `ai/providers.ts` is implemented  
**When** I call `createProvider(settings)` with `settings.provider = 'gemini'`  
**Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `@ai-sdk/google`  

**Given** `ai/providers.ts` is implemented  
**When** I call `createProvider(settings)` with `settings.provider = 'ollama'`  
**Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `ollama-ai-provider`, using `settings.ollamaEndpoint` and `settings.ollamaModel`  

**Given** `ai/providers.ts` is implemented  
**When** I call `createProvider(settings)` with `settings.provider = 'copilot'`  
**Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses the `@github/copilot-sdk` directly (custom adapter, not Vercel AI SDK)  

**Given** `ai/providers.ts` is implemented  
**When** I call `createProvider(settings)` with `settings.provider = 'openai-compatible'`  
**Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `@ai-sdk/openai-compatible`, using `settings.openaiCompatibleEndpoint` and `settings.openaiCompatibleModel`, and reads the API key from the `OPENAI_COMPATIBLE_API_KEY` environment variable  

**Given** `ai/providers.ts` is implemented  
**When** I call `createProvider(settings)` with `settings.provider = null`  
**Then** it returns `{ ok: false, error: AI_ERRORS.NO_PROVIDER }`  

**Given** `ai/providers.ts` exports `validateProvider(providerType, settings)`  
**When** called with `providerType = 'openai'`  
**Then** it checks for the `OPENAI_API_KEY` environment variable and returns `{ ok: true }` if present, `{ ok: false, error: <auth message> }` if missing  

**Given** `validateProvider()` is called with `providerType = 'anthropic'`  
**When** the function runs  
**Then** it checks for the `ANTHROPIC_API_KEY` environment variable  

**Given** `validateProvider()` is called with `providerType = 'gemini'`  
**When** the function runs  
**Then** it checks for the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable  

**Given** `validateProvider()` is called with `providerType = 'ollama'`  
**When** the function runs  
**Then** it tests connection to `settings.ollamaEndpoint` and returns success/failure accordingly  

**Given** `validateProvider()` is called with `providerType = 'openai-compatible'`  
**When** the function runs  
**Then** it checks for the `OPENAI_COMPATIBLE_API_KEY` environment variable, then tests connection to `settings.openaiCompatibleEndpoint` and returns success/failure accordingly  

**Given** `validateProvider()` is called with `providerType = 'copilot'`  
**When** the function runs  
**Then** it checks Copilot SDK authentication readiness  

**Given** `ai/providers.ts` is the **only** module that imports provider SDKs  
**When** I grep the codebase for Vercel AI SDK or Copilot SDK imports  
**Then** they appear only in `ai/providers.ts` — no other module imports provider SDKs directly  

**Given** `ai/providers.test.ts` exists  
**When** I run `npm test`  
**Then** all tests pass, covering: `createProvider()` for all 6 providers (SDK mocked), null provider error, `validateProvider()` success and failure for each provider type  

---

### Story 7.3: Provider-Agnostic AI Client

As a developer,
I want `ai/client.ts` refactored to use `createProvider()` from `ai/providers.ts` instead of importing the Copilot SDK directly, and `AI_ERRORS` expanded with per-provider network and authentication error messages,
So that the AI client is fully provider-agnostic and returns clear, actionable error messages for any provider failure.

**Acceptance Criteria:**

**Given** `ai/client.ts` is refactored  
**When** I inspect its imports  
**Then** it imports from `ai/providers.ts` (`createProvider`) and `ai/prompts.ts` — it does **not** import any provider SDK directly (`@github/copilot-sdk`, `ai`, `@ai-sdk/*`, `ollama-ai-provider`, `@ai-sdk/openai-compatible`)  

**Given** `ai/client.ts` is refactored  
**When** `generateQuestion(domain, difficultyLevel, existingHashes, previousQuestions, settings)` is called  
**Then** it calls `createProvider(settings)` to get the active adapter  
**And** calls `provider.generateCompletion(prompt)` to get the raw response  
**And** strips JSON fences and validates with `QuestionResponseSchema` (Zod)  
**And** returns `Result<Question>` — same interface as before  

**Given** the configured provider is unreachable  
**When** `generateQuestion()` catches a network error  
**Then** it classifies the error and returns `{ ok: false, error: AI_ERRORS.NETWORK_<PROVIDER> }` with the provider-specific message  

**Given** the configured provider returns an authentication failure  
**When** `generateQuestion()` catches an auth error  
**Then** it returns `{ ok: false, error: AI_ERRORS.AUTH_<PROVIDER> }` with the provider-specific message  

**Given** `AI_ERRORS` is expanded  
**When** I import it  
**Then** it contains the following constants:  
- `NO_PROVIDER` — "AI provider not ready. Go to Settings to configure."  
- `PARSE` — "Received an unexpected response from the AI provider. Please try again."  
- `NETWORK_COPILOT`, `NETWORK_OPENAI`, `NETWORK_ANTHROPIC`, `NETWORK_GEMINI` — provider-specific network error messages  
- `NETWORK_OLLAMA` — function that takes endpoint URL and returns a message  
- `NETWORK_OPENAI_COMPATIBLE` — function that takes endpoint URL and returns a message  
- `AUTH_COPILOT`, `AUTH_OPENAI`, `AUTH_ANTHROPIC`, `AUTH_GEMINI`, `AUTH_OLLAMA`, `AUTH_OPENAI_COMPATIBLE` — provider-specific auth error messages  

**Given** `generateMotivationalMessage(trigger, settings)` exists  
**When** it is called  
**Then** it also uses `createProvider(settings)` — not the Copilot SDK directly  

**Given** `ai/client.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: success path via `createProvider()`, per-provider network error classification, per-provider auth error classification, parse error, `NO_PROVIDER` when provider is null  

---

### Story 7.4: First-Launch Provider Setup Screen

As a user,
I want a one-time Provider Setup screen on first launch where I can select my AI provider and have it validated,
So that I can start using the app with my preferred provider without editing config files.

**Acceptance Criteria:**

**Given** I launch the app for the first time (no `~/.brain-break/settings.json` exists)  
**When** the app starts  
**Then** it reads settings (which returns `defaultSettings()` with `provider: null`), detects `provider === null`, and displays the Provider Setup screen before the home screen  

**Given** the Provider Setup screen is displayed  
**When** I inspect the screen  
**Then** the terminal is cleared and a heading explains this is first-time setup  
**And** a list of 6 providers is shown: GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama, OpenAI Compatible API — navigable with arrow keys  
**And** below the provider list, a line separator is shown followed by a **⏭️ Skip — set up later in ⚙️ Settings** option  

**Given** I select "⏭️ Skip" from the provider list  
**When** the selection is confirmed  
**Then** settings are saved with `provider: null` (no connection test is performed)  
**And** the app navigates directly to the home screen  
**And** all features except Play are accessible — attempting Play shows: "AI provider not ready. Go to Settings to configure."  

**Given** I select "OpenAI" from the provider list  
**When** the selection is confirmed  
**Then** `validateProvider('openai', settings)` is called  
**And** if `OPENAI_API_KEY` env var is present → the user is presented with a select box offering 3 predefined models (pre-selected default `gpt-5.4`) plus a "🧙 Custom model" option and a "↩️ Back" option → success message displayed, provider and model saved to `settings.json`, app proceeds to home screen  
**And** if `OPENAI_API_KEY` env var is missing → message displayed: "Set the `OPENAI_API_KEY` environment variable and restart the app." — **🔄 Retry** and **⏭️ Skip** options are shown; selecting Retry re-runs the connection test, selecting Skip saves settings with `provider: null` and proceeds to the home screen  

**Given** I select "Anthropic" from the provider list  
**When** validation runs  
**Then** it checks for `ANTHROPIC_API_KEY` — same success/failure pattern as OpenAI, with model select box pre-selecting `claude-opus-4-6`  

**Given** I select "Google Gemini" from the provider list  
**When** validation runs  
**Then** it checks for `GOOGLE_GENERATIVE_AI_API_KEY` — same success/failure pattern, with model select box pre-selecting `gemini-2.5-pro`  

**Given** I select "GitHub Copilot" from the provider list  
**When** validation runs  
**Then** it checks Copilot SDK authentication — displays auth status message  

**Given** I select "Ollama" from the provider list  
**When** the selection is confirmed  
**Then** I am prompted for endpoint URL (pre-filled `http://localhost:11434`) and model name (pre-filled `llama4`)  
**And** the app tests connection to the endpoint  
**And** if reachable → success message, settings saved (including `ollamaEndpoint` and `ollamaModel`), app proceeds to home screen  
**And** if unreachable → message displayed: "Could not reach Ollama at [endpoint]. Ensure Ollama is running." — **🔄 Retry** and **⏭️ Skip** options are shown; selecting Retry re-runs the connection test, selecting Skip saves settings with `provider: null` and proceeds to the home screen  

**Given** I select "OpenAI Compatible API" from the provider list  
**When** the selection is confirmed  
**Then** the app checks for the `OPENAI_COMPATIBLE_API_KEY` environment variable  
**And** if present → I am prompted for endpoint URL (free-text, required) and model name (free-text, required)  
**And** the app tests connection to the endpoint using OpenAI-compatible chat completions format  
**And** if reachable → success message, settings saved (including `openaiCompatibleEndpoint` and `openaiCompatibleModel`), app proceeds to home screen  
**And** if unreachable → message displayed: "Could not reach the OpenAI Compatible API at [endpoint]. Check your connection and endpoint URL and try again." — **🔄 Retry** and **⏭️ Skip** options are shown  
**And** if `OPENAI_COMPATIBLE_API_KEY` env var is missing → message displayed: "Set the `OPENAI_COMPATIBLE_API_KEY` environment variable and restart the app." — **🔄 Retry** and **⏭️ Skip** options are shown  

**Given** validation fails for any provider  
**When** I select **⏭️ Skip**  
**Then** settings are saved with `provider: null` and the app proceeds to the home screen  
**And** all features except Play are accessible — attempting Play shows: "AI provider not ready. Go to Settings to configure." and returns to the domain sub-menu  

**Given** the app is launched subsequently (settings.json exists with a non-null provider)  
**When** the app starts  
**Then** the Provider Setup screen is **not** shown — the app goes directly to the home screen  

**Given** `screens/provider-setup.ts` has co-located tests  
**When** I run `npm test`  
**Then** all tests pass, covering: screen renders on null provider, all 6 provider selections, skip option present below separator, skip saves null provider and navigates to home, validation success and failure paths, retry on failure re-runs test, skip on failure saves null provider, Ollama endpoint/model prompts, OpenAI Compatible API endpoint/model prompts, settings saved after selection, `clearScreen()` called  

---

### Story 7.5: Settings Screen — Provider Configuration

As a user,
I want to change my AI provider from the Settings screen at any time — including configuring Ollama's endpoint and model — with the same validation that runs on first launch,
So that I can switch providers or fix configuration issues without restarting the app.

**Acceptance Criteria:**

**Given** I am on the Settings screen  
**When** I inspect the available options  
**Then** an "AI Provider" selector is present as the first configuration option, above Language and Tone of Voice  
**And** it shows the currently configured provider name  

**Given** I select the AI Provider option  
**When** the provider selector opens  
**Then** I can choose from 6 providers via arrow key navigation: GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama, OpenAI Compatible API  

**Given** I select a new provider (e.g., "Anthropic")  
**When** the selection is confirmed  
**Then** `validateProvider('anthropic', settings)` is called  
**And** the user is presented with a select box offering 3 predefined models (labelled Fast / Normal / Complex) plus a "🧙 Custom model" option for free-text entry and a "↩️ Back" option (pre-selects the current or default model)
**And** a success or failure message is displayed (same validation as first-launch setup)  
**And** the provider selection and model are updated in the in-memory settings (persisted on Save)  

**Given** I select "Ollama" as the provider  
**When** the selection is confirmed  
**Then** I am prompted to edit the endpoint URL (pre-filled with current `ollamaEndpoint`) and model name (pre-filled with current `ollamaModel`)  
**And** validation tests the connection  
**And** the Ollama-specific fields are updated in the in-memory settings  

**Given** I select "OpenAI Compatible API" as the provider  
**When** the selection is confirmed  
**Then** I am prompted to edit the endpoint URL and model name (both free-text, required)  
**And** validation checks for the `OPENAI_COMPATIBLE_API_KEY` environment variable and tests connection to the endpoint  
**And** the `openaiCompatibleEndpoint` and `openaiCompatibleModel` fields are updated in the in-memory settings  

**Given** I select "GitHub Copilot" as the provider  
**When** the selection is confirmed  
**Then** no model prompt is displayed — Copilot manages models internally  
**And** validation checks Copilot authentication  

**Given** I have changed the provider on the Settings screen  
**When** I select "Save"  
**Then** `writeSettings()` persists the new provider, per-provider model field (if applicable), `ollamaEndpoint`, `ollamaModel` (if applicable), `openaiCompatibleEndpoint`, and `openaiCompatibleModel` (if applicable) alongside language and tone  
**And** I am returned to the home screen  
**And** the new provider takes effect on the next AI call — no app restart required  

**Given** I have changed the provider on the Settings screen  
**When** I select "Back" (or press Ctrl+C)  
**Then** no changes are written and I return to the home screen with the original provider still active  

**Given** `screens/settings.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: AI Provider option present on Settings screen, provider selector renders all 6 options, provider change triggers validation, hosted providers prompt for model name with defaults, Ollama prompts for endpoint/model, OpenAI Compatible API prompts for endpoint/model, Save persists provider and model, Back discards provider change, `clearScreen()` called  

---

### Story 7.6: Router & Startup Flow — Provider Setup Wiring

As a developer,
I want `router.ts` and `index.ts` updated to detect a null provider on startup and route to the Provider Setup screen before the home screen,
So that the first-launch flow is fully wired and subsequent launches skip setup automatically.

**Acceptance Criteria:**

**Given** `router.ts` is updated  
**When** I inspect its exports  
**Then** a new `showProviderSetup()` function is exported that calls `screens/provider-setup.ts`  

**Given** `index.ts` is updated  
**When** the app starts  
**Then** it calls `readSettings()` as the first operation  
**And** if `settings.provider === null` → calls `router.showProviderSetup()` → then calls `router.showHome()`  
**And** if `settings.provider !== null` → calls `router.showHome()` directly  

**Given** the startup flow is wired  
**When** the Provider Setup screen saves a provider and returns  
**Then** `router.showHome()` is called immediately — the home screen loads with the newly saved provider active  

**Given** the startup flow is wired  
**When** the Provider Setup screen fails validation and the user selects **⏭️ Skip**  
**Then** settings are saved with `provider: null` and `router.showHome()` is called — the user sees the home screen and can explore all features except Play  

**Given** the startup flow is wired  
**When** the Provider Setup screen skip option is selected from the provider list (without selecting a provider)  
**Then** settings are saved with `provider: null` and `router.showHome()` is called — same behavior as skip-after-failure  

**Given** `router.ts` dependency rules are enforced  
**When** I inspect `router.ts` imports  
**Then** it imports from `screens/provider-setup.ts` (new) — never from `ai/` or `domain/` directly (exception: `domain/store.ts` for archiveDomain/deleteDomain as established)  

**Given** `router.test.ts` and `index.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: null provider routes to provider setup then home, non-null provider routes directly to home, `showProviderSetup()` function exists and calls the provider setup screen  

---

### Epic 8: Welcome & Exit Screens + Static Banner

When enabled, branded launch/exit screens frame the session: a Welcome Screen on startup and an Exit Message screen on explicit home Exit, both sharing the same visual language (gradient ASCII art, styled subtitle, version, and shadow bar). Every normal app screen renders a persistent static banner (`🧠🔨 Brain Break` + gradient shadow bar) at the top of the terminal, providing consistent visual branding across navigation states.

**FRs covered:** FR31, FR32, FR33, FR34, FR40
**FRs updated:** FR15 (Settings screen label renamed to Welcome & Exit Screen toggle), FR17 (settings defaults include `showWelcome: true`)
**NFRs covered:** NFR5 (banner rendering after terminal reset on all screens except Welcome/Exit/Provider Setup)
**Additional requirements covered:** `screens/welcome.ts` — Welcome Screen; `screens/exit.ts` — Exit Message screen; `utils/screen.ts` — `banner()` and `clearAndBanner()` utilities; `utils/format.ts` — gradient utilities; `domain/schema.ts` — `showWelcome` boolean in `SettingsFile`; `index.ts` — startup flow checks `showWelcome`; `router.ts` — `showWelcome()` and `showExit()` routes

### Story 8.1: Welcome Screen

As a user,
I want a branded splash screen shown on every app launch (when enabled) that displays the app name in gradient-colored ASCII art, a tagline, and the version number,
So that I get a polished, recognizable first impression of the app and can confirm I'm running the expected version.

**Acceptance Criteria:**

**Given** `screens/welcome.ts` is implemented  
**When** the app launches and `settings.showWelcome` is `true`  
**Then** the Welcome Screen is displayed after Provider Setup (if shown) and before the home screen  

**Given** `screens/welcome.ts` is implemented  
**When** the Welcome Screen renders  
**Then** the terminal is fully cleared via `clearScreen()` (not `clearAndBanner()`)  
**And** the screen displays in order: the app emoji branding (`🧠🔨`), a 5-line ASCII art rendering of "Brain Break" with each row colored using a cyan-to-magenta gradient (`rgb(0,180,200)` → `rgb(200,0,120)`) via `lerpColor()`, a blank line, the styled tagline `> Train your brain, one question at a time_` where `>` is bold cyan, the body text is dim white rendered via typewriter effect, and `_` is bold cyan — matching FR31, the version string (e.g., `v1.2.0`) in dim white, and a gradient shadow bar spanning the terminal width (capped at 80 columns)  

**Given** the Welcome Screen is displayed  
**When** the user presses Enter (via a single `select` prompt with a "Press enter to continue..." choice)  
**Then** the Welcome Screen is dismissed and the app proceeds to the home screen  

**Given** the Welcome Screen is displayed  
**When** the user presses Ctrl+C  
**Then** the app exits cleanly with code 0  

**Given** `settings.showWelcome` is `false`  
**When** the app launches  
**Then** the Welcome Screen is skipped entirely — the app proceeds directly from Provider Setup (if needed) to the home screen  

**Given** the terminal has limited color support (`chalk.level < 3`)  
**When** the Welcome Screen renders the ASCII art  
**Then** the art renders in bold cyan as a fallback instead of true-color gradient  

**Given** `domain/schema.ts` is updated  
**When** I inspect `SettingsFileSchema`  
**Then** it includes `showWelcome: z.boolean().default(true)`  
**And** `defaultSettings()` returns `showWelcome: true`  

**Given** the Settings screen is open  
**When** I inspect the available options  
**Then** a "🎬 Welcome & Exit screen: ON/OFF" toggle is present  
**And** toggling it flips the `showWelcome` value in-memory  
**And** saving persists the new value to `settings.json`  

**Given** `index.ts` is updated  
**When** the startup flow reaches the welcome check  
**Then** it reads `settings.showWelcome` and conditionally calls `router.showWelcome()` before `router.showHome()`  

**Given** `router.ts` is updated  
**When** I inspect its exports  
**Then** a `showWelcome()` function is exported that calls `screens/welcome.ts`'s `showWelcomeScreen()`  

**Given** co-located tests exist in `screens/welcome.test.ts`, `index.test.ts`, and `router.test.ts`  
**When** I run `npm test`  
**Then** all tests pass, covering: Welcome Screen renders when showWelcome is true, skipped when false, `clearScreen()` called (not `clearAndBanner()`), press-enter dismisses, Ctrl+C exits cleanly, gradient fallback on low chalk level, settings toggle persists showWelcome, startup flow conditionally routes to welcome  

---

### Story 8.2: Static Banner

As a user,
I want every screen in the app to display a consistent branded header at the top of the terminal,
So that the app feels polished and I always know I'm in Brain Break regardless of which screen I'm on.

**Acceptance Criteria:**

**Given** `utils/screen.ts` exports `banner()` and `clearAndBanner()`  
**When** `banner()` is called  
**Then** it prints `🧠🔨 Brain Break` in bold text followed by a gradient shadow bar (cyan-to-magenta, spanning the terminal width capped at 80 columns) using `gradientShadow()` from `utils/format.ts`  

**Given** `utils/screen.ts` exports `clearAndBanner()`  
**When** `clearAndBanner()` is called  
**Then** it calls `clearScreen()` followed by `banner()` — clearing the terminal and rendering the banner at the top  

**Given** the home screen renders  
**When** the screen is drawn  
**Then** `clearAndBanner()` is called before any content — the banner is visible at the top  

**Given** the domain sub-menu renders  
**When** the screen is drawn  
**Then** `clearAndBanner()` is called before any content  

**Given** the quiz screen renders (question display or post-answer feedback)  
**When** the screen is drawn  
**Then** `clearAndBanner()` is called before any content  

**Given** the history screen renders  
**When** the screen is drawn  
**Then** `clearAndBanner()` is called before any content  

**Given** the stats dashboard renders  
**When** the screen is drawn  
**Then** `clearAndBanner()` is called before any content  

**Given** the archived domains screen renders  
**When** the screen is drawn  
**Then** `clearAndBanner()` is called before any content  

**Given** the settings screen renders  
**When** the screen is drawn  
**Then** `clearAndBanner()` is called before any content  

**Given** the coffee supporter screen renders  
**When** the screen is drawn  
**Then** `clearAndBanner()` is called before any content  

**Given** the Welcome Screen renders  
**When** the screen is drawn  
**Then** `clearScreen()` is called (not `clearAndBanner()`) — the Welcome Screen renders its own branded layout without the static banner  

**Given** the Exit Message screen renders  
**When** the screen is drawn  
**Then** `clearScreen()` is called (not `clearAndBanner()`) — the Exit Message screen renders its own branded layout without the static banner  

**Given** the Provider Setup screen renders  
**When** the screen is drawn  
**Then** `clearScreen()` is called (not `clearAndBanner()`) — the Provider Setup screen renders its own layout  

**Given** `utils/format.ts` exports gradient utilities  
**When** I import `lerpColor`, `gradientShadow`, and `getGradientWidth`  
**Then** `lerpColor(t)` interpolates between cyan `rgb(0, 180, 200)` and magenta `rgb(200, 0, 120)` for `t` in `[0, 1]`  
**And** `gradientShadow(width)` returns a string of `▀` characters with per-character gradient coloring (or empty string on `chalk.level < 3`)  
**And** `getGradientWidth()` returns `Math.min(process.stdout.columns || 60, 80)`  

**Given** co-located tests exist  
**When** I run `npm test`  
**Then** all tests pass, covering: `banner()` output contains "Brain Break", `clearAndBanner()` calls `clearScreen()` then `banner()`, all screen modules call `clearAndBanner()` on render (except Welcome, Exit Message, and Provider Setup which call `clearScreen()`)  

---

### Story 8.3: Exit Message Screen

As a user,
I want a branded farewell screen when I choose Exit from the home screen,
So that app termination feels intentional and visually consistent with the Welcome experience.

**Acceptance Criteria:**

**Given** I am on the home screen and `settings.showWelcome` is `true`  
**When** I select `Exit`  
**Then** an Exit Message screen is displayed before the process terminates  

**Given** the Exit Message screen is displayed  
**When** it renders  
**Then** it uses `clearScreen()` (not `clearAndBanner()`)  
**And** it displays in order: `🧠🔨`, gradient ASCII "Brain Break" (cyan→magenta with bold-cyan fallback on limited terminals), styled subtitle `> Train your brain, one question at a time_`, a dim status line indicating automatic exit in 3 seconds, version in dim white, and a gradient shadow bar  

**Given** the Exit Message screen is displayed  
**When** 3 seconds elapse  
**Then** the app exits with code 0  

**Given** the Exit Message screen is displayed  
**When** I press Enter  
**Then** the app exits immediately with code 0  

**Given** the Exit Message screen is displayed  
**When** I press Ctrl+C  
**Then** the app exits immediately with code 0  

**Given** `settings.showWelcome` is `false`  
**When** I select `Exit` from the home screen  
**Then** the app exits immediately with code 0 and does not show the Exit Message screen  

**Given** co-located tests exist in `screens/exit.test.ts`, `router.test.ts`, and `screens/home.test.ts`  
**When** I run `npm test`  
**Then** all tests pass, covering: conditional rendering by `showWelcome`, 3-second auto-exit, Enter immediate exit, Ctrl+C immediate exit, and `clearScreen()` usage without static banner  

---

## Epic 9: Session Summary

After completing a quiz or challenge sprint session, the domain sub-menu displays a one-time ephemeral session summary block between the domain header and the action menu — giving every session a tangible result before the user decides what to do next.

**FRs covered:** FR39
**FRs updated:** FR3 (post-session domain sub-menu return includes session summary for both Play and Challenge)
**NFRs covered:** NFR5 (session summary renders within the domain sub-menu's standard `clearAndBanner()` flow)
**Additional requirements covered:** `screens/domain-menu.ts` — session summary rendering and ephemeral state management; `utils/format.ts` — `formatTotalTimePlayed`, `formatAccuracy`, `colorDifficultyLevel`, `colorCorrect`, `colorIncorrect` reused from Stats Dashboard; `screens/quiz.ts` and `screens/challenge.ts` — session data collection (start difficulty, question records, sprint config) passed back to domain menu

### Story 9.1: Session Summary Display

As a user,
I want to see a compact summary of my quiz session on the domain sub-menu immediately after finishing a quiz,
So that I get instant feedback on how the session went — score change, accuracy, speed, and difficulty progression — without navigating to a separate screen.

**Acceptance Criteria:**

**Given** I have completed a quiz session (answered at least 1 question and selected Back)  
**When** the domain sub-menu renders for the first time after the quiz  
**Then** a session summary block is displayed between the domain header and the action menu  

**Given** the session summary is displayed  
**When** I inspect its contents  
**Then** the following fields are shown in order, using the same `bold('Label:') + ' value'` format as the Stats Dashboard (Feature 7):  
1. **Score delta:** net score change for the session — displayed in green (positive) using `colorCorrect` or red (negative) using `colorIncorrect`  
2. **Questions answered:** count of questions answered in the session  
3. **Correct / Incorrect:** correct count and incorrect count (e.g., `5 / 2`)  
4. **Accuracy:** percentage of correct answers (e.g., `71.4%`) — formatted using `formatAccuracy`  
5. **Fastest answer:** shortest response time in the session (e.g., `3.2s`) — displayed in green  
6. **Slowest answer:** longest response time in the session (e.g., `12.8s`) — displayed in red  
7. **Session duration:** total time from first question displayed to last answer submitted — formatted using `formatTotalTimePlayed`  
8. **Difficulty:** starting difficulty level → ending difficulty level with directional indicator (e.g., `2 — Elementary → 3 — Intermediate ▲`) — difficulty labels use `colorDifficultyLevel`; ▲ displayed in green, ▼ displayed in red, — displayed in yellow when difficulty is unchanged  

**Given** the session summary is displayed  
**When** I inspect the summary block framing  
**Then** it is framed by dim horizontal divider lines (e.g., `── Last Session ──────`) rendered using `dim()`  

**Given** the session summary was displayed on the first domain sub-menu render after a quiz  
**When** I navigate to History, Statistics, or any other screen and return to the domain sub-menu  
**Then** the session summary is no longer displayed — only the standard domain header and action menu are shown  

**Given** the session summary was displayed on the first domain sub-menu render after a quiz  
**When** I exit to the home screen and re-select the same domain  
**Then** the session summary is no longer displayed  

**Given** I started a quiz session but answered 0 questions (selected Back immediately on the first question via Ctrl+C)  
**When** the domain sub-menu renders  
**Then** no session summary is displayed  

**Given** `screens/quiz.ts` is updated  
**When** `showQuiz()` returns  
**Then** session data is available to the caller: the list of `QuestionRecord` entries created during the session, and the difficulty level at the start of the session  
**And** this data is passed to `showDomainMenuScreen()` so it can render the session summary  

**Given** `screens/domain-menu.ts` is updated  
**When** `showDomainMenuScreen(slug, sessionData?)` is called with session data  
**Then** on the first render, the session summary is printed after `clearAndBanner()` and the domain header but before the `select()` prompt  
**And** on subsequent loop iterations (after navigating to History/Stats/Archive and back), the session data is cleared and the summary is not re-rendered  

**Given** `screens/domain-menu.ts` is updated  
**When** `showDomainMenuScreen(slug)` is called without session data (e.g., from home screen selection)  
**Then** no session summary is displayed — the domain sub-menu renders normally  

**Given** `screens/domain-menu.test.ts`, `screens/quiz.test.ts`, and `utils/format.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: session summary displayed after quiz with ≥1 answer, summary not displayed after quiz with 0 answers, summary not displayed on subsequent domain sub-menu renders, summary not displayed when entering domain from home screen, all 8 fields rendered with correct values and colors, dim divider lines present, `formatTotalTimePlayed` and `formatAccuracy` reused from stats, `colorDifficultyLevel` used for difficulty labels, difficulty ▲/▼/— indicator colored correctly, session data passed from quiz to domain menu  

---

## Epic 10: Question Bookmarking

Users can bookmark any answered question to flag it for later revisiting — from the quiz post-answer screen or from history navigation. Bookmarked questions are accessible via a dedicated Bookmarks screen in the domain sub-menu, with navigation identical to History. Bookmarks are per-domain, stored as a boolean flag on each question record, with no cap on count.

**FRs covered:** FR41, FR42, FR43
**FRs updated:** FR3 (Bookmarks added to domain sub-menu), FR8 (Bookmark option in quiz post-answer), FR11 (bookmarked field on question record), FR12 (Bookmark option in history navigation), FR35 (Bookmark option in post-explanation quiz navigation), FR37 (Bookmark option in post-explanation history navigation)
**NFRs covered:** NFR5 (bookmarks navigation included in terminal reset screens)
**Additional requirements covered:** `domain/schema.ts` — `bookmarked` boolean field on `QuestionRecord`; `screens/bookmarks.ts` — Bookmarks screen; `screens/quiz.ts` — Bookmark/Remove bookmark in post-answer navigation; `screens/history.ts` — Bookmark/Remove bookmark in history navigation; `screens/domain-menu.ts` — Bookmarks action added; `router.ts` — `showBookmarks()` route

### Story 10.1: Question Record — Bookmarked Field

As a developer,
I want the `QuestionRecord` schema extended with a `bookmarked` boolean field (default: `false`),
So that every question can be flagged for later revisiting and the flag persists across sessions.

**Acceptance Criteria:**

**Given** `domain/schema.ts` is updated  
**When** I inspect `QuestionRecordSchema`  
**Then** it includes a `bookmarked` field of type `z.boolean().default(false)`  

**Given** existing domain JSON files do not have a `bookmarked` field on question records  
**When** they are loaded via `readDomain()`  
**Then** Zod applies the default value `false` — existing records are backward compatible with no migration required  

**Given** `domain/schema.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: `bookmarked` field present in schema, default value `false`, explicit `true`/`false` accepted, backward compatibility with records missing the field  

---

### Story 10.2: Bookmark Toggle in Quiz Post-Answer

As a user,
I want a Bookmark / Remove bookmark option in the quiz post-answer navigation so I can flag interesting or tricky questions during the quiz,
So that I can build a curated list of questions to revisit later without interrupting my quiz flow.

**Acceptance Criteria:**

**Given** I have answered a quiz question and the feedback panel is displayed  
**When** I inspect the post-answer navigation options  
**Then** four options are shown: "▶️  Next question", "💡 Explain answer", "⭐ Bookmark" (or "⭐ Remove bookmark" if already bookmarked), and "🚪 Back"  

**Given** I select "⭐ Bookmark"  
**When** the action is triggered  
**Then** the `bookmarked` field on the current question record is set to `true`  
**And** the domain file is updated via `writeDomain()` immediately  
**And** the navigation menu re-renders with "⭐ Remove bookmark" replacing "⭐ Bookmark"  
**And** a ⭐ indicator appears next to the question text on the current screen  

**Given** I select "⭐ Remove bookmark" on a bookmarked question  
**When** the action is triggered  
**Then** the `bookmarked` field is set to `false`  
**And** the domain file is updated via `writeDomain()` immediately  
**And** the navigation menu re-renders with "⭐ Bookmark" replacing "⭐ Remove bookmark"  
**And** the ⭐ indicator is removed from the question text  

**Given** the explanation has been displayed for the current question  
**When** I inspect the post-explanation navigation options  
**Then** four options are shown: "📚 Teach me more", "▶️  Next question", "⭐ Bookmark" (or "⭐ Remove bookmark"), and "🚪 Back"  

**Given** the micro-lesson has been displayed for the current question  
**When** I inspect the post-micro-lesson navigation options  
**Then** three options are shown: "▶️  Next question", "⭐ Bookmark" (or "⭐ Remove bookmark"), and "🚪 Back" — Teach me more is removed  

**Given** `screens/quiz.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: Bookmark option present in post-answer navigation, bookmark toggle updates record and domain file, Remove bookmark available when already bookmarked, ⭐ indicator shown/hidden, bookmark option persists through explanation and micro-lesson states  

---

### Story 10.3: Bookmark Toggle in History Navigation

As a user,
I want a Bookmark / Remove bookmark option in the history navigation so I can flag past questions for targeted review,
So that I can curate my study list from my full question history.

**Acceptance Criteria:**

**Given** I am viewing a question in the history screen  
**When** the navigation controls are displayed  
**Then** the options include Previous, Next, Explain answer, Bookmark (or Remove bookmark if already bookmarked), and Back  

**Given** the question is not bookmarked  
**When** I select "⭐ Bookmark"  
**Then** the `bookmarked` field is set to `true` and the domain file is updated immediately  
**And** a ⭐ indicator appears next to the question text  
**And** the navigation menu re-renders with "⭐ Remove bookmark"  

**Given** the question is already bookmarked  
**When** I select "⭐ Remove bookmark"  
**Then** the `bookmarked` field is set to `false` and the domain file is updated immediately  
**And** the ⭐ indicator is removed from the question text  
**And** the navigation menu re-renders with "⭐ Bookmark"  

**Given** the explanation has been displayed for the current history question  
**When** the navigation menu re-appears  
**Then** the options include Teach me more, Previous, Next, Bookmark (or Remove bookmark), and Back  

**Given** `screens/history.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: Bookmark option present in all history navigation states, toggle updates record and domain file, ⭐ indicator shown/hidden, bookmark option persists through explanation and micro-lesson states  

---

### Story 10.4: Bookmarks Screen

As a user,
I want a "Bookmarks" option in the domain sub-menu that opens a screen showing only my bookmarked questions with the same navigation as History,
So that I can quickly access and review the questions I've flagged for targeted study.

**Acceptance Criteria:**

**Given** I am on the domain sub-menu  
**When** I inspect the available actions  
**Then** a "⭐ Bookmarks" action is present after "📜 History" and before "📊 Statistics"  

**Given** the domain has bookmarked questions  
**When** I select "⭐ Bookmarks"  
**Then** `screens/bookmarks.ts` loads and displays only questions where `bookmarked === true`  
**And** questions are displayed one at a time with Previous/Next/Explain answer/Remove bookmark/Back controls  
**And** a progress indicator shows the current position (e.g., "Bookmark 2 of 8")  
**And** each entry displays all fields recorded per question (see FR11) with the ⭐ indicator  

**Given** I am viewing a bookmarked question  
**When** I select "Explain answer"  
**Then** the same AI explain flow as History is triggered — explanation displayed inline, followed by Teach me more option  

**Given** I am viewing a bookmarked question  
**When** I select "⭐ Remove bookmark"  
**Then** the `bookmarked` field is set to `false` and the domain file is updated immediately  
**And** the bookmarks list is refreshed — the current view navigates to the next bookmarked question (or previous if it was the last)  
**And** the progress indicator updates to reflect the reduced count  

**Given** I remove the last remaining bookmark  
**When** the bookmarks list becomes empty  
**Then** a message is displayed: "No bookmarked questions." with a Back action  
**And** selecting Back returns me to the domain sub-menu  

**Given** the domain has no bookmarked questions  
**When** I select "⭐ Bookmarks"  
**Then** a message is displayed: "No bookmarked questions." with a Back action  
**And** selecting Back returns me to the domain sub-menu  

**Given** I am on the bookmarks screen  
**When** I select "Back"  
**Then** I return to the domain sub-menu  

**Given** I press Ctrl+C on the bookmarks screen  
**When** the exit is detected  
**Then** the app handles it gracefully and returns to the domain sub-menu  

**Given** `router.ts` is updated  
**When** I inspect its exports  
**Then** a `showBookmarks(slug)` function is exported that calls `screens/bookmarks.ts`  

**Given** `screens/domain-menu.ts` is updated  
**When** `showDomainMenuScreen()` renders the domain sub-menu  
**Then** the "⭐ Bookmarks" action routes to `router.showBookmarks(slug)`  

**Given** `screens/bookmarks.test.ts`, `screens/domain-menu.test.ts`, and `router.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: Bookmarks action present in domain sub-menu, bookmarks screen renders only bookmarked questions, navigation identical to history (Previous/Next/Explain/Back), Remove bookmark updates record and refreshes list, empty state displayed when no bookmarks, progress indicator reflects bookmark count, `clearAndBanner()` called on render, Back returns to domain sub-menu, Ctrl+C handled gracefully, router exports `showBookmarks`  

---

## Epic 11: Challenge Mode (Sprint)

Users can launch a timed sprint session from the domain sub-menu — configuring a sprint size (5/10/20) and sprint duration (2/5/10 min), with all N questions preloaded upfront before the sprint starts. A visible countdown timer runs throughout the sprint without pausing; post-answer navigation is limited to Next question and Back. The sprint ends when questions run out or time expires. Only answered questions are stored in domain history; the session summary shows the sprint completion result.

**FRs covered:** FR44, FR45, FR46
**FRs updated:** FR3 (Challenge added to domain sub-menu), FR39 (Sprint result field 9 added for Challenge sessions)
**NFRs covered:** NFR2 (AI provider error during preload → domain sub-menu, no sprint started), NFR5 (sprint setup screen + sprint question/post-answer screens in terminal reset list)
**Additional requirements covered:** `screens/sprint-setup.ts` — sprint setup screen (sprint duration + sprint size selectors, Confirm/Back); `screens/challenge.ts` — sprint execution loop with visible countdown timer and limited nav; `ai/client.ts` — `preloadQuestions(N, domain, settings)` batch preload; `domain/scoring.ts` — auto-submit timed-out question with slow+incorrect multiplier; `screens/domain-menu.ts` — Challenge action routes to sprint setup, sprint session data (including sprint config, N, answeredCount) fed to session summary; `router.ts` — `showChallenge(slug)` route

---

### Story 11.1: Sprint Setup Screen

As a user,
I want a sprint setup screen accessible from the domain sub-menu where I can configure the number of questions and sprint duration before starting a timed sprint,
So that I can define the exact scope of my sprint and start with clear expectations.

**Acceptance Criteria:**

**Given** I am on the domain sub-menu  
**When** I inspect the available actions  
**Then** a "⚡ Challenge" action is present immediately after "▶️  Play"  

**Given** I select "⚡ Challenge"  
**When** the sprint setup screen loads  
**Then** `clearAndBanner()` is called and the sprint setup screen renders  
**And** the screen displays two parameter selectors navigated via arrow keys:  
  - **Sprint duration:** 2 min / 5 min / 10 min  
  - **Sprint size:** 5 / 10 / 20  
**And** the screen provides two actions: **Confirm** and **Back**  

**Given** I am on the sprint setup screen  
**When** I select "Back"  
**Then** I am returned to the domain sub-menu without starting a sprint and without triggering any question preloading  

**Given** I am on the sprint setup screen  
**When** I press Ctrl+C  
**Then** the app handles it gracefully and returns to the domain sub-menu  

**Given** `router.ts` is updated  
**When** I inspect its exports  
**Then** a `showChallenge(slug)` function is exported that calls `screens/sprint-setup.ts`  

**Given** `screens/domain-menu.ts` is updated  
**When** `showDomainMenuScreen()` renders the domain sub-menu  
**Then** the "⚡ Challenge" action routes to `router.showChallenge(slug)`  

**Given** `screens/sprint-setup.test.ts`, `screens/domain-menu.test.ts`, and `router.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: Challenge action present in domain sub-menu after Play, sprint setup screen renders with duration and size selectors, Back returns to domain sub-menu, Ctrl+C handled gracefully, `clearAndBanner()` called on render, `showChallenge()` exported from router  

---

### Story 11.2: Question Preloading

As a developer,
I want `ai/client.ts` to export a `preloadQuestions(N, domain, difficultyLevel, existingHashes, settings)` function that generates all N questions upfront before the sprint starts,
So that the full question set is ready before the countdown begins and the sprint is never interrupted by AI generation latency.

**Acceptance Criteria:**

**Given** `ai/client.ts` exports `preloadQuestions(N, domain, difficultyLevel, existingHashes, settings)`  
**When** called  
**Then** it generates N questions sequentially using the same `generateQuestion()` logic as the quiz loop (same deduplication hash check, same fail-closed verification gate, same 3-attempt candidate budget per question)  
**And** returns `Result<Question[]>` — `{ ok: true, data: Question[] }` when all N questions are ready  
**And** returns `{ ok: false, error: <provider-specific or generation error> }` if any question exhausts its verification budget or the AI provider is unreachable during preloading  

**Given** the sprint setup screen receives a Confirm selection  
**When** preloading begins  
**Then** an `ora` spinner is displayed (e.g., "Preparing sprint questions…") while `preloadQuestions()` runs  
**And** the spinner stops and the sprint begins once all N questions are successfully generated  

**Given** `preloadQuestions()` returns `{ ok: false }` (provider error during preload)  
**When** the error is received in the sprint setup screen  
**Then** the provider-specific or generation error message (from NFR2 / `AI_ERRORS`) is displayed  
**And** the user is returned to the domain sub-menu — no sprint is started  

**Given** `preloadQuestions()` completes successfully  
**When** the N questions are returned  
**Then** none of their hashes are added to the domain's deduplication store at this point — hashes are only committed when a question is answered and `writeDomain()` is called (see Story 11.4)  

**Given** `ai/client.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: `preloadQuestions()` returns N valid verified questions, fail-closed verification and bounded retries applied to each, retry exhaustion mid-preload returns `{ ok: false }`, spinner displayed during preload, and the error returns the user to the domain sub-menu  

---

### Story 11.3: Sprint Execution Loop

As a user,
I want to work through a sprint of preloaded questions with a visible countdown timer that never pauses — with only Next question and Back available after each answer — so that the time pressure is constant and I can focus purely on answering.

**Acceptance Criteria:**

**Given** all N questions are preloaded and the sprint is starting  
**When** the first question is displayed  
**Then** `clearAndBanner()` is called and the question renders at the top of the terminal  
**And** a visible countdown timer in `M:SS` format (e.g., `4:32`) is rendered prominently above or below the question  
**And** the timer begins counting down from the configured sprint duration at the moment the first question is displayed  

**Given** a question is displayed during the sprint  
**When** I choose one of the 4 answer options (A–D)  
**Then** the silent per-question timer stops and `timeTakenMs` is recorded (individual answer time — not time elapsed on the sprint clock)  
**And** `applyAnswer()` is called to compute `scoreDelta` and `updatedMeta`  
**And** the post-answer feedback is rendered **on the same screen** as the question — no terminal clear or `clearAndBanner()` between question and feedback  
**And** the feedback shows: correct/incorrect status, correct answer reveal (if wrong), time taken, speed tier (based on the individual `timeTakenMs` and `speedThresholds`), and score delta  
**And** the **countdown timer remains visible** on the post-answer screen and continues counting down  

**Given** the post-answer feedback is displayed  
**When** I inspect the navigation options  
**Then** exactly two options are shown: **▶️  Next question** and **🚪 Back** — no Explain answer, Bookmark, Remove bookmark, or Teach me more options  

**Given** I select "▶️  Next question"  
**When** the next question loads  
**Then** `clearAndBanner()` is called, the next preloaded question is displayed, and the countdown timer continues from its current value (it was never paused)  

**Given** I select "🚪 Back" during an active sprint  
**When** the action is triggered  
**Then** the sprint exits immediately — no further questions are displayed and no further scoring occurs  
**And** the user is returned to the domain sub-menu with session data for the session summary  

**Given** `screens/challenge.test.ts` is updated  
**When** I run `npm test`  
**Then** all tests pass, covering: countdown timer rendered on question screen and post-answer screen, timer continues during post-answer (no pause), per-question speed tier uses individual answer time, post-answer nav limited to Next/Back (no Explain/Bookmark/Teach), `clearAndBanner()` called on each new question (not on post-answer), Back exits sprint immediately  

---

### Story 11.4: Sprint Termination & History

As a user,
I want the sprint to end cleanly on any termination condition — all questions answered, timer expired, or Back — with all answered questions saved to history and the session summary showing my sprint result,
So that I always get accurate feedback and my progress is correctly recorded regardless of how the sprint ended.

**Acceptance Criteria:**

**Given** I answered the last (Nth) question in the sprint  
**When** I select Next question (or the post-answer screen is displaying for the final question)  
**Then** the sprint completes normally — no further question is shown  
**And** the user is returned to the domain sub-menu  
**And** the session summary (FR39) is displayed on first domain sub-menu render with the Sprint result field: `Completed N / N questions` in green  

**Given** the sprint countdown timer reaches zero while a question is displayed (unanswered)  
**When** the timer hits `0:00`  
**Then** the current question is auto-submitted as incorrect  
**And** `applyAnswer()` is called with `isCorrect: false` and a `timeTakenMs` equal to the remaining question display time (treated as a slow answer — slow + incorrect multiplier)  
**And** the sprint ends immediately and the user is returned to the domain sub-menu  
**And** the session summary displays: Sprint result `Time expired — X / N questions answered` in red  

**Given** the sprint countdown timer reaches zero while the post-answer feedback is displayed  
**When** the timer hits `0:00`  
**Then** the sprint ends immediately — the current question has already been answered and recorded  
**And** the user is returned to the domain sub-menu  
**And** the session summary displays: Sprint result `Time expired — X / N questions answered` in red  

**Given** the sprint ends (for any reason)  
**When** domain persistence occurs  
**Then** only questions that were answered (correctly, incorrectly, or auto-submitted as timed-out) are written to the domain history with all FR11 fields  
**And** preloaded questions that were never displayed to the user are discarded — their hashes are **not** added to the domain's `hashes` array  
**And** `writeDomain()` is called once per answered question (after each answer, as in the regular quiz loop) — not in a single batch at sprint end  
**And** score and difficulty level accumulated during the sprint are reflected in the final domain state  

**Given** the auto-submitted timed-out question is written to domain history  
**When** its `QuestionRecord` is inspected  
**Then** `isCorrect` is `false`, `userAnswer` reflects the auto-submit (e.g., `"TIMEOUT"`), `timeTakenMs` is the elapsed display time, `speedTier` is `"slow"`, and `scoreDelta` matches the slow + incorrect formula  

**Given** `screens/challenge.ts` feeds session data back to the domain menu  
**When** `showDomainMenuScreen(slug, sessionData)` is called after a sprint  
**Then** `sessionData` includes: all answered `QuestionRecord` entries, starting difficulty level, sprint config `{ timeBudgetMs, questionCount }`, and `answeredCount`  
**And** the session summary renders field 9 (Sprint result) using `answeredCount` and `questionCount`  

**Given** `screens/challenge.test.ts`, `screens/domain-menu.test.ts`, and `domain/scoring.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: normal completion (all N answered) → green sprint result; timer-expired mid-question → auto-submit incorrect + red sprint result; timer-expired mid-post-answer → sprint ends, correct count unchanged; Back exit → sprint ends, answers so far recorded; unanswered preloaded questions not in history, hashes not stored; `writeDomain()` called per answered question; auto-submitted record has correct fields; session summary receives sprint config and renders Sprint result field correctly

---

## Epic 12: ASCII Art

Users can select an ASCII Art option from the domain sub-menu to view their progress toward unlocking FIGlet ASCII art for the domain name. The art unlocks after 100 cumulative correct answers — until then, the menu label shows a gradient progress bar with percentage, and the screen displays a motivational message with progress. Once unlocked, the screen renders FIGlet ASCII art colored with the app's signature cyan-to-magenta gradient.

### Story 12.1: ASCII Art Screen

As a user,
I want the ASCII Art option in the domain sub-menu to show my progress toward unlocking it, and once I've answered 100 questions correctly, I want to see a FIGlet-rendered ASCII art banner of my domain name colored in cyan-to-magenta gradient,
So that I have a rewarding milestone to work toward and a fun, personalized visual once I've earned it.

**Acceptance Criteria:**

**Given** the domain sub-menu is displayed for a domain with fewer than 100 correct answers  
**When** I view the list of actions  
**Then** a `🎨 ASCII Art` option appears after `📊 Statistics` and before `🗄  Archive`  
**And** the label includes a compact cyan-to-magenta gradient progress bar with percentage (e.g., `🎨 ASCII Art [████░░░░░░] 42%`)  

**Given** the domain sub-menu is displayed for a domain with 100 or more correct answers  
**When** I view the list of actions  
**Then** the ASCII Art label displays `🎨 ASCII Art ✨`  

**Given** I select `🎨 ASCII Art` from the domain sub-menu and the domain has fewer than 100 correct answers  
**When** the screen renders  
**Then** the screen clears and displays:
  - A header: `🎨 ASCII Art — <domain>` (using `header()`, same pattern as Statistics)  
  - A motivational message: `🔒 ASCII Art unlocks when you've answered 100 questions correctly in this domain!`  
  - A progress line: `You're at X% — keep going!` where X is the current percentage  
  - A larger gradient progress bar using `lerpColor` from cyan to magenta for filled blocks (`█`) and dim styling for unfilled blocks (`░`)  
  - A separator and a `←  Back` choice  

**Given** the locked ASCII Art screen is displayed  
**When** I select `←  Back` or press Ctrl+C  
**Then** I am returned to the domain sub-menu  

**Given** I select `🎨 ASCII Art` from the domain sub-menu and the domain has 100 or more correct answers  
**When** the screen renders  
**Then** the domain name is rendered as ASCII art using `figlet.textSync()` with a randomly selected font from a curated list of 14 FIGlet fonts  
**And** the screen clears and displays:
  - A header: `🎨 ASCII Art — <domain>` (using `header()`, same pattern as Statistics)  
  - The rendered ASCII art, colored row-by-row using `lerpColor` from cyan (top) to magenta (bottom)  
  - A `🔄 Regenerate` choice  
  - A separator  
  - A `←  Back` choice  

**Given** the unlocked ASCII art screen is displayed  
**When** I select `🔄 Regenerate`  
**Then** the domain name rerenders immediately using a different font from the same curated list  

**Given** the unlocked ASCII art screen is displayed  
**When** I select `←  Back` or press Ctrl+C  
**Then** I am returned to the domain sub-menu  

**Given** I select `🎨 ASCII Art`  
**When** the screen renders (locked or unlocked)  
**Then** rendering is local and instant — no network calls, no loading spinner, no AI dependency  

**Given** `src/screens/ascii-art.ts` and related test files are created  
**When** I run `npm test`  
**Then** all tests pass, covering: ASCII Art label shows progress bar when locked; ASCII Art label shows sparkle when unlocked; selecting it when locked shows motivational message with progress bar; selecting it when unlocked renders FIGlet art with gradient coloring; Regenerate rerenders with a different font; Back returns to domain sub-menu; Ctrl+C returns to domain sub-menu

### Story 12.3: ASCII Art Milestone Setting

As a user,
I want to configure the ASCII Art unlock milestone in Settings with three options — Instant (0 questions), Quick (10 questions), and Classic (100 questions) — so that I can choose how much effort is required to unlock ASCII Art for each domain.

**Acceptance Criteria:**

**Given** I open the Settings screen  
**When** I view the list of settings  
**Then** a `🎨 ASCII Art Milestone` selector is displayed before the `🎬 Welcome & Exit screen` toggle  
**And** it shows the currently active option name (Instant / Quick / Classic)  

**Given** I select the ASCII Art Milestone setting  
**When** the selector opens  
**Then** three options are shown: `Instant (0 questions)`, `Quick (10 questions)`, `Classic (100 questions)`  
**And** the current value is pre-selected  

**Given** I select `Classic (100 questions)` (the default)  
**When** I save settings  
**Then** `asciiArtMilestone` is stored as `100` in `settings.json`  
**And** ASCII Art requires 100 cumulative correct answers to unlock per domain  

**Given** I select `Instant (0 questions)`  
**When** I save settings  
**Then** `asciiArtMilestone` is stored as `0` in `settings.json`  
**And** ASCII Art is immediately unlocked for all domains (label shows `🎨 ASCII Art ✨`)  

**Given** I select `Quick (10 questions)`  
**When** I save settings  
**Then** `asciiArtMilestone` is stored as `10` in `settings.json`  
**And** ASCII Art requires 10 cumulative correct answers to unlock per domain  

**Given** a domain has 50 correct answers and I change the milestone from Classic (100) to Quick (10)  
**When** the domain sub-menu renders  
**Then** the ASCII Art label shows `🎨 ASCII Art ✨` (retroactively unlocked)  

**Given** a domain has 50 correct answers and I change the milestone from Quick (10) to Classic (100)  
**When** the domain sub-menu renders  
**Then** the ASCII Art label shows the progress bar with 50% (retroactively re-locked)  

**Given** the locked ASCII Art screen is displayed  
**When** the motivational message renders  
**Then** the message dynamically reflects the configured threshold, e.g., "🔒 ASCII Art unlocks when you've answered 10 questions correctly!" (not hardcoded to 100)  

**Given** the progress bar is displayed (locked screen or domain sub-menu label)  
**When** correctCount exceeds the configured threshold  
**Then** the progress bar and percentage are capped at 100%  

**Given** `asciiArtMilestone` is missing from `settings.json` (existing users upgrading)  
**When** the settings file is loaded  
**Then** the schema applies the default value of `100` — existing behavior is preserved  

**Given** the Settings screen, ASCII Art screen, and domain menu are updated  
**When** I run `npm test`  
**Then** all existing tests pass with no regressions, and new tests cover: schema validation for `asciiArtMilestone` (0/10/100 accepted, other values rejected, default 100); settings screen shows milestone selector; ASCII Art locked/unlocked behavior with different thresholds; domain menu label adapts to threshold; motivational message reflects configured value; progress bar caps at 100%
