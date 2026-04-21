# Party Mode Transcript — Brain Break Mobile Kickoff

**Date:** 2026-04-21
**Participants:** George (user), 📋 John (Product Manager), 🎨 Sally (UX Designer), 🏗️ Winston (Architect)
**Purpose:** Pseudo-input document for the `create-prd` workflow. Captures all decisions made during the party-mode session that produced the Phase 1 Mobile plan. Not a formal artifact — exists to bootstrap downstream workflows without re-interviewing the user on already-settled questions.

---

## 1. Problem & Why Now

- Terminal app is mature and feature-rich.
- **Devs love the terminal version.** Non-dev users ("the rest") are asking for a mobile version.
- Mobile is not a reimagining — it's the same product on a new surface for a different persona.
- Persona sketch: **"Maya"** — non-dev (e.g., marketing lead, 32), commutes, wants glanceable ~20-second learning sessions, opens app during life's pauses, values showing up more than completing.

## 2. Guiding Product Principle (LOCKED)

> **Brain Break Mobile is the same product as Brain Break Terminal, on a new surface.**
> Same features, same names, same menu locations, same mental model. Only input (thumbs vs keyboard) and rendering (pixels vs ANSI) change.

Decision rule for any future design debate: *"Does the terminal do X? If not, don't."*

## 3. Phase 1 Mobile Scope (LOCKED)

### Home menu (exact terminal parity)
- Domain list rows → Domain menu
- ➕ Create new domain
- 🗄 Archived domains
- ⚙️ Settings
- 🍵 Buy me a coffee
- *(🚪 Exit omitted — forced divergence, OS-handled)*

### Domain menu (exact terminal parity)
- ▶️ Play
- 📜 History
- 🔖 Bookmarks
- 📊 Stats *(domain-scoped, not global)*
- 🧑‍🏫 My Coach *(domain-scoped)*
- 🗄 Archive
- 🗑 Delete (with confirmation)

### Inside Play (per question)
- ❓ Explain
- 📚 Teach me more
- 🔖 Bookmark toggle

### Settings
- 🤖 AI Provider *(all terminal providers **except GitHub Copilot**)*
- 🌍 Language
- 🎭 Tone of Voice
- 🏋️ My Coach Scope
- 🎬 Welcome & Exit screen toggle

### Explicitly excluded from Phase 1
- Challenge mode
- ASCII art milestones (and its setting)
- Sprint mode
- Sync (→ Phase 2)
- Theme picker (Phase 1 is dark-only)
- GitHub Copilot provider

### Forced divergences from terminal (platform-imposed, not design choices)
1. No Exit menu item (OS-handled)
2. No GitHub Copilot provider (terminal-only auth mechanism)
3. No theme picker (dark-only for Phase 1)
4. Touch input instead of keyboard selection
5. Native transitions instead of ANSI screen clears

## 4. Architecture (LOCKED)

### Repository
- **pnpm monorepo** with three packages:
  - `packages/core` — platform-agnostic (domain, AI, utils, storage interface)
  - `packages/terminal` — current app, thinned to UI-only
  - `packages/mobile` — Expo + React Native + TypeScript (NEW)

### Migration discipline
- `main` must stay green at every commit during the core-extraction refactor.

### Mobile stack
- **Expo + React Native + TypeScript** (not bare RN, not native-native)
- **File-based routing** via `expo-router`
- **Navigation:** stack navigator (mirrors terminal's linear `router.ts` push/pop model). **No tab bar.**
- **Local storage:** `expo-sqlite`
- **Secrets (API keys):** `expo-secure-store` (keychain / keystore)
- **Charts (Stats):** `victory-native` or `react-native-gifted-charts`
- **Haptics:** `expo-haptics`
- **External links (Buy me a coffee):** `expo-linking`
- **Theme:** dark-only, palette lifted from terminal color tokens. Still use a `theme.ts` tokens file so a future light/high-contrast mode is a one-file flip.

### Storage interface
- `packages/core` defines `IStorageAdapter`.
- Terminal injects `FileSystemAdapter` (wraps existing file-store).
- Mobile injects `SQLiteAdapter`.
- Phase 2 adds `GoogleDriveAdapter` (same contract, no refactor).
- Every domain record must carry a stable **`id` + `updatedAt`** from day one (enables future sync).
- No feature in Phase 1 assumes single-device state globally — per-device/owner-aware from the start.

### AI provider strategy
- Phase 1: **BYO-key only** — same model as terminal.
- The `AiProvider` interface in core already supports pluggable providers. Reserve a provider slot for a future `HostedProxyProvider` (Phase 1.5+) without building the backend now.
- **Acknowledged UX risk:** BYO-key onboarding is a retention cliff for non-dev Maya. Ship-and-measure in Phase 1; revisit in Phase 1.5.
- **Onboarding screen is the single highest-stakes design surface in Phase 1.** Must: (1) explain *why* a key is needed in one sentence, (2) deep-link to each provider's key page, (3) validate the key works before leaving the screen.

## 5. Data & Sync Strategy

- **Phase 1:** local-only on both platforms. Terminal keeps file-based store. Mobile uses SQLite. No cross-device state.
- **Phase 2:** Sync via **user-owned cloud storage (Google Drive first)** — bring-your-own-cloud pattern. No backend operated by us. Same `IStorageAdapter` contract, new adapter. Covers both terminal and mobile.

## 6. Documentation Plan

```
docs/planning-artifacts/
├─ product-principles.md       ← NEW (short, cross-cutting)
├─ product-brief.md            ← existing, may get light update
├─ prd.md                      ← existing, UNCHANGED (terminal)
├─ architecture.md             ← existing, UNCHANGED (terminal)
├─ epics.md                    ← existing (terminal)
├─ ux-design-specification.md  ← existing (terminal)
├─ mobile/                     ← NEW folder
│  ├─ prd.md                   ← THIS WORKFLOW writes here
│  ├─ architecture.md          ← future
│  ├─ epics.md                 ← future
│  └─ ux-design-specification.md  ← future
├─ future-features-backlog.md
└─ ux-cleanup-backlog.md
```

## 7. Recommended Next-Step Order

1. `bmad-create-prd` → `docs/planning-artifacts/mobile/prd.md` *(this workflow)*
2. `bmad-create-architecture` → `docs/planning-artifacts/mobile/architecture.md`
3. `bmad-create-ux-design` → `docs/planning-artifacts/mobile/ux-design-specification.md`

`product-principles.md` can be written as part of step 1 or as a small standalone pass.

## 8. Team Context

- **Solo developer.** All scope/timeline/process decisions must be calibrated to a single-person team.
- Monorepo is "free" at team=1; no coordination tax.

## 9. Design Priority Order (Sally's proposed order for UX spec)

1. Settings → Add Provider (the BYO-key flow) — *gateway to everything*
2. Home
3. Quiz + Explain + Teach Me More — *core loop*
4. Create new domain
5. Stats
6. My Coach
7. History / Bookmarks / Archived / Domain Menu
8. Buy me a coffee

*(To be confirmed / refined during UX-spec workflow, not PRD.)*

## 10. Open Questions Carried Forward

- None blocking PRD. Onboarding-cliff risk is acknowledged and accepted for Phase 1 (ship-and-measure).
- Phase 2 sync (Google Drive) is deferred; PRD should scope it out of Phase 1 but note it as committed future direction.
