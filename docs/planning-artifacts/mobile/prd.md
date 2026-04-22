---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation-skipped', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
classification:
  projectType: 'mobile_app'
  domain: 'edtech'
  domainNote: 'personal learning; not institutional (no COPPA/FERPA/curriculum concerns)'
  complexity: 'medium'
  projectContext: 'brownfield'
inputDocuments:
  - path: 'docs/planning-artifacts/mobile/_party-mode-transcript.md'
    type: 'party-mode-transcript'
    note: 'Locked decisions from 2026-04-21 kickoff session. Primary context source.'
  - path: 'docs/planning-artifacts/prd.md'
    type: 'existing-prd'
    note: 'Terminal PRD. Source of truth for feature parity. Do NOT modify.'
  - path: 'docs/planning-artifacts/architecture.md'
    type: 'existing-architecture'
    note: 'Terminal architecture. Reference for core extraction.'
  - path: 'docs/planning-artifacts/product-brief.md'
    type: 'product-brief'
  - path: 'docs/planning-artifacts/epics.md'
    type: 'existing-epics'
    note: 'Terminal epics (13). Mobile epics will mirror only the subset in Phase 1 scope.'
  - path: 'docs/planning-artifacts/ux-design-specification.md'
    type: 'existing-ux-spec'
    note: 'Terminal UX. Mirrors parity principle.'
  - path: 'docs/planning-artifacts/future-features-backlog.md'
    type: 'backlog'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 5
workflowType: 'prd'
scope: 'mobile'
---

# Product Requirements Document - brain-break (Mobile)

**Author:** George
**Date:** 2026-04-21

## Executive Summary

Brain Break Mobile brings the same trusted, focused, AI-driven micro-learning
experience of Brain Break Terminal to people who don't live in a terminal.
It turns any pocket moment — a commute, a coffee queue, the minute between
meetings — into a 20-second learning break, without compromising a single
feature or shifting the product's soul.

The terminal version has matured into a feature-rich tool loved by developers.
Non-developer users are now explicitly asking for a mobile version. Phase 1
delivers that: a native-feeling iOS and Android app, built on Expo + React
Native, that mirrors the terminal app's menu structure, feature set, and
identity one-to-one — with only platform-forced divergences (no Exit item,
no GitHub Copilot provider, dark-only for now).

The target user is "Maya" — a non-developer, habitual learner who opens the
app 3–5 times a day in short bursts and values *showing up* over completing.
Devs keep the terminal; Maya gets mobile. Same product, two surfaces, one
identity.

### What Makes This Special

1. **Parity as a promise, not a goal.** Unlike typical "companion apps" that
   strip their desktop counterparts down to a viewer, Brain Break Mobile is
   the full product. Every feature present in the terminal — domains,
   history, bookmarks, stats, My Coach, archive, delete, BYO-key AI,
   tone/language/scope settings — ships on mobile. Users will never hear
   *"that's a desktop feature."* Omissions are platform-forced (Exit,
   Copilot, theme picker) or explicitly out-of-phase (Challenge, ASCII art,
   sync) — never the result of convenience.

2. **Your data, your keys, your cloud.** Brain Break never touches user
   data and never charges users. Phase 1 is local-only on each platform
   (file-system on terminal, SQLite on mobile). AI calls use user-provided
   API keys, stored on-device in Keychain / Keystore via `expo-secure-store`.
   Phase 2 introduces user-owned cloud sync via the user's own Google Drive
   — covering both terminal and mobile from one mechanism, with zero backend
   operated by us. This is an explicit trust promise, not a side-effect of
   architecture.

3. **Focus-tool DNA, preserved.** Dark-first, glanceable, ambient. No ads,
   no cross-promotion. The terminal's constraints — focus, simplicity, no
   distractions — were never limitations; they were the product's soul.
   Mobile keeps that soul while swapping only input (thumbs) and rendering
   (pixels).

## Project Classification

| Field | Value |
| --- | --- |
| **Project Type** | Mobile app (iOS + Android, cross-platform via Expo / React Native) |
| **Domain** | EdTech — personal learning (not institutional: no COPPA/FERPA/curriculum concerns apply) |
| **Complexity** | Medium — non-trivial AI integration, secret management, cross-platform architecture, monorepo extraction, and a committed Phase 2 sync path; no regulated-industry burden |
| **Project Context** | Brownfield — expands a shipped, documented terminal product with a new surface; includes a disciplined core-extraction refactor that must keep `main` green at every commit |

## Success Criteria

### User Success

- **Habit formation:** Maya opens the app on ≥3 distinct days per week within her first 30 days.
- **Session success:** A "good session" is defined as a user answering at least one question *and* receiving at least one Explain *or* Teach-me-more follow-up. Target: ≥70% of sessions meet this bar.
- **Onboarding completion (P0 retention metric):** ≥60% of users who download the app successfully configure an AI provider. The BYO-key flow is the most critical single surface in the product; failures here become invisible downstream churn.
- **Qualitative "aha!" moment:** ≥40% of users who complete onboarding create ≥1 bookmark during their first week — a user-declared "this was worth remembering" signal.

### Business Success

Brain Break is a solo-maintained, no-backend, no-monetization product. "Business success" in Phase 1 is framed as sustainability and signal rather than revenue.

