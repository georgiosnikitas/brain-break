# Brain Break

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=georgiosnikitas_brain-break&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=georgiosnikitas_brain-break)

Brain Break is an AI-powered terminal quiz app built with TypeScript and the GitHub Copilot SDK. It lets you create quiz domains, generate questions on demand, track score and difficulty over time, and review both question history and per-domain stats from a CLI interface.

## Features

- Interactive terminal UI powered by Inquirer prompts
- Domain-based quiz sessions such as `javascript`, `history`, or `system-design`
- AI-generated multiple-choice questions via the GitHub Copilot SDK
- Duplicate-question avoidance using stored question hashes
- Adaptive scoring based on correctness, response speed, and current difficulty
- Automatic difficulty progression or regression after answer streaks
- Persistent local history, stats, archived domains, and session metadata

## Requirements

- Node.js `>= 25.8.0`
- A GitHub account with an active GitHub Copilot subscription
- GitHub Copilot authentication available in the environment where the CLI runs

## Installation

```bash
npm install
```

## Run Locally

Start the app directly from source during development:

```bash
npm run dev
```

Build the CLI and run the compiled version:

```bash
npm run build
npm start
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
2. avoids repeating previously stored questions when possible
3. times your answer
4. updates score, streak, total time played, and difficulty
5. stores the result before moving to the next question

Scoring is influenced by both correctness and speed tier:

- fast correct answers earn the highest reward
- slow correct answers still earn points, but fewer
- incorrect answers deduct points, with larger penalties for slower responses
- a streak of three correct answers raises difficulty by one level
- a streak of three incorrect answers lowers difficulty by one level

## Data Storage

Brain Break stores quiz data locally under:

```text
~/.brain-break
```

Each domain is saved as its own JSON file, for example:

```text
~/.brain-break/javascript.json
```

Each file contains:

- domain metadata such as score, difficulty, streak, and timestamps
- a history of answered questions
- question hashes used for deduplication

Writes are atomic: the app writes to a temporary file and renames it into place.

## Available Scripts

```bash
npm run dev         # run from source with tsx
npm run build       # compile TypeScript to dist/
npm start           # run the compiled CLI
npm run typecheck   # run TypeScript type checking
npm test            # run the Vitest suite once
npm run test:watch  # run Vitest in watch mode
```

## Project Structure

```text
src/
	ai/         Copilot client integration and prompt construction
	domain/     schemas, persistence, and scoring logic
	screens/    terminal screens for home, quiz, history, stats, and archive flows
	utils/      formatting, hashing, and slug helpers
	index.ts    CLI entrypoint
	router.ts   screen orchestration
```

## Notes

- If Copilot authentication fails, quiz generation cannot proceed.
- Domain names are slugified before being stored on disk.
- If a domain file is missing, the app starts from a clean default state for that domain.
