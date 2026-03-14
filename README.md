# Brain Break

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=georgiosnikitas_brain-break&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=georgiosnikitas_brain-break)
[![CI](https://github.com/georgiosnikitas/brain-break/actions/workflows/ci.yml/badge.svg)](https://github.com/georgiosnikitas/brain-break/actions/workflows/ci.yml)
[![Release](https://github.com/georgiosnikitas/brain-break/actions/workflows/release.yml/badge.svg)](https://github.com/georgiosnikitas/brain-break/actions/workflows/release.yml)

Brain Break is an AI-powered terminal quiz app built with TypeScript and the GitHub Copilot SDK. It lets you create quiz domains, generate questions on demand, track score and difficulty over time, and review both question history and per-domain stats from a CLI interface.

## Features

- Interactive terminal UI powered by Inquirer prompts
- Domain-based quiz sessions such as `javascript`, `history`, or `system-design`
- AI-generated multiple-choice questions via the GitHub Copilot SDK
- Duplicate-question avoidance using stored question hashes
- Adaptive scoring based on correctness and response speed
- Automatic difficulty progression and regression after answer streaks
- Persistent local history, stats, archived domains, and session metadata
- Per-domain stats dashboard with score trend, accuracy, and return streak

## Requirements

- Node.js `>= 25.8.0`
- A GitHub account with an active GitHub Copilot subscription
- GitHub Copilot authentication available in the environment where the CLI runs

## Installation

### From GitHub Packages

```bash
npm install -g @georgiosnikitas/brain-break --registry=https://npm.pkg.github.com
```

Then run it from anywhere:

```bash
brain-break
```

> **Note:** GitHub Packages requires authentication even for public packages. Add a [personal access token](https://github.com/settings/tokens) with `read:packages` scope to your `~/.npmrc`:
>
> ```
> //npm.pkg.github.com/:_authToken=YOUR_TOKEN
> ```

### From Source

```bash
git clone https://github.com/georgiosnikitas/brain-break.git
cd brain-break
npm install
npm run dev
```

## How It Works

When the app starts, the home screen shows all active quiz domains and lets you:

- start a quiz for a domain
- create a new domain
- archive a domain
- review question history
- view a stats dashboard
- browse archived domains

During a quiz session, Brain Break:

1. asks Copilot to generate a multiple-choice question for the selected domain
2. avoids repeating previously stored questions using SHA-256 hashes
3. times your answer and assigns a speed tier: **fast**, **normal**, or **slow**
4. updates score, streak, total time played, and difficulty
5. saves the result to disk before moving to the next question

## Scoring

Points are based on your **difficulty level** and **response speed**:

| Difficulty | Base Points |
|---|---|
| 1 — Beginner | 10 |
| 2 — Easy | 20 |
| 3 — Intermediate | 30 |
| 4 — Advanced | 40 |
| 5 — Expert | 50 |

Speed multipliers applied to base points:

| Speed | Correct | Incorrect |
|---|---|---|
| Fast | ×2 | ×−1 |
| Normal | ×1 | ×−1.5 |
| Slow | ×0.5 | ×−2 |

**Example:** A correct fast answer at level 3 earns `30 × 2 = +60` points. A wrong slow answer at level 3 costs `30 × 2 = −60` points.

### Difficulty Progression

- **3 consecutive correct answers** → difficulty increases by one level (max 5)
- **3 consecutive incorrect answers** → difficulty decreases by one level (min 1)

The app starts new domains at **level 2 (Easy)**.

## Data Storage

Brain Break stores all quiz data locally under:

```text
~/.brain-break/
```

Each domain gets its own JSON file, for example:

```text
~/.brain-break/javascript.json
~/.brain-break/system-design.json
```

Each file contains:

- **meta** — score, difficulty level, streak state, total time played, timestamps, archived flag
- **history** — list of every answered question with result, timing, and score delta
- **hashes** — SHA-256 hashes of question text used for deduplication

Writes are atomic: the app writes to a `.tmp-{slug}.json` file and renames it into place, preventing data corruption on crash or interrupt.

## Available Scripts

```bash
npm run dev         # run from source with tsx
npm run build       # compile TypeScript to dist/
npm start           # run the compiled CLI
npm run typecheck   # run TypeScript type checking without emitting
npm test            # run the Vitest test suite once
npm run test:watch  # run Vitest in watch mode
```

## Project Structure

```text
src/
  ai/         Copilot client, prompt construction, and question generation
  domain/     Zod schemas, file persistence, scoring logic, and slug helpers
  screens/    Terminal screens: home, quiz, history, stats, archive, and create
  utils/      Formatting helpers for time, accuracy, and display
  index.ts    CLI entrypoint
  router.ts   Screen orchestration and navigation loop
```

## Notes

- If Copilot authentication fails, quiz generation cannot proceed and the app exits.
- Domain names are slugified before being stored on disk (`"System Design"` → `system-design`).
- If a domain file is missing or unreadable, the app starts from a clean default state for that domain.
- A question that duplicates an existing hash triggers one automatic retry with a deduplication prompt before falling back.