- **Zero ongoing operational cost** through Phase 1 (no backend, no hosting, no per-user cost). Architectural by design, not aspirational.
- **Store presence:** Shipped on both Apple App Store and Google Play within Phase 1.
- **Generosity signal:** ≥5 "Buy me a coffee" conversions within the first 3 months — a signal of product love, not revenue.
- **Organic adoption:** ≥100 installs across iOS + Android within 3 months, driven by terminal-user word-of-mouth.
- **No cannibalization:** Terminal app monthly active users do not decline after mobile launch. Mobile is additive.

### Technical Success

- **Binary size:** iOS <50 MB, Android <30 MB.
- **Cold start:** App opens to Home in <2 seconds on a 2-year-old mid-range phone.
- **AI latency:** Question generation p50 <4s, p95 <8s. Variance above this is acceptable when attributable to user-provided keys/networks.
- **Offline graceful degradation:** App launches, shows domains, and allows browsing history/bookmarks with zero network. Only AI-bound actions (play, explain, teach-me-more, coach) require network.
- **Crash-free sessions:** ≥99.5% on both platforms, measured via Apple App Store Connect and Google Play Console Android Vitals native dashboards (no in-app crash SDK).
- **Core extraction safety:** `main` stays green at every commit during the `packages/core` refactor. Terminal app ships with zero regressions throughout.
- **Zero schema drift:** `@brain-break/core` is the single source of truth for the domain schema. Neither terminal nor mobile defines a domain field independently.

### Measurable Outcomes

3-month post-launch scorecard:

| Metric | Target |
| --- | --- |
| iOS + Android installs | ≥100 |
| Onboarding completion rate | ≥60% |
| 30-day active users (D30) | ≥30% of installs |
| Users with ≥1 bookmark in week 1 | ≥40% of onboarded users |
| "Buy me a coffee" conversions | ≥5 |
| Crash-free sessions | ≥99.5% |
| Terminal app MAU change | No decline vs pre-mobile baseline |
| Core regressions in terminal | 0 |

## Product Scope

### MVP — Minimum Viable Product (= Phase 1)

- **Surfaces:** Home, Create domain, Archived domains, Domain menu, Play (quiz), Explain, Teach me more, History, Bookmarks, Stats (domain-scoped), My Coach (domain-scoped), Archive, Delete, Settings, Buy me a coffee.
- **AI:** BYO-key for all terminal-supported providers *except* GitHub Copilot. Keys validated on setup; stored on-device in Keychain (iOS) / Keystore (Android) via `expo-secure-store`.
- **Storage:** Local-only. SQLite on mobile, file-system on terminal. Both injected through a common `IStorageAdapter` defined in `@brain-break/core`.
- **Theme:** Dark-only. Color tokens lifted 1:1 from the terminal palette.
- **Architecture:** pnpm monorepo (`packages/core` / `packages/terminal` / `packages/mobile`). Main-green-always during core extraction.
- **Telemetry:** No in-app crash SDK, no behavioral analytics. Crash metrics read from Apple App Store Connect and Google Play Console dashboards only. Honors the "your data" promise with the strongest possible interpretation: we collect nothing.
- **Release:** iOS App Store + Google Play. Organic promotion via terminal-user word-of-mouth.

### Growth Features (Post-MVP — Phase 2)

- **Cross-platform sync via user-owned Google Drive** (BYOC pattern — covers terminal and mobile simultaneously, no backend operated by us).
- **Opt-in gentle reminder / streak notifications.** Hard commitment: user-initiated, never behavioral manipulation.
- **Challenge mode** on mobile.
- **ASCII art milestones** reimagined for mobile.

## User Journeys

Brain Break Mobile is a single-user, solo-consumer product with no backend, no multi-tenancy, no roles, and no public API. User-type coverage is therefore intentionally narrow: **two personas, three journeys.**

### Persona 1 — Maya Reyes (primary)

32, marketing lead at a mid-sized company, based in Barcelona. Learns Spanish verbs on her commute, is curious about behavioral economics, and occasionally wants to understand the tech her engineer partner builds. She has tried Duolingo (lost interest to streak anxiety), Coursera (started 2 courses, finished 0), and Medium (saves articles, never reads them). She downloaded Brain Break on a Sunday after her partner demoed the terminal version. She is not technical but is fluent on iPhone.

**What she wants.** To feel like she's growing her mind in the small moments of her day, without another app nagging her, manipulating her with streaks, or trying to upsell her.

**What's in her way.** Every other learning app feels like a product trying to own her attention. She needs a tool that respects that she only has 30 seconds right now, and 30 seconds tomorrow, and that's enough.

#### Journey A — Maya's first successful learning session (happy path)

**Opening.** Monday, 8:14 AM. Maya stands on the train platform, coffee in her left hand, phone in her right. Her partner set up her Brain Break the night before. Two domains are already on her Home screen: *"Spanish irregular verbs"* and *"Behavioral economics."*

**Rising action.**
1. She opens Brain Break. Home appears in under two seconds. Dark background, two clean domain cards showing score and question count.
2. She taps *"Spanish irregular verbs."* The Domain menu slides in: Play · History · Bookmarks · Stats · My Coach · Archive · Delete.
3. She taps **Play**. A question loads in ~3 seconds: *"Conjugate 'poder' in the preterite, first-person singular."* Four options.
4. She taps *"pude."* Correct. Haptic buzz. A small green check. A one-liner from the coach: *"Nice — pude trips up a lot of learners."*

