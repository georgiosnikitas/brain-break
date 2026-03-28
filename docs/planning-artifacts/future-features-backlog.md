---
status: draft
date: 2026-03-25
author: George
---

# Future Features Backlog

> **Scope:** Post-MVP feature ideas for `brain-break`. These are not committed — they are candidates for evaluation when the MVP is complete.
>
> **Source:** Brainstorming session with the Analyst agent (2026-03-25), grounded in PRD success criteria and user personas.

---

## Priority: High

### ~~1. Explain Answer from History~~ ✅ Promoted

**Status:** Promoted to PRD Feature 6, FR37, Epic 4 Story 4.4 (2026-03-28)

---

### 2. Google Drive Sync

**Description:** Manual cloud backup and restore of domain data via Google Drive. Users connect their Google account through OAuth 2.0 (PKCE) in Settings, protect credentials with a 4-6 digit PIN, and manually Upload or Download domain data. Settings and tokens are never synced — only domain JSON files.

**KPIs targeted:** Data safety, Cross-device continuity, Perceived value

**Complexity:** Medium-Large

#### Scope & Decisions

- **Provider:** Google Drive only (via `@googleapis/drive` — actively maintained, TypeScript + ESM support)
- **What syncs:** Domain JSON files from `~/.brain-break/` only — settings file is never synced (provider, models, endpoints are machine-specific)
- **Sync model:** Manual Upload / Download — no automatic sync, no background workers, no conflict merging
- **`lastSyncedAt`:** Stored on Google Drive in `sync-metadata.json` — reflects when any machine last synced, not just the current one
- **`lastPlayed`:** Local per machine — computed as `max(lastSessionDate)` across all domain files in `~/.brain-break/`. If no domains exist, no timestamp is shown

#### Security: Token Storage & PIN

- OAuth refresh token encrypted with AES-256-GCM, key derived from user's PIN via PBKDF2 (100K iterations + random salt)
- Stored in `~/.brain-break/gdrive-token.enc` (separate from `settings.json`)
- PIN is **never saved** — entered once at app startup, held in memory for session lifetime, discarded on exit
- Forgot PIN recovery: after 3 failed attempts at startup, user selects "Reconnect Google Drive" which deletes `gdrive-token.enc` internally, triggers a new OAuth flow, and sets a new PIN — no data loss (cloud data unaffected). User can also reconnect from the Settings sub-screen via the Disconnect + Connect flow.
- Wrong PIN: 3 attempts → offer "Reconnect Google Drive" or "Skip (continue without sync)"

#### Startup Flow

1. Welcome screen (if enabled)
2. If `gdrive-token.enc` exists → prompt for PIN → decrypt token → fetch `lastSyncedAt` from Google Drive
3. If PIN wrong after 3 attempts → option to Reconnect or Skip
4. If offline / network error → continue normally, show "status unavailable" on home screen
5. Home screen with contextual sync action

#### Home Screen — Sync States

| State | Home screen entry |
|---|---|
| Local ahead of cloud | `📤 Upload to Google Drive (last synced: Mar 25, 2026 14:32:08)` — selectable action |
| Cloud ahead of local | `📥 Download from Google Drive (last synced: Mar 28, 2026 10:30:15)` — selectable action |
| Everything in sync | `☁️ Google Drive synced (Mar 28, 2026 10:30:15)` — display only |
| Connected, never synced | `📤 Upload to Google Drive (never synced)` — selectable action |
| Not connected | No sync entry shown — home screen identical to current |
| Connected, offline/error | `☁️ Google Drive sync status unavailable` — display only |

#### Settings Screen — Main Level

Google Drive appears as a single menu item (like AI Provider) that opens a sub-screen:

| State | Settings entry |
|---|---|
| Local ahead of cloud | `☁️ Google Drive: ⚠️ local changes not synced` |
| Local synced | `☁️ Google Drive: ✅ local synced` |
| Never synced | `☁️ Google Drive: — never synced` |
| Not connected | `☁️ Google Drive: Not connected` |

#### Settings — Google Drive Sub-Screen (Connected)

```
 ☁️  Google Drive Sync
       Last played:  Mar 28, 2026 09:15:42
       Last synced:  Mar 25, 2026 14:32:08  ⚠️ local changes not synced
   ──────────────
   📤 Upload to Google Drive
   📥 Download from Google Drive
   🔌 Disconnect Google Drive
   ──────────────
   ←  Back to Settings
```

#### Settings — Google Drive Sub-Screen (Not Connected)

```
 ☁️  Google Drive Sync
   ──────────────
   🔗 Connect Google Drive
   ──────────────
   ←  Back to Settings
```

#### Action Flows

**Connect:**
1. Open browser → Google OAuth consent screen
2. User authorizes → paste authorization code into terminal
3. Prompt: "Create a PIN (4-6 digits):" → enter twice to confirm
4. Encrypt token → save to `gdrive-token.enc`
5. `✅ Google Drive connected successfully!`

