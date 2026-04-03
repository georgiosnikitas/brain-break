---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
status: complete
project_name: brain-break
user_name: George
date: '2026-04-03'
lastEdited: '2026-04-03'
inputDocuments:
  - docs/planning-artifacts/product-brief.md
  - docs/planning-artifacts/prd.md
  - docs/planning-artifacts/architecture.md
  - docs/planning-artifacts/epics.md
  - src/index.ts
  - src/router.ts
  - src/domain/schema.ts
  - src/utils/format.ts
  - src/utils/screen.ts
  - src/screens/home.ts
  - src/screens/create-domain.ts
  - src/screens/archived.ts
  - src/screens/domain-menu.ts
  - src/screens/select-domain.ts
  - src/screens/quiz.ts
  - src/screens/question-nav.ts
  - src/screens/history.ts
  - src/screens/bookmarks.ts
  - src/screens/stats.ts
  - src/screens/settings.ts
  - src/screens/provider-setup.ts
  - src/screens/provider-settings.ts
  - src/screens/welcome.ts
  - src/screens/exit.ts
  - src/screens/sprint-setup.ts
  - src/screens/challenge.ts
  - src/screens/ascii-art.ts
---

# UX Design Specification: brain-break

## Purpose

This document captures the implemented UI and UX behavior of `brain-break` as of 2026-04-03.

It is intended to be used by future AI agents as design context when proposing, defining, or implementing features.

Priority of truth:

1. Implemented code in `src/`
2. This document
3. Planning artifacts (`prd.md`, `architecture.md`, `epics.md`, implementation stories)

If a planning document conflicts with the current codebase, the code wins.

## Product UX Summary

`brain-break` is a terminal-native microlearning application. The core experience is a short loop:

- pick or create a domain
- answer one or more AI-generated multiple-choice questions
- get immediate feedback with score and speed information
- optionally request an explanation or deeper lesson
- build a persistent history, score, and streak over time

The UX is optimized for fast, low-friction sessions in a developer terminal rather than long-form study.

## Experience Principles

- Terminal first, not web-like. Screens are compact, dense, and keyboard-driven.
- Fast recovery over hard failure. Most errors keep the app running and route the user back safely.
- Keep the user in context. Quiz feedback, explanations, and micro-lessons render inline instead of opening separate screens.
- Reward momentum. Session summaries, score deltas, speed tiers, and streaks make progress visible.
- Minimize navigation depth. The app mostly uses two menu levels plus focused task screens.
- Preserve branded personality without slowing normal use. Welcome and Exit are atmospheric; most screens are utilitarian.

## Interaction Grammar

### Primary input model

- Arrow keys move through all `select()` menus.
- Enter confirms the current choice.
- Free-text input is used sparingly, mainly for domain creation and provider/model configuration.
- Ctrl+C is treated as an intentional escape path via `ExitPromptError`.

### Default screen pattern

Most functional screens follow this sequence:

1. `clearAndBanner()`
2. screen header via `header()`
3. content block
4. a single primary prompt or menu

This pattern is used by Home, Archived Domains, Statistics, Domain Menu, Settings, Sprint Setup, History, Bookmarks, Coffee, and ASCII Art.

### Branded screen pattern

Welcome and Exit screens intentionally break the normal pattern:

1. `clearScreen()` only
2. large gradient ASCII art
3. typewriter-style line after a `>` prompt marker
4. dim version string
5. gradient shadow bar
6. timed Enter prompt with auto-advance/auto-exit after 3 seconds

### Back behavior

- The app strongly prefers an explicit `←  Back` menu item rather than implicit navigation.
- The Back option is usually last and visually separated by `new Separator()`.
- Ctrl+C usually behaves like Back, except on Home, Welcome, and Exit where it exits the app.

### Loading behavior

- Any networked or AI-backed operation uses `ora` spinners.
- Spinners are short-lived and task-specific: question generation, provider connection test, explanation generation, micro-lesson generation, challenge preloading.
- Async states generally resolve back into the same screen context rather than redirecting elsewhere.