**Climax.** Maya feels curious about *why* it's "pude" and not the regular "podí". She taps **Explain.** A short, clear explanation appears in ~3 seconds, fitting on her screen without scrolling. She taps **Teach me more.** A longer, richer piece of context follows. She reads it, almost forgets she's on a train, and when she looks up her train has arrived. She taps **Bookmark** — "I want to come back to this." The icon fills in. Haptic tick. She pockets the phone.

**Resolution.** Maya spent about 90 seconds in the app. She got one right, learned *why*, and marked it to revisit. She did not encounter a single sales screen, streak pressure, ad, or upgrade prompt. The app respected her time. She will open it again at lunch.

**Capabilities this journey requires:**
- Home screen reading domains from local storage
- Domain menu routing to feature screens
- Quiz screen (render question, capture answer, update score/history)
- Inline correct/incorrect feedback with haptics
- Coach one-liner rendering (contextual to domain)
- Explain flow (AI call with latency-aware UX)
- Teach-me-more flow (AI call)
- Bookmark toggle with persistence
- Network-latency-tolerant loading states

#### Journey B — Maya's BYO-key onboarding (the retention cliff)

**Opening.** Sunday, 7:40 PM. Maya has just installed Brain Break from the App Store. She opens it for the first time. Her partner is in the kitchen; she wants to get going on her own.

**Rising action.**
1. The app launches to a Welcome screen (default `showWelcome: ON`): a short greeting, dark background, one primary CTA — *"Set up your AI provider to get started."*
2. She taps it. A screen titled "Choose an AI provider" lists OpenAI, Anthropic, Google Gemini, Ollama, and an OpenAI-compatible endpoint. Each row has a one-line description.
3. Above the list is a contextual explainer: *"Brain Break uses AI to create and check your questions. You bring your own key so your learning stays yours — and so we never charge you."*
4. Below the list is a secondary CTA: *"I don't know what to pick — help me choose."* Tapping it reveals a short explainer screen with a plain-language recommendation (*"If you're not sure, use OpenAI — it's the most popular"*) and a direct link to OpenAI's API key page.

**Climax.** She picks OpenAI. The next screen shows a text field for the API key and a helper line: *"Don't have one yet? Tap here to get a key — it takes 2 minutes."* The link opens Safari on OpenAI's platform page. She creates a key, copies it, comes back, pastes it. A small spinner runs a lightweight test call; a green check appears: *"Connected to OpenAI."* She taps **Continue**. Home appears with a sample starter domain: *"Welcome to Brain Break — try me."*

**Resolution.** Onboarding took ~4 minutes, most of it on OpenAI's own site. Maya joins the ~60% who successfully configure a provider — but *only* because we told her why, recommended one, deep-linked her, and validated the key before letting her leave the screen.

**Failure modes (the ~40% we lose):**
1. User hits the provider list, feels overwhelmed, closes and deletes the app.
2. User opens the OpenAI link, hits a login/signup wall, bounces.
3. User pastes an invalid key → we reject it → she loses confidence and quits.

**Capabilities this journey requires:**
- First-launch onboarding flow (detects "no provider configured yet")
- Provider catalog screen with plain-language descriptions and deep links to each provider's key page
- "Help me choose" explainer modal
- Key-entry screen per provider (with paste-from-clipboard affordance)
- Live key validation via a lightweight test call
- Secure key storage via `expo-secure-store` (Keychain/Keystore)
- Clear error recovery paths (invalid key, network failure, rate-limit)

### Persona 2 — Alex Park (secondary)

34, full-stack engineer, one of the terminal app's earliest users. Has 40+ domains in his terminal setup. Installed Brain Break Mobile out of curiosity the day it launched.

**What he wants.** To verify that the mobile version really is the full product, not a stripped-down viewer. Intellectually he's already on our side; practically, he will notice every missing feature.

#### Journey C — Alex's first mobile session (parity stress-test)

**Opening.** Launch day. Alex sees Brain Break in the App Store, grins, installs it.

**Rising action.**
1. First launch. Provider setup. He already has an OpenAI key on his laptop; he AirDrops it to his phone, pastes, validates. 60 seconds.
2. Home is empty — no domains. *"Wait, my terminal has 40. Does this not sync?"* He remembers: Phase 1 is local-only, no sync yet. He nods, and creates *"React 19 features"* on mobile just to kick the tires.
3. Create-domain form. Keyboard-aware, quick. He plays 3 questions, tries Explain, tries Teach me more, tries Bookmark. All work.
4. Domain menu. He scans it: Play, History, Bookmarks, Stats, My Coach, Archive, Delete. *"All of it. Okay, they really did it."*
5. Settings. He scans it: AI Provider, Language, Tone of Voice, My Coach Scope, Welcome & Exit toggle. He notices no Copilot provider, no theme picker, no ASCII Art Milestone, no Challenge mode.

**Climax.** Alex does not get frustrated — because every omission is consistent with what the App Store description and the GitHub README already told him: Copilot is a forced platform divergence, theme picker is Phase 1 dark-only, ASCII art and Challenge are explicitly documented backlog commitments. He tweets: *"brain-break mobile is out and they actually kept every feature. no 'lite edition' energy. respect."*

**Resolution.** Alex uses mobile occasionally (on trips), keeps terminal as his daily driver, and is in the pipeline for the Phase 2 sync launch. He becomes a free user-acquisition channel.