**Upload:**
1. PIN is already in memory (entered at startup)
2. Read all domain JSON files from `~/.brain-break/`
3. Push files to `brain-break/` folder on Google Drive
4. Update `sync-metadata.json` on Google Drive with `lastSyncedAt = now`
5. Show progress per file → `✅ Upload complete!`

**Download:**
1. PIN is already in memory (entered at startup)
2. Confirmation prompt: `⚠️ This will replace ALL local domain data with the cloud version.`
3. Pull all files from `brain-break/` folder on Google Drive
4. Overwrite local domain files
5. Update `sync-metadata.json` on Google Drive with `lastSyncedAt = now`
6. Show progress per file → `✅ Download complete!`

**Disconnect:**
1. Confirmation prompt: `⚠️ This will remove your stored credentials. Your data on Google Drive will NOT be deleted.`
2. Delete `gdrive-token.enc`
3. `✅ Google Drive disconnected.`

#### Stories Breakdown

1. **Startup PIN flow + token decryption** — PIN prompt at startup, decrypt token, hold in memory for session lifetime, wrong PIN handling (3 attempts → Reconnect or Skip), offline/error handling
2. **Google OAuth connection + PIN setup** — Settings sub-screen, browser auth, paste authorization code, create PIN (4-6 digits, enter twice), encrypt token with AES-256-GCM, save to `gdrive-token.enc` (depends on Story 1)
3. **Upload to Google Drive + home screen sync status** — Upload action from home screen and sub-screen, read local domain files, push to Drive `brain-break/` folder, update `sync-metadata.json`, contextual sync entry on home screen (depends on Stories 1 + 2)
4. **Download from Google Drive** — Download action from home screen and sub-screen, confirmation prompt, pull from Drive, overwrite local domain files, update `sync-metadata.json` (depends on Stories 1 + 2, independent of Story 3)

#### Dependencies

- `@googleapis/drive` — standalone Google Drive SDK (not full `googleapis`)
- Node built-in `crypto` for AES-256-GCM + PBKDF2 (zero new deps for encryption)

#### Risks

- **Startup latency:** PIN prompt + Google Drive API call adds time before home screen — mitigate with spinner
- **OAuth in CLI:** Browser-to-terminal handoff is unfamiliar to some users — clear instructions + fallback URL
- **4-6 digit PIN brute-force:** 10K-1M combinations, trivial for determined attacker with filesystem access — acceptable for quiz app threat model (convenience security, not bank-grade)
- **Google API quota:** Zero risk — Google Drive API is completely free with no daily request limit. Rate limit is 12,000 requests per minute; each sync uses ~5-10 requests

---

### 3. Session Summary / Post-Session Report

**Description:** After exiting a quiz, display a compact summary: questions attempted, accuracy %, score delta, difficulty change, fastest/slowest answer. Turns every session into a tangible artifact.

**KPIs targeted:** Session completion rate, Perceived value

**Complexity:** Small

---

## Priority: Medium

### 4. Cross-Domain Stats / Global Dashboard

**Description:** A "View All Stats" command from the home screen aggregating across all domains — total questions answered, total time played, strongest/weakest domains, global score.

**KPIs targeted:** Domain diversity, Perceived value

**Complexity:** Small

---

### ~~5. Explanation Drill-Down / "Teach Me More"~~ ✅ Promoted

**Status:** Promoted to PRD Feature 13 (2026-03-28)

---

### 6. Question Bookmarking / Favorites

**Description:** Let users flag questions they want to revisit. "Star this question" adds it to a bookmarked list accessible from the domain sub-menu.

**KPIs targeted:** Session completion rate, Knowledge reinforcement

**Complexity:** Small

---

### 7. Challenge Mode / Timed Sprint

**Description:** A mode where the user gets N questions in a fixed time window (e.g., 10 questions in 3 minutes). Adds a competitive edge and a different engagement loop from the default exploratory mode.

**KPIs targeted:** Daily sessions per active user, Questions answered per session

**Complexity:** Medium

---

## Priority: Low

### 8. Spaced Repetition Integration

**Description:** Re-surface questions the user previously answered incorrectly at increasing intervals (Leitner-box or SM-2 algorithm). Leverages existing history data (timestamps, correctness, difficulty).

**KPIs targeted:** Score growth rate, Correct answer rate over time

**Complexity:** Medium

---

### 9. Streak & Achievement Badges

**Description:** Surface achievements based on existing tracked data: "7-day streak", "10 correct in a row", "100 questions in Greek Mythology". Habit formation accelerator.

**KPIs targeted:** 7-day return, Daily sessions per active user

**Complexity:** Small

---

### 10. Difficulty Calibration Insights

**Description:** After 50+ questions, show the user their "calibrated difficulty" — the level where they stabilize. "Your natural level in Java is Advanced (4)." A genuine skill signal.

**KPIs targeted:** Score growth rate, Perceived value

**Complexity:** Small