### Error behavior

- User-facing failures are typically printed in red using `colorIncorrect()` or `error()`.
- Most failures are recoverable and followed by a single Back prompt.
- The app prefers warning and continuation over blocking the user permanently.

## Information Architecture

### Startup flow

```text
App start
-> Provider Setup (only if settings.provider is null)
-> Welcome (only if settings.showWelcome is true)
-> Home
```

### Main navigation map

```text
Home
-> Select domain -> Domain Menu
-> Create new domain -> Create Domain -> Home
-> Archived domains -> Archived Domains -> Home
-> Settings -> Settings -> Home
-> Buy me a coffee -> Coffee screen -> Home
-> Exit -> Exit screen or immediate process exit
```

### Domain-level navigation map

```text
Domain Menu
-> Play -> Motivational interstitial -> Quiz -> Domain Menu
-> Challenge -> Sprint Setup -> Challenge Execution -> Domain Menu
-> History -> History navigation -> Domain Menu
-> Bookmarks -> Bookmarks navigation -> Domain Menu
-> Statistics -> Statistics -> Domain Menu
-> ASCII Art -> ASCII Art screen -> Domain Menu
-> Archive -> Home
-> Delete -> Confirmation -> Home or Domain Menu
-> Back -> Home
```

## Shared Visual Language

### Banner

- Standard top banner text: `🧠🔨 Brain Break`
- Rendered in bold text with a cyan-to-magenta gradient shadow bar beneath it
- Used on nearly every non-branded screen
- Current code also uses it on Provider Setup

### Headers

- Most screen titles use `header()`, which renders bold cyan text
- Typical pattern: `<emoji> <screen name> — <slug>`
- Domain Menu is slightly different: `Domain — <slug>` with dim score metadata on the same line

### Menu highlighting

- All select menus use the shared `menuTheme`
- Highlight style is `chalk.inverse(text)`
- The app relies on inverse highlight more than color-coded menu items

### Semantic color system

- Green: success, correct answers, positive score deltas, fast speed tier
- Red: errors, incorrect answers, negative score deltas, slow speed tier
- Yellow: warnings, normal speed tier
- Cyan to red difficulty palette:
  - 1 = Beginner = cyan
  - 2 = Elementary = green
  - 3 = Intermediate = yellow
  - 4 = Advanced = magenta
  - 5 = Expert = red
- Dim gray is used for metadata, separators, timestamps, empty-state labels, and timer text

### Gradient usage

- Welcome and Exit ASCII art use per-line cyan-to-magenta interpolation
- Gradient width is capped at 80 columns
- If truecolor is unavailable, the app falls back to bold cyan text

### Copy style

- Concise, direct, and action-oriented
- Heavy use of emoji for recognition and quick scanning
- Friendly but not verbose
- Empty-state copy is short and literal

## Global UX Rules

### Screen clearing

- `clearScreen()` uses `\x1Bc`, which clears the viewport and scrollback
- Full-screen resets are the default
- The major exception is the learning loop: quiz post-answer feedback, explanations, and micro-lessons intentionally stay on the same screen

### Prompt density

- Menus are short and rarely require more than one immediate decision
- `pageSize` is set to 20 on Home and 15 on Archived Domains to control vertical overflow
- Separators are used aggressively to create breathing room in terminal menus

### Inline learning states

- Explanations and micro-lessons are not separate routes
- They are appended under the current question context, then the action menu is re-shown
- This is a core UX pattern and should be preserved for future learning enhancements

### Persistence visibility

- Domain progress is written before showing quiz feedback
- Bookmark changes are persisted immediately when toggled
- Settings only persist on Save

## Screen Specifications

### 1. Provider Setup

Goal:
Establish a usable AI provider on first launch without blocking the rest of the app.

Entry condition:
Shown only when `settings.provider === null` during startup.