**Failure mode (the trust-breaking scenario).** A single *undocumented* missing feature — e.g., no delete option, a missing tone-of-voice setting, a My Coach that doesn't remember his scope. Any undocumented divergence destroys the parity promise for the entire segment Alex represents.

**Capabilities this journey requires:**
- Full feature parity coverage across all 15 MVP surfaces
- Settings screen that visibly mirrors the terminal's Settings structure
- Honest, documented communication of forced divergences (via App Store description, GitHub README, and a small "About" link in Settings)
- Fast, keyboard-aware create-domain flow
- Zero-state Home screen copy ("No domains yet — tap + to create one")

### Journey Requirements Summary

| Capability area | Journeys requiring it | Priority |
| --- | --- | --- |
| First-launch onboarding & provider setup | B | **P0** — #1 retention lever |
| Home screen (with zero-state) | A, B, C | P0 |
| Create domain flow | A, C | P0 |
| Domain menu (Play, History, Bookmarks, Stats, My Coach, Archive, Delete) | A, C | P0 |
| Quiz / Play loop (with haptics + coach one-liner) | A, C | P0 |
| Explain + Teach me more | A, C | P0 |
| Bookmark toggle | A | P0 |
| Settings (full parity except Copilot and theme) | C | P0 |
| Secure key storage and live validation | B | P0 |
| Offline / network-latency tolerance | A, B, C | P0 |
| About / divergence transparency (in-Settings link to GitHub README) | C | P0 (minimal implementation) |
| Dedicated in-app "Why isn't X on mobile?" screen | C | P1 (Post-MVP) |

## Domain-Specific Requirements

Brain Break Mobile operates in the **personal-learning** corner of EdTech. Standard institutional-EdTech compliance concerns were explicitly evaluated and found inapplicable to Phase 1 scope:

- **COPPA / FERPA:** Not applicable. The app is marketed to adults; there is no institutional user, no minor-as-primary-user, no school, no teacher, no curriculum, and no shared content repository.
- **WCAG / accessibility:** Phase 1 targets a reasonable baseline (dynamic type, VoiceOver / TalkBack labels on interactive elements, sufficient color contrast) but does not claim formal WCAG 2.1 AA conformance.
- **GDPR / CCPA:** Technically applicable (EU / California users may install), but Phase 1 processes zero personal data on any server operated by us. All data is on-device; AI calls route through user-provided keys to user-chosen providers. App Store privacy labels will reflect this. The privacy story is *"we never had it, so there is nothing to give, leak, or sell."*

Deeper technical constraints (secret storage, offline behavior, AI latency, local SQLite persistence) are defined in the Functional and Non-Functional Requirements sections below.

## Mobile App–Specific Requirements

### Project-Type Overview

Brain Break Mobile is a cross-platform native app delivered to iOS and Android via Expo / React Native / TypeScript, sharing a platform-agnostic `@brain-break/core` package with the existing terminal application. The app is local-first — it launches, reads, browses, and creates domains offline — while AI-driven actions (Play, Explain, Teach me more, Coach) require a network connection. It is distributed through the Apple App Store and Google Play Store.

### Platform Requirements

- **Target platforms:** iOS 16.0+ and Android 10 (API 29)+. Floors chosen deliberately above Expo's minimums to reduce the test matrix and avoid legacy-device risk; older OS versions are explicitly unsupported in Phase 1.
- **Delivery mechanism:** Expo (managed workflow, with a Dev Client only when required for native module configuration). EAS Build for compiled binaries; EAS Submit for store uploads.
- **Codebase:** One shared TypeScript codebase; zero native-only code paths unless a specific Expo SDK gap forces otherwise.
- **Orientation:** Portrait only. Landscape provides no value and adds layout cost.
- **Device types — phones only.** iPad and Android tablets are explicitly out of scope for Phase 1. The product description will state *"designed for phones."* Installs on tablets may technically succeed but are not designed, tested, or supported.
- **Languages:** App UI in English for Phase 1. *Question content* language is user-configurable via the existing "Language" setting (parity with terminal).
- **Minimum device:** 2-year-old mid-range device (e.g., iPhone 12, Pixel 6a). Cold-start and interaction targets assume this baseline.

### Device Permissions

Minimal. Phase 1 requests:

- **Network access** (implicit, no prompt).
- **No** camera, microphone, location, contacts, photo library, Bluetooth, health, or motion permissions. Privacy-first posture.

Any future permission (e.g., local notifications in Phase 2) will be requested lazily, contextually, and strictly opt-in.

### Offline Mode

Local-first by architecture. Network behavior by feature:

| Feature | Offline behavior |
| --- | --- |
| App launch → Home | Works offline |
| Browse domains, history, bookmarks, archived | Works offline |
| Domain stats (local data only) | Works offline |
| Settings (except provider-key validation) | Works offline |
| Create domain | Works offline (config only; question generation happens later during Play) |
| Play (quiz question generation) | Requires network |
| Explain, Teach me more | Requires network |
| My Coach message generation | Requires network |
| API key validation on setup | Requires network |

**Failure UX:** Network-required actions display a clear, non-blocking message (*"Can't reach AI provider. Check your connection and try again."*) with a retry affordance. The app never crashes or blocks further local interaction on a network failure.

### Push / Notification Strategy

**Phase 1: No push notifications.** No `expo-notifications` configured, no server-side push infrastructure, no notification permissions requested.

