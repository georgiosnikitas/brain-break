---
status: draft
date: 2026-04-03
author: George
sourceDocuments:
  - docs/planning-artifacts/ux-design-specification.md
  - src/router.ts
  - src/screens/domain-menu.ts
  - src/screens/provider-setup.ts
  - src/screens/history.ts
  - src/screens/bookmarks.ts
  - src/screens/bookmarks.test.ts
  - src/screens/home.ts
  - src/screens/archived.ts
---

# UX Cleanup Backlog

> Scope: implementation cleanup and UX consistency work discovered during the UX audit. This is not a new-feature wishlist. These items exist to tighten the current product and reduce ambiguity for future agents.

---

## Priority Order

1. UXC-02: Surface corrupted domains instead of silently hiding them
2. UXC-03: Standardize recoverable error rendering
3. UXC-05: Decide and enforce the Provider Setup shell contract
4. UXC-06: Normalize Back-label spacing and navigation microcopy

---

## Path To 9/10 Checklist

This checklist defines what must feel true in the product for `brain-break` to move from "strong" to "excellent" UX. It is a quality gate, not a separate priority stack.

### Consistency

- [x] ASCII Art is part of the live information architecture, not latent code
- [x] Bookmarks follows the same newest-first chronology as History
- [ ] Recoverable failures use one shared visual pattern across the app
- [ ] Provider Setup clearly belongs to one screen family instead of sitting between onboarding and utility UI
- [ ] Back labels, prompt titles, and spacing feel standardized enough that the user stops noticing them

### Clarity

- [ ] Corrupted domains are visible and recoverable instead of silently disappearing
- [ ] Warning, success, and blocking-error states are easy to distinguish at a glance
- [ ] Empty states pair the current situation with an obvious next move

### Flow

- [ ] Ctrl+C and `←  Back` behavior feels predictable across startup, menu, quiz, and challenge screen families
- [ ] First-launch setup feels intentionally sequenced from Provider Setup to Welcome to Home
- [ ] Create-domain completion and cancellation paths feel equally clear and low-friction

### Polish

- [ ] Branded moments and functional screens feel like parts of the same system, not separate styling eras
- [ ] Edge states receive the same care as the main quiz loop
- [ ] A final copy, spacing, and separator pass leaves no visible drift between screens

### Exit Criteria

- [ ] UXC-02, UXC-03, UXC-05, and UXC-06 are complete
- [ ] The UX spec and cleanup backlog have no stale contradictions against the codebase
- [ ] A manual walkthrough of Home, Domain Menu, Quiz, History, Bookmarks, Settings, Provider Setup, and Exit reveals no jarring transitions

---

## High Priority

### UXC-01: Complete ASCII Art Integration ✅

**Resolved** — ASCII Art is now fully integrated into the live information architecture:

- `🎨 ASCII Art` action wired in Domain Menu (after Statistics, before Archive)
- `showAsciiArt()` router delegation in place
- Implementation uses `figlet` npm package for local rendering with randomized font selection (no AI dependency)
- All tests pass

---

### UXC-04: Align Bookmarks Ordering With History ✅

**Resolved** — Bookmarks now follows the same newest-first chronology as History:

- `src/screens/bookmarks.ts` reverses domain history before filtering bookmarked records
- the first visible bookmark is the newest bookmarked question
- navigation semantics now match History expectations
- tests explicitly cover newest-first ordering and parity with History

---

### UXC-02: Surface Corrupted Domains Instead Of Silently Hiding Them

Problem:

Corrupted domain files are filtered out of Home and Archived browsing flows. Users can lose visibility of a domain without understanding why it disappeared.

Why it matters:

- Breaks user trust because missing data looks like deletion
- Makes support and debugging harder
- Hides a meaningful recovery path behind implementation detail

Recommended resolution:

Expose corrupted entries explicitly in the UI and give the user a safe, reversible next action.

Acceptance criteria:

- Corrupted domain entries are visible in Home or Archived lists with a clear warning marker
- The UI distinguishes corrupted entries from valid entries at a glance
- Selecting a corrupted entry opens a small recovery flow with at least `Reset domain` and `Back`
- Recovery language explains that corrupted data could not be parsed
- The app never crashes when encountering corrupted domain files

Likely files:

- `src/domain/store.ts`
- `src/screens/home.ts`
- `src/screens/archived.ts`
- `src/router.ts`
- new recovery screen or prompt helper in `src/screens/`

---

### UXC-03: Standardize Recoverable Error Rendering

Problem:

Several recoverable failures print inline over whatever was already on screen. The result depends on prior terminal output and can look messy or ambiguous.

Why it matters:

- Weakens the app's otherwise consistent screen model
- Makes errors harder to scan under stress
- Produces inconsistent UX across AI, storage, and settings flows

Recommended resolution:

Define one reusable recoverable-error pattern and use it everywhere. Prefer a screen reset plus a small message block and a Back action.

Acceptance criteria:

- Recoverable failures clear into a predictable error presentation
- The same visual structure is used for AI generation failures, provider test failures, and other non-fatal blocking errors
- The user always gets one obvious escape path back to the previous menu or parent screen
- Inline warning-only cases remain inline only when they are intentionally non-blocking and low severity

Likely files:

- `src/screens/quiz.ts`
- `src/router.ts`
- `src/screens/ascii-art.ts`
- `src/screens/settings.ts`
- `src/screens/provider-setup.ts`
- possible new helper in `src/utils/` or `src/screens/`

---

## Medium Priority

### UXC-05: Decide And Enforce The Provider Setup Shell Contract

Problem:

Current code renders Provider Setup inside the standard banner shell, while parts of the planning and UX documentation describe Provider Setup as a branded exception that should not use the banner.

Why it matters:

- Creates a mismatch between onboarding design intent and implementation
- Makes first-launch setup feel like a normal settings page instead of a distinct startup step
- Leaves future agents unsure whether to preserve or replace the banner

Recommended resolution:

Make an explicit product decision and then align both code and docs to it. Preferred direction: treat Provider Setup as a startup-only onboarding screen and remove the standard banner from it.

Acceptance criteria:

- A single shell rule for Provider Setup is chosen and documented
- Code follows that rule consistently
- The UX specification and planning artifacts no longer contradict the code
- First-launch flow feels visually intentional rather than accidentally reusing a regular screen shell

Likely files:

- `src/screens/provider-setup.ts`
- `src/utils/screen.ts`
- `docs/planning-artifacts/ux-design-specification.md`
- any planning docs that reference Provider Setup shell behavior

---

## Low Priority

### UXC-06: Normalize Back-Label Spacing And Navigation Microcopy

Problem:

Back labels and some prompt titles are not fully consistent. For example, the codebase mixes `← Back` and `←  Back`.

Why it matters:

- Low-severity issue, but it reduces polish in a UI that depends heavily on repetition and scanning
- Makes new menu additions more likely to drift further

Recommended resolution:

Choose canonical navigation microcopy and normalize the codebase to it.

Acceptance criteria:

- One canonical Back label format is documented and used everywhere
- Prompt titles such as `Navigation`, `Choose an action:`, and similar labels are reviewed for consistency
- Menu spacing remains visually aligned after normalization

Likely files:

- `src/screens/**/*.ts`
- `docs/planning-artifacts/ux-design-specification.md`

---

## Suggested Delivery Waves

### Wave 1

- UXC-02: Surface corrupted domains
- UXC-03: Standardize recoverable error rendering

### Wave 2

- UXC-05: Decide Provider Setup shell contract

### Wave 3

- UXC-06: Normalize Back-label spacing and microcopy

---

## Notes For Future Agents

- Do not treat UXC-01 as optional polish. It resolves a partially implemented feature.
- Do not reopen UXC-04 unless Bookmarks chronology diverges from History again.
- Do not fix UXC-05 by changing docs only. The point is to remove ambiguity between design intent and code.
- If UXC-02 is implemented, update all UX docs so corrupted-domain behavior becomes explicit product behavior instead of hidden engineering behavior.