Layout and behavior:

- Uses the standard bannered screen shell, not the branded Welcome shell
- Displays `🔧 First-Time Setup` and a short instructional sentence
- Prompts for provider selection from GitHub Copilot, OpenAI, Anthropic, Google Gemini, or Ollama
- Immediately follows with provider-specific prompts:
  - OpenAI, Anthropic, Gemini: model name input with sensible default
  - Ollama: endpoint URL and model name
  - Copilot: no model prompt
- Runs a connection test spinner
- Shows success or warning copy inline
- Waits 2 seconds, saves settings, and continues startup

UX intent:

- Non-blocking onboarding
- Lets the user move forward even if validation fails
- Keeps setup narrow and practical rather than explanatory

### 2. Welcome

Goal:
Create a branded, high-energy app entrance.

Layout and behavior:

- Clears the screen completely
- Prints emoji branding `🧠🔨`
- Prints five-line gradient ASCII art for the app name
- Prints the tagline as a typewriter line after a `>` prompt marker
- Shows version text
- Shows a gradient shadow bar
- Presents a single Enter choice: `Press enter to continue...`
- Auto-continues after 3 seconds
- Ctrl+C exits the app immediately

UX intent:

- Provide emotional framing at launch
- Stay lightweight by auto-advancing

### 3. Home

Goal:
Act as the central navigation hub and domain dashboard.

Prompt message:
`👨‍💻 Choose a domain:`

Content:

- A list of active domains
- Each domain row shows bold slug plus dim metadata: score and number of questions
- If there are no active domains, the list shows the empty-state separator `No domains yet.`

Actions in implemented order:

- `➕ Create new domain`
- `🗄  Archived domains`
- `⚙️  Settings`
- separator
- `🍵 Buy me a coffee`
- `🚪 Exit`

Behavior notes:

- Selecting a domain opens Domain Menu, not Quiz directly
- Ctrl+C exits the app immediately
- Exit shows the branded Exit screen only when `showWelcome` is enabled

### 4. Create Domain

Goal:
Let the user create a new learning domain with minimal friction and a meaningful starting level.

Flow:

- Input prompt: `New domain name:`
- Validation blocks empty or non-sluggable names
- Duplicate detection compares slugified value against all active and archived domains
- Duplicate warnings are contextual:
  - active duplicate -> `A domain named "<name>" already exists.`
  - archived duplicate -> `A domain named "<name>" already exists in your archived domains.`
- After a unique name is entered, the user selects `Starting difficulty:`
- Difficulty choices are 1 through 5 with labels Beginner through Expert
- Final prompt is `Navigation` with `💾  Save` and `←  Back`

Behavior notes:

- Save creates the domain and prints `Domain "<slug>" created!`
- The screen returns to Home flow rather than opening the new domain automatically
- Ctrl+C returns without creating a domain

UX intent:

- Short linear setup
- Duplicate prevention before any file write
- Difficulty framing at creation time instead of hidden defaults

### 5. Archived Domains

Goal:
Provide a reversible holding area for paused topics.

Header:
`🗄  Archived domains`

Content:

- Archived domain rows mirror Home formatting
- Each row appends `-> Unarchive`
- Empty state uses `No archived domains.`

Behavior notes:

- Unarchive toggles the archived flag off and refreshes the list
- Back returns to Home
- Ctrl+C behaves like Back

### 6. Domain Menu

Goal:
Provide the second-level command center for a specific domain.

Header pattern:
`Domain — <slug>` followed by dim inline metadata `score: <n> · <count> questions`

Actions in implemented order:

- `▶  Play`
- `⏱️  Challenge`
- `📜 History`
- `⭐ Bookmarks`
- `📊 Statistics`
- `🎨 ASCII Art`
- `🗄  Archive`
- `🗑  Delete`
- separator
- `←  Back`

Session summary behavior:

- After Play or Challenge returns session data, the next Domain Menu render shows a one-time `Last Session` summary block above the action menu
- Fields shown:
  - score delta
  - questions answered
  - correct / incorrect
  - accuracy
  - fastest answer
  - slowest answer
  - session duration
  - difficulty change
  - sprint result when the session came from Challenge and timed out

Behavior notes:

- Archive sends the user back to Home
- Delete opens a blocking confirmation prompt
- Ctrl+C from the domain action menu returns to Home

UX intent:

- Domain Menu is the core decision hub after a domain is selected
- It should remain compact and action-heavy

### 7. Play Interstitial

Goal:
Provide a light emotional ramp into a quiz session.

Behavior:

- Shown only when the user is returning within 7 days or score trend is improving
- Generates one or more AI motivational lines
- Uses an `ora` spinner with `Getting your message...`
- Prints successful messages with typewriter output via `typewrite(success(msg))`
- Immediately continues into Quiz

UX intent:

- Feels like a brief encouragement layer, not a full screen
- Should remain skippable by absence of trigger rather than explicit dismissal

### 8. Quiz

Goal:
Deliver the main repeated question-answer-feedback loop.

Header:
`📝 Quiz — <slug>`

Question interaction:

- Each question is shown as a `select()` menu with four answers labeled `A)` through `D)`
- Timing starts when the prompt is rendered and stops on answer
- Ctrl+C exits the session and returns session data if at least one question was answered

Post-answer rendering:

- Uses shared `renderQuestionDetail()`
- Shows answer options with `►` marker on the chosen answer
- Shows correctness line with score delta
- Shows correct answer when the user was wrong
- Shows `Time | Speed | Difficulty`

Post-answer menu order:

- `💡 Explain answer`
- `💫 Bookmark` or `⭐ Remove bookmark`
- `▶️  Next question`
- separator
- `←  Back`

Post-explanation menu order:

- `📚 Teach me more`
- bookmark toggle
- `▶️  Next question`
- separator
- `←  Back`

Post-micro-lesson menu order:

- bookmark toggle
- `▶️  Next question`
- separator
- `←  Back`

Behavior notes:

- Progress is persisted before feedback is shown
- Bookmark toggles are immediate and stay inline
- Explanation failures warn but do not break the quiz
- Micro-lesson failures warn but do not break the quiz

UX intent:

- Keep cognitive focus on the current question
- Avoid screen churn after answering
- Make learning optional but always close at hand

### 9. Challenge Setup

Goal:
Configure a timed sprint quickly.

Header:
`⏱️  Challenge Setup — <slug>`

Flow:

- `Sprint duration:` -> 2 min, 5 min, 10 min
- `Sprint size:` -> 5 questions, 10 questions, 20 questions
- `Ready to start?` -> `🏁  Confirm` or `←  Back`

UX intent:

- Fast preset selection rather than freeform setup
- Make Challenge feel like a mode switch, not a separate product

### 10. Challenge Execution

Goal:
Provide a higher-pressure version of Quiz.

Header:
`⚡ Challenge — <slug>`

Core behavior:

- Questions are preloaded before the sprint starts
- A visible `Time remaining: M:SS` line is shown at the top of each sprint screen
- The timer never pauses
- The same answer feedback renderer is reused after each question

Post-answer menu:

- `▶️  Next question`
- separator
- `←  Back`

Important differences from Quiz:

- No Explain action
- No Teach me more action
- No Bookmark action
- Timeout while answering auto-submits the current question as incorrect
- Timeout during post-answer state ends the sprint immediately

UX intent:

- Preserve familiar question rendering while removing optional depth
- Emphasize urgency via timer persistence and reduced choices

### 11. History

Goal:
Turn past questions into an interactive review surface.

Header:
`📜 History — <slug>`

Content behavior:

- Uses reverse chronological order: newest answered question first
- Displays one question at a time
- Prompt message is `Question X of Y`
- Reuses the same detail renderer as Quiz, but includes timestamp

Navigation choices are dynamic:

- `💡 Explain answer` when no explanation is visible
- `📚 Teach me more` after explanation is visible and before teaching content is shown
- bookmark toggle
- `➡️  Next question` when not at the end
- `⬅️  Previous question` when not at the beginning
- separator
- `←  Back`

Behavior notes:

- Explanation and micro-lesson render inline on the same screen
- Back returns to Domain Menu
- Empty state shows `No questions answered yet`

UX intent:

- Make history a learning tool, not just a log

### 12. Bookmarks

Goal:
Provide a focused review queue for saved questions.

Header:
`⭐ Bookmarks — <slug>`

Content behavior:

- Uses only questions where `bookmarked === true`
- Uses the same reverse chronological order as History: newest bookmarked question first
- Prompt message is `Bookmark X of Y`
- Reuses the same dynamic navigation choices and inline explanation pattern as History

Empty state:

- Shows `No bookmarked questions.` inside a separator-driven menu
- Then routes back to Domain Menu

Behavior notes:

- Ordering is intentional and verified in the Bookmarks tests; future changes should preserve newest-first parity with History
- Removing the bookmark refreshes the filtered collection in place
- If the last bookmark is removed, the user sees the empty state and is returned

UX intent:

- Function as a lightweight study list without introducing a new interaction model

### 13. Statistics

Goal:
Provide a compact, read-only progress dashboard.

Header:
`📊 Statistics — <slug>`

Fields shown when data exists:

- Score
- Questions answered
- Correct / Incorrect
- Accuracy
- Total time played
- Starting difficulty
- Current difficulty
- Score trend (30 days)
- Days since first session
- Return streak

Empty-state placeholders:

- `No data yet` is used for fields that cannot be computed from zero history

Navigation:

- Single `←  Back` action
- Ctrl+C also returns to Domain Menu

UX intent:

- Quick reflective checkpoint, not an analytics workbench

### 14. Settings

Goal:
Let the user tune AI behavior and launch/exit framing globally.

Header:
`⚙️  Settings`

Menu items in implemented order:

- `🤖 AI Provider:   <value>`
- `🌍 Language:      <value>`
- `🎭 Tone of Voice: <value>`
- `🎬  Welcome & Exit screen: ON|OFF`
- separator
- `💾  Save`
- `←  Back`

Provider flow:

- Opens provider select menu
- Runs provider-specific subprompts
- Tests connection with spinner
- Displays a success or warning banner on the next render

Other behavior:

- Language uses free-text input
- Tone uses a fixed preset list
- Welcome toggle flips in memory immediately but only persists on Save
- Save writes settings and returns Home
- Back discards changes and returns Home

UX intent:

- Keep settings shallow and global
- Favor immediate configurability over explanatory detail

### 15. Coffee Screen

Goal:
Provide a lightweight support/donation screen without leaving the app style system.

Content:

- Banner shell
- Friendly heading line: `🍵 Enjoying brain-break? Buy me a coffee!`
- Small ASCII QR code
- Plain-text support URL
- Back-only navigation

UX intent:

- Brief, skippable, and visually different enough to feel like a side quest

### 16. Exit

Goal:
End the session with the same brand language used on startup.

Behavior:

- Uses the same visual shell as Welcome
- Tagline is replaced by a dynamic exit message based on total answered questions
- Presents `Press enter to exit now...`
- Auto-exits after 3 seconds
- Ctrl+C also exits immediately

Message bands:

- 0 questions -> `Break's over, see you next round`
- 1 to 9 questions -> light praise
- 10 to 49 questions -> stronger praise
- 50 to 99 questions -> `absolute brain breaker`
- 100+ questions -> `certified brain breaker`

UX intent:

- Reward completion without adding friction to quitting

### 17. ASCII Art Screen

What exists in code:

- `src/screens/ascii-art.ts` renders FIGlet-style ASCII art banners for a domain using the `figlet` npm package
- Each render randomly picks one font from a curated list of 14 FIGlet fonts
- It uses the standard banner shell
- It colorizes rows with the same cyan-to-magenta gradient system
- `🎨 ASCII Art` action is wired in `src/screens/domain-menu.ts` (after Statistics, before Archive)
- `showAsciiArt()` route exists in `src/router.ts`

Navigation choices:

- `🔄 Regenerate` — re-renders the art with a different font (the previous font is excluded so each regeneration is visibly different)
- separator
- `←  Back`

The screen loops on Regenerate and only exits on Back or Ctrl+C.

UX intent:

- Fun, zero-latency visual reward — no network calls or AI dependency
- Regenerate lets the user browse different font styles without leaving the screen

## Shared Detail Rendering Pattern

Question feedback and review surfaces use a single presentation grammar:

- question text on its own line
- option list with `A)` through `D)`
- `►` marker on the selected answer
- blank separator line
- correctness and score delta line
- correct answer reveal on wrong attempts
- time, speed, and difficulty line
- optional answered-at timestamp on history-style screens

This renderer is central to the product's learning UX and should remain the baseline for any future question-detail surface.

## Empty States

Implemented empty-state copy is intentionally brief:

- Home -> `No domains yet.`
- Archived Domains -> `No archived domains.`
- History -> `No questions answered yet`
- Bookmarks -> `No bookmarked questions.`
- Statistics -> repeated `No data yet` placeholders

Design rule:

- Empty states should remain short, literal, and paired with a clear next action

## Navigation and Escape Rules

- Home Ctrl+C exits process
- Welcome Ctrl+C exits process
- Exit Ctrl+C exits process
- Most other screens interpret Ctrl+C as Back or safe return to the parent route
- Delete confirmation Ctrl+C returns to Home in the current implementation
- Challenge and Quiz return session data when interrupted after answering at least one question

## Implementation Guardrails For Future Features

- Prefer adding new screens to `src/screens/` and exposing them through `src/router.ts`
- Reuse `clearAndBanner()` for functional screens unless the feature is intentionally a branded, full-screen moment
- Keep Back as the final action after a separator
- Use `menuTheme` for every new select prompt
- Use `ora` for any AI or network task that can visibly pause the terminal
- Keep question-adjacent enrichment inline instead of routing away from the current question
- Reuse `renderQuestionDetail()` and `question-nav.ts` for any new question review surface
- Preserve emoji-led labels when adding sibling actions to existing menus
- Keep configuration screens shallow, menu-driven, and global unless there is a strong product reason to create domain-specific settings

## Known Inconsistencies And Technical Debt

These are observations from the current codebase and should not automatically be copied into new work.

Prioritized remediation plan: [ux-cleanup-backlog.md](ux-cleanup-backlog.md).

- Provider Setup currently uses the normal banner shell, even though some planning docs describe it as a banner exception.
- Back label spacing is not perfectly consistent across every prompt (`← Back` vs `←  Back`).
- Some warning/error states print inline without a fresh screen clear, so the visual result depends on what was previously on screen.
- Corrupted domains are filtered out of browsing flows rather than surfaced with dedicated UX.

## Design Implications For New Work

- Additions should feel like extensions of a terminal command center, not like standalone mini-apps.
- The most important continuity points are: banner, cyan header, inverse menu highlight, explicit Back, spinner for async work, and inline learning depth.
- If a feature belongs to a specific domain, it should usually live under Domain Menu.
- If a feature deepens understanding of one question, it should probably stay in the current screen rather than creating a new route.
- If a feature changes global AI behavior, it should live in Settings.

## Summary

`brain-break` is best understood as a branded terminal shell wrapped around a highly focused learning loop. The app's UX strength comes from three things:

- very fast keyboard-first navigation
- strong inline feedback after each answer
- enough personality in branding and copy to make repeated use feel rewarding

Future work should preserve that balance: practical first, playful second, and never so complex that it stops feeling like something you can use in the middle of a short break.