Reasoning: honors the focus-tool principle and the "no manipulation" commitment. Streak nudges and reminders are Phase 2+ features. Any future notifications must be opt-in during explicit user action (never default-on) and user-scheduled as local notifications only (no server-initiated pushes).

### Store Compliance

- **Apple App Store**
  - **Privacy labels: "Data Not Collected" across all categories.** No third-party crash SDK, no analytics, no trackers, no ads. Crash data is read from Apple App Store Connect's native dashboards only (collected by Apple, not by us).
  - BYO-key AI billing is a direct user-to-provider relationship; the app does not process payments.
  - "Buy me a coffee" opens an external URL in the system browser and is clearly labeled as such (avoids in-app-purchase rule friction).
- **Google Play Store**
  - Data safety section: mirrors App Store privacy labels ("No data collected").
  - Target API level refreshed annually per Play Console requirements.
  - AAB (Android App Bundle) delivery via EAS.
  - Crash data read from Play Console's Android Vitals dashboard only.
- **Age rating:** 4+ / Everyone. No user-generated shared content, no social features, no links outside of the provider-setup flow and Buy-me-a-coffee.

### Implementation Considerations

- **Navigation:** `expo-router` stack navigation mirroring the terminal's linear router (push / pop). No tab bar.
- **Local storage:** `expo-sqlite`, behind the `IStorageAdapter` interface exported by `@brain-break/core`.
- **Secret storage:** `expo-secure-store` for all API keys (Keychain on iOS, Keystore on Android).
- **Haptics:** `expo-haptics` on answer submission and bookmark toggle.
- **External links:** `expo-linking` / `WebBrowser.openBrowserAsync` for provider key pages and Buy-me-a-coffee.
- **Charts (Stats screen):** Single library selection deferred to the architecture doc; candidates are `victory-native` or `react-native-gifted-charts`. Not both.
- **Crash reporting:** No in-app SDK. Crash metrics monitored via Apple App Store Connect (iOS) and Google Play Console Android Vitals (Android). This keeps privacy labels at *"Data Not Collected"* and eliminates ongoing SDK maintenance.
- **Build & release:** EAS Build + EAS Submit. Two channels: `preview` (for TestFlight / internal testing) and `production`.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP type — Experience Parity MVP.** Brain Break Mobile's MVP is not defined as *smallest-possible-shippable* (a problem-solving MVP) nor as *feature exploration* (a platform MVP). It is a **parity MVP**: the smallest surface area that replicates the *complete* terminal experience on a new platform, minus only platform-forced divergences and explicitly deferred features.

This choice is deliberate. A smaller MVP (e.g., quiz-only, no My Coach) is technically feasible but would *violate the parity principle* and break trust with the terminal-user segment that Alex represents. The right MVP for this product is the one that preserves the product's identity; anything less is not Brain Break.

**What we are validating with this MVP:**

1. Non-dev users will successfully configure a BYO-key (≥60% target).
2. The parity promise earns word-of-mouth from terminal users to their non-dev networks (≥100 installs organically within 3 months).
3. Local-only Phase 1 is livable before Phase 2 sync arrives (validated by retention, not churn).

**Resource profile.** Solo developer. All technical, design, and product decisions are made by George. No coordination tax. This profile shapes every risk mitigation below.

### MVP Feature Set (Phase 1)

Full MVP scope and core user journeys are defined in the **Product Scope** and **User Journeys** sections above and are not repeated here. Summary:

- 15 surfaces (Home, Create, Archived, Domain menu, Play, Explain, Teach me more, History, Bookmarks, Stats, My Coach, Archive, Delete, Settings, Buy me a coffee).
- 5 settings (AI Provider, Language, Tone of Voice, My Coach Scope, Welcome & Exit toggle).
- BYO-key AI (all terminal providers except GitHub Copilot).
- Local-only SQLite storage behind `IStorageAdapter`.
- Dark-only theme.
- Phones only, iOS 16.0+ / Android 10 (API 29)+.

### Post-MVP Roadmap

Phased priorities (detailed feature list is in *Product Scope → Growth Features*):

- **Phase 2 (immediate post-MVP, committed):** Google Drive BYOC sync covering terminal and mobile. Highest-value post-MVP investment: resolves the "lose your phone, lose your learning" pain and unlocks multi-device users.
- **Phase 3 (growth):** Challenge mode and ASCII art milestones ported to mobile; opt-in local notifications.

### Risk Mitigation

**Technical Risks**

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Core-extraction refactor breaks terminal app | Medium | High | Main-green-always discipline; refactor in small, reversible PRs; terminal test suite must pass at every commit |
| Expo SDK gap forces eject to bare RN mid-project | Low | High | Requirements intentionally sit well within Expo managed-workflow limits; no custom native modules planned for Phase 1 |
| AI-provider API surface drift (e.g., OpenAI breaking change) | Medium | Medium | Provider interface in `@brain-break/core` isolates each adapter; breaking changes are per-provider, not catastrophic |
| `expo-sqlite` schema migration on version upgrades | Medium | Medium | Versioned migrations from v1; every schema change ships with a forward migration; no destructive migrations |
| Secure-store failure on uncommon device state (restore from backup without passcode, etc.) | Low | Medium | Key-validation step at app launch detects missing/invalid keys and routes back to provider setup |

**Market Risks**

| Risk | Mitigation |
| --- | --- |
| BYO-key onboarding cliff kills retention (below 60% target) | If missed materially, investigate qualitatively with onboarded users before committing to heavier mitigations; no hosted-proxy fallback is committed for Phase 2 |
| Terminal users don't refer non-dev partners | Measured via the 100-install / 3-month target; if missed, investigate via direct outreach to existing terminal users before investing in paid acquisition |
| Non-dev users find "learning app without streaks/gamification" unmotivating | Validated by Maya-style qualitative feedback, not just DAU numbers; *no manipulation* is a product commitment, not a hypothesis to revisit |
| App Store rejection for BYO-key or external-link patterns | Precedent exists (terminal emulators, AI chat apps use identical BYO-key patterns); external Buy-me-a-coffee link is explicitly allowed for non-digital-goods |

**Resource Risks (solo dev)**

| Risk | Mitigation |
| --- | --- |
| Scope expansion during implementation | PRD scope is explicitly frozen at MVP boundary; any mid-project feature request is triaged to Phase 2+ without exception |
| Burnout on a long refactor + new-platform build | Phased implementation plan (core extraction → mobile shell → full feature parity → beta) is defined in the **architecture document**, not here. Each phase is independently shippable to `main` |
| Solo-dev lost-knowledge risk | This PRD + architecture + UX docs serve as durable context; `product-principles.md` captures cross-cutting invariants |
| Store review delays blocking releases | Submit early, submit often; internal testing tracks used aggressively to validate builds before production submissions |

### Out of Scope — Phase 1

To protect the parity principle and keep scope honest, the following are explicitly out of scope for Phase 1. Adding any of them mid-implementation requires a new scoping pass, not a drive-by decision.

**Deferred to named phases:**

- Cross-device sync (Phase 2)
- Push and local notifications of any kind (Phase 3)
- Challenge mode and ASCII art milestones (Phase 3)

**Hard commitments — not on any roadmap:**

- Third-party advertising, sponsorships, cross-promotion
- In-app purchases, subscriptions, or paid feature unlocks
- Tablet and iPad-optimized layouts (Brain Break Mobile is a phones-only product)

**Deferred with conditions — may be reconsidered in a later phase:**

- **Analytics and behavioral telemetry.** Not in Phase 1 for trust and privacy reasons. May be reintroduced in a later phase *only if* it meets all of these conditions: (1) strictly opt-in during a clear user-facing prompt, (2) anonymized by design (no PII, no API keys, no question content), (3) user-visible in Settings with a one-tap disable, (4) disclosed in App Store / Play privacy labels, (5) documented in an updated PRD section before implementation.

## Functional Requirements

The following requirements define the complete capability contract for Brain Break Mobile Phase 1. Each FR states WHAT capability must exist — not HOW it is implemented. UX design, architecture, and implementation must satisfy every requirement listed; features not listed here will not exist in the MVP.

### Onboarding & Provider Setup

- **FR1:** A first-time user can complete onboarding and reach a working Home screen without needing a separate device.
- **FR2:** A user who has not yet configured an AI provider is routed to the provider-setup flow on app launch.
- **FR3:** A user can choose an AI provider from the supported list (OpenAI, Anthropic, Google Gemini, Ollama, OpenAI-compatible endpoint) with a plain-language description of each option.
- **FR4:** A user unsure which provider to choose can request a recommendation and receive a direct deep-link to that provider's API-key creation page.
- **FR5:** A user can enter an API key for their selected provider, including via paste from the device clipboard.
- **FR6:** For providers that require endpoint or model parameters (Ollama, OpenAI-compatible), a user can configure those parameters during setup.
- **FR7:** The system validates a newly entered key via a lightweight test call and confirms success before allowing the user to leave the setup screen.
- **FR8:** The system presents a clear, recoverable error message when key validation fails (invalid key, network error, rate limit).
- **FR9:** A user can reach the Home screen only after a working provider is configured.

### Home & Domain Management

- **FR10:** A user can view a list of their active (non-archived) domains on Home, each showing its name, score, and total question count.
- **FR11:** A user can see a clear zero-state on Home when no domains exist yet, with a prompt to create the first domain.
- **FR12:** A user can navigate from a Home domain row into that domain's menu.
- **FR13:** A user can create a new domain from Home by providing a domain slug and any prompt / coach information the terminal equivalent supports.
- **FR14:** A user can view a list of archived domains on a dedicated Archived screen accessible from Home.
- **FR15:** A user can unarchive a previously archived domain from the Archived screen, returning it to the active list.
- **FR16:** A user can open a "Buy me a coffee" surface from Home that leads to an external donation page in the system browser.
- **FR17:** The app is gracefully closed via the OS (swipe / home button); the terminal-style "Exit" menu item is not present.

### Domain Menu

- **FR18:** A user can open a domain menu that offers: Play, History, Bookmarks, Stats, My Coach, Archive, Delete.
- **FR19:** A user can archive a domain from the domain menu, removing it from the active Home list without data loss.
- **FR20:** A user can permanently delete a domain from the domain menu, after explicit confirmation that warns the action cannot be undone.
- **FR21:** A user can return from any domain-menu destination back to the domain menu, and from the domain menu back to Home.

### Play (Quiz) Loop

- **FR22:** A user can start a quiz session for a selected domain.
- **FR23:** The system generates a new question on demand via the user's configured AI provider, respecting the domain's prompt, language, tone, and coach configuration.
- **FR24:** A user is shown one question at a time, with multiple-choice options rendered for tap selection.
- **FR25:** A user can submit an answer by tapping an option.
- **FR26:** The system records every answered question in the domain's history with the user's answer, the correct answer, and a timestamp.
- **FR27:** The system updates the domain's score after each answer, matching the terminal scoring rules.
- **FR28:** A user receives tactile (haptic) and visual feedback on answer submission, differentiated for correct and incorrect outcomes.
- **FR29:** A user can view a short coach one-liner alongside the question, when one is configured for the domain.
- **FR30:** A user can end the current quiz session and return to the domain menu at any question boundary.

### Question Inspection (Explain & Teach Me More)

- **FR31:** A user can request an explanation of the current question, generated on demand via the configured AI provider.
- **FR32:** A user can request a deeper contextual teaching ("Teach me more") related to the current question, generated on demand via the configured AI provider.
- **FR33:** The system renders AI-generated explanatory content with a loading state that communicates network/AI latency without blocking local interaction.
- **FR34:** The system presents a recoverable error state when an AI call fails, with a retry affordance and without crashing or losing the current question.

### Bookmarks

- **FR35:** A user can bookmark the current question from the Play loop.
- **FR36:** A user can unbookmark a previously bookmarked question.
- **FR37:** A user can view a list of bookmarked questions for a domain on a dedicated Bookmarks screen.
- **FR38:** A user can remove a bookmark from the Bookmarks screen.
- **FR39:** Bookmark state persists across app restarts, device sleep, and Phase 1's local-only storage boundary.

### History

- **FR40:** A user can view a chronological list of answered questions for a domain on a dedicated History screen.
- **FR41:** Each history entry shows the question, the user's answer, the correct answer, and the outcome (correct / incorrect).
- **FR42:** History is read-only in Phase 1. Individual history entries cannot be edited or deleted; clearing history is a domain-delete operation.

### Statistics (Domain-Scoped)

- **FR43:** A user can view statistics for a specific domain on a dedicated Stats screen accessed from that domain's menu.
- **FR44:** The Stats screen presents the set of metrics the terminal equivalent presents (score, total questions, accuracy, and any terminal-supported aggregations), scoped to the domain.
- **FR45:** No global or cross-domain statistics exist in Phase 1.

### My Coach (Domain-Scoped)

- **FR46:** A user can configure My Coach for a domain from the domain menu, providing coach instructions and scope.
- **FR47:** A user can select the coach scope from the same options the terminal supports (Recent 25 / Extended 100 / Complete all questions).
- **FR48:** The system passes the coach configuration and scope to the AI provider when generating coach messages during Play.
- **FR49:** A user can update or clear a domain's coach configuration at any time.
- **FR50:** My Coach state is stored per-domain and persists across app restarts.

### Settings

- **FR51:** A user can open a Settings screen from Home.
- **FR52:** A user can change the current AI Provider from Settings, choosing from the same provider list supported at onboarding (excluding GitHub Copilot, which is not offered on mobile).
- **FR53:** A user can update provider-specific parameters (API key, endpoint, model) from Settings, with the same validation flow as onboarding.
- **FR54:** A user can change the question Language from Settings via a free-text input, matching the terminal setting.
- **FR55:** A user can change the Tone of Voice from the same list the terminal supports (Natural, Expressive, Calm, Humorous, Sarcastic, Robot, Pirate).
- **FR56:** A user can change the default My Coach Scope (Recent 25 / Extended 100 / Complete all) from Settings.
- **FR57:** A user can toggle the Welcome & Exit screen setting from Settings, matching the terminal's `showWelcome` behavior (splash and farewell on app launch / close).
- **FR58:** Settings changes persist across app restarts via local storage.
- **FR59:** The Settings screen does not offer a theme picker; the app is dark-only in Phase 1.
- **FR60:** The Settings screen does not offer ASCII art milestone or Challenge options; those features are out of scope in Phase 1.

### Data Persistence & Local Storage

- **FR61:** All domain data (meta, history, bookmarks, coach configuration, archive state) persists locally on the device.
- **FR62:** All user settings persist locally on the device.
- **FR63:** All AI provider API keys are stored in the device secure-store (Keychain on iOS, Keystore on Android) and are never written to plain storage, logs, or telemetry.
- **FR64:** Every domain record carries a stable unique identifier and an `updatedAt` timestamp, enabling Phase 2 sync without Phase 1 migration pain.
- **FR65:** The system survives forced app termination without data loss for any persisted domain, setting, or key.

### Network & Offline Behavior

- **FR66:** The app launches and reaches Home in offline mode.
- **FR67:** A user can browse domains, history, bookmarks, archived domains, and stats entirely offline.
- **FR68:** A user can open and modify Settings offline, except for actions that require a live test call (e.g., validating a newly entered provider key).
- **FR69:** Network-required actions (Play, Explain, Teach me more, coach message generation) fail with a clear, recoverable message when offline or when the provider is unreachable.

### Parity & Platform Divergence Transparency

- **FR70:** The Settings screen exposes a link (or section) that points to the product's public README or About page where platform-forced divergences are documented.
- **FR71:** The App Store and Play Store descriptions state the Phase 1 platform constraints explicitly (phones only; dark-only; no cross-device sync yet).

## Non-Functional Requirements

Only categories that materially apply to Brain Break Mobile Phase 1 are documented. Categories that do not apply (scalability, formal external-integration contracts) are intentionally omitted.

### Performance

- **NFR-P1:** The app reaches the Home screen in under 2 seconds from cold start on a 2-year-old mid-range device (baseline: iPhone 12, Pixel 6a).
- **NFR-P2:** Tapping a domain row on Home opens its Domain menu within 250 ms (perceived-instant interaction).
- **NFR-P3:** Question generation during Play completes with p50 < 4 seconds and p95 < 8 seconds over a stable network; longer latencies are acceptable when attributable to the user's chosen AI provider or network.
- **NFR-P4:** Explain and Teach-me-more AI calls show a loading indicator within 100 ms of trigger and do not block the Back button or other local UI.
- **NFR-P5:** Haptic + visual feedback on answer submission fires within 50 ms of tap.
- **NFR-P6:** Local data reads (domain list, history, bookmarks, stats) render under 300 ms even for domains with ≥1,000 history entries.

### Security

- **NFR-S1:** API keys are stored exclusively in the device secure-store (Keychain on iOS, Keystore on Android). Keys are never written to `AsyncStorage`, plain SQLite columns, file-system logs, console output, or crash reports.
- **NFR-S2:** All network calls to AI providers and external link destinations use HTTPS/TLS 1.2 or higher. Plain-HTTP endpoints are rejected.
- **NFR-S3:** API keys are transmitted only to the provider endpoint the user configured. The app makes no network calls to any other destination with credentials attached.
- **NFR-S4:** The app performs no background network activity when the user is not actively interacting; no telemetry beacons, heartbeat pings, or silent calls.
- **NFR-S5:** On secure-store failure (e.g., key unreadable after device restore), the app detects the failure at app launch and routes the user back to provider-setup rather than attempting AI calls with a null or corrupted key.

### Privacy & Data Handling

- **NFR-PR1:** The app collects no personal data. Name, email, device identifiers, advertising identifiers, location, and behavioral telemetry are all explicitly not collected.
- **NFR-PR2:** The app stores no user content on any server operated by the product. All user-authored and user-generated content (domains, history, bookmarks, coach configuration, settings) lives on the user's device only in Phase 1.
- **NFR-PR3:** Apple App Store privacy labels and Google Play Data Safety declarations report "Data Not Collected" across all categories in Phase 1.
- **NFR-PR4:** Crash diagnostics are collected exclusively by Apple and Google's platform-native reporting (Apple App Store Connect, Google Play Android Vitals) and are not duplicated into any third-party SDK.
- **NFR-PR5:** User-provided AI-provider API keys remain under the user's sole control. They are never transmitted off-device to any destination other than the provider the user authorized.
- **NFR-PR6:** Deleting a domain, or uninstalling the app, permanently removes all associated data from the device (no shadow copies, no cloud remnants in Phase 1).

### Reliability

- **NFR-R1:** Crash-free sessions ≥ 99.5% on both iOS and Android, measured via Apple App Store Connect and Google Play Android Vitals native dashboards.
- **NFR-R2:** Forced app termination (OS kill, device reboot, battery drain) does not corrupt or lose any persisted domain, setting, or key.
- **NFR-R3:** Network failures during AI calls produce user-visible, recoverable error states; they never crash the app or silently discard user actions (answer submissions, bookmark toggles, settings changes).
- **NFR-R4:** SQLite schema migrations are versioned from v1. Every migration is forward-only and non-destructive; no data loss is an acceptable outcome of an app version upgrade.
- **NFR-R5:** The app remains fully usable (local surfaces) during extended offline periods (multi-day). No expiring local state.

### Accessibility

- **NFR-A1:** All interactive elements expose accessibility labels for VoiceOver (iOS) and TalkBack (Android).
- **NFR-A2:** The UI respects the user's system-level dynamic-type / font-size preferences; text scales without layout breakage up to the OS's largest supported setting.
- **NFR-A3:** Color contrast for text and interactive elements meets WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text and graphical objects).
- **NFR-A4:** No interaction relies exclusively on color to convey meaning (correct / incorrect feedback pairs color with icon and haptic).
- **NFR-A5:** Touch targets for interactive elements are ≥ 44×44 pt (iOS) / 48×48 dp (Android).
- **NFR-A6:** Formal WCAG 2.1 AA conformance certification is a Phase 2+ commitment. Phase 1 meets the practices above as a good-faith baseline, not a certified conformance.

### Maintainability

- **NFR-M1:** The mobile app consumes domain logic, AI provider logic, and storage abstractions exclusively from `@brain-break/core`. No core logic is duplicated or re-implemented in `packages/mobile`.
- **NFR-M2:** The schema in `@brain-break/core` is the single source of truth for domain records; both terminal and mobile conform to it without platform-local extensions.
- **NFR-M3:** Every new domain-schema field added in `@brain-break/core` ships with a forward migration for both file-system (terminal) and SQLite (mobile) adapters in the same commit.
- **NFR-M4:** The mobile codebase is buildable and testable by a solo developer on a single Mac with Expo CLI and EAS CLI; no additional infrastructure is required for day-to-day development.
- **NFR-M5:** Dependency footprint is deliberately minimized. Adding a new runtime dependency to `packages/mobile` requires a documented justification in the architecture doc; the Phase 1 target is fewer than 15 direct runtime dependencies beyond Expo SDK core.







