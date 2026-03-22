# 🧠🔨 Brain Break

[![CI](https://github.com/georgiosnikitas/brain-break/actions/workflows/ci.yml/badge.svg)](https://github.com/georgiosnikitas/brain-break/actions/workflows/ci.yml)
[![Release](https://github.com/georgiosnikitas/brain-break/actions/workflows/release.yml/badge.svg?event=push)](https://github.com/georgiosnikitas/brain-break/actions/workflows/release.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=georgiosnikitas_brain-break&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=georgiosnikitas_brain-break)
[![License](https://img.shields.io/github/license/georgiosnikitas/brain-break)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/georgiosnikitas)

Brain Break is an AI-powered terminal quiz app built with TypeScript. Define quiz domains, answer AI-generated questions, and review your score progression and history — all from a CLI interface. Choose from multiple AI providers including GitHub Copilot, OpenAI, Anthropic, Google Gemini, and Ollama for local models.

## ✨ Features

- Interactive terminal UI powered by Inquirer prompts
- **Multiple AI providers** — GitHub Copilot, OpenAI, Anthropic, Google Gemini, and Ollama (local LLMs)
- Domain-based quiz sessions such as `java-programming`, `algebra-second-degree-polynomial-equations`, `english-grammar`, `greek-mythology`, `music-90s-hits`, or `thai-cuisine`
- AI-generated multiple-choice questions with first-time provider setup and validation
- Duplicate-question avoidance using stored question hashes
- Adaptive scoring based on correctness and response speed
- Automatic difficulty progression and regression after answer streaks
- **Configurable language and tone** — generate questions and motivational messages in your preferred language with 7 tone options (natural, expressive, calm, humorous, sarcastic, robot, pirate)
- **AI-generated motivational messages** — personalized encouragement for returning users and trending scores
- **Domain sub-menu** with play, history, stats, archive, and delete actions
- Persistent local history and settings
- Per-domain stats dashboard with score trend, accuracy, and return streak
- Paginated single-question history navigation
- **Settings screen** to change AI provider, model, language, and tone at any time

## 📋 Requirements

- Node.js `>= 25.8.0`
- An AI provider configured through the in-app settings:
  - **GitHub Copilot** — a GitHub account with an active Copilot subscription and Copilot authentication in the environment
  - **OpenAI** — `OPENAI_API_KEY` environment variable and a model name configured in setup/settings (default: `gpt-4o-mini`)
  - **Anthropic** — `ANTHROPIC_API_KEY` environment variable and a model name configured in setup/settings (default: `claude-sonnet-4-20250514`)
  - **Google Gemini** — `GOOGLE_GENERATIVE_AI_API_KEY` environment variable and a model name configured in setup/settings (default: `gemini-2.0-flash`)
  - **Ollama** — a running Ollama instance with endpoint and model configured in setup/settings (defaults: `http://localhost:11434`, `llama3`)

## 🚀 Installation

### 📦 From GitHub Packages

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

### 🛠️ From Source

```bash
git clone https://github.com/georgiosnikitas/brain-break.git
cd brain-break
npm install
npm run dev
```

## 💾 Data Storage

Brain Break stores all quiz data and settings locally under:

```text
~/.brain-break/
```

Each domain gets its own JSON file, plus a global settings file:

```text
~/.brain-break/settings.json
~/.brain-break/greek-mythology.json
~/.brain-break/java-programming.json
```

**`settings.json`** contains:

- **provider** — selected AI provider (`copilot`, `openai`, `anthropic`, `gemini`, or `ollama`)
- **language** — language for generated questions and messages (e.g., `English`, `Spanish`)
- **tone** — tone of voice (`natural`, `expressive`, `calm`, `humorous`, `sarcastic`, `robot`, or `pirate`)
- **openaiModel** — OpenAI model name (default: `gpt-4o-mini`)
- **anthropicModel** — Anthropic model name (default: `claude-sonnet-4-20250514`)
- **geminiModel** — Google Gemini model name (default: `gemini-2.0-flash`)
- **ollamaEndpoint** — Ollama server URL (default: `http://localhost:11434`)
- **ollamaModel** — Ollama model name (default: `llama3`)

**Each domain file** contains:

- **meta** — score, difficulty level, streak state, total time played, timestamps, archived flag
- **history** — list of every answered question with result, timing, and score delta
- **hashes** — SHA-256 hashes of question text used for deduplication

Writes are atomic: the app writes to a `.tmp-{slug}.json` file and renames it into place, preventing data corruption on crash or interrupt.

## 📜 Available Scripts

```bash
npm run dev         # run from source with tsx
npm run build       # compile TypeScript to dist/
npm start           # run the compiled CLI
npm run typecheck   # run TypeScript type checking without emitting
npm test            # run the Vitest test suite once
npm run test:watch  # run Vitest in watch mode
```

## 🗂️ Project Structure

```text
brain-break/
  src/
    ai/
      client.ts     AI client: question generation, deduplication, motivational messages
      prompts.ts    Prompt construction with language and tone injection
      providers.ts  Provider factory: Copilot, OpenAI, Anthropic, Gemini, Ollama
    domain/
      schema.ts     Zod schemas for domain files and settings
      store.ts      File persistence with atomic writes and settings migration
      scoring.ts    Score calculation, speed tiers, and difficulty progression
    screens/
      home.ts            Home screen with domain list and main menu
      create-domain.ts   Create a new quiz domain
      select-domain.ts   Domain selection with motivational messages
      domain-menu.ts     Per-domain sub-menu: play, history, stats, archive, delete
      quiz.ts            Interactive quiz loop with scoring feedback
      history.ts         Paginated single-question history viewer
      stats.ts           Stats dashboard with trends and accuracy
      archived.ts        Archived domains list with unarchive option
      settings.ts        Settings screen for provider, model, language, and tone
      provider-setup.ts  First-time AI provider setup and validation
      provider-settings.ts Shared provider-specific prompts for hosted/Ollama models
    utils/
      format.ts   Formatting helpers for time, accuracy, and display
      hash.ts     SHA-256 hashing for question deduplication
      screen.ts   Terminal screen management utilities
      slugify.ts  Domain name to filename slug conversion
    index.ts      CLI entrypoint
    router.ts     Screen orchestration and navigation loop
  package.json      Project manifest and scripts
  tsconfig.json     TypeScript compiler configuration
  vitest.config.ts  Test runner configuration
```

## ⚙️ How It Works

On first launch, Brain Break prompts you to select and validate an AI provider. For OpenAI, Anthropic, Gemini, and Ollama, setup also captures the model configuration used for requests. After setup, the home screen shows all active quiz domains and lets you:

- select a domain to open its sub-menu (play, history, stats, archive, delete)
- create a new domain
- browse archived domains
- change settings (AI provider, model, language, tone of voice)
- view a "Buy me a coffee" QR code

When you select a domain, the app may show a **motivational message** if you're a returning player or your recent scores are trending upward.

During a quiz session, Brain Break:

1. asks the configured AI provider to generate a multiple-choice question for the selected domain, in your chosen language and tone
2. avoids repeating previously stored questions using SHA-256 hashes
3. times your answer and assigns a speed tier: **fast**, **normal**, or **slow**
4. updates score, streak, total time played, and difficulty
5. saves the result to disk before moving to the next question

## 🏆 Scoring

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

### 📈 Difficulty Progression

- **3 consecutive correct answers** → difficulty increases by one level (max 5)
- **3 consecutive incorrect answers** → difficulty decreases by one level (min 1)

The app starts new domains at **level 2 (Easy)**.

## 📝 Notes

- On first launch, you must configure an AI provider before starting a quiz. The app validates connectivity before saving.
- For cloud providers (OpenAI, Anthropic, Gemini), set the corresponding API key environment variable before running the app and choose the model name during setup/settings.
- For Ollama, ensure the Ollama server is running and the chosen model is pulled locally.
- Domain names are slugified before being stored on disk (`"System Design"` → `system-design`).
- If a domain file is missing or unreadable, the app starts from a clean default state for that domain.
- A question that duplicates an existing hash triggers one automatic retry with a deduplication prompt before falling back.
- Settings are migrated automatically — legacy tone values (`normal` → `natural`, `enthusiastic` → `expressive`) are updated on load.

## 🤝 Contributing

Contributions are welcome. The project uses TypeScript with Vitest for testing — run `npm test` before submitting a pull request.

For context on the product goals and feature decisions, see the planning artifacts in [`docs/planning-artifacts/`](docs/planning-artifacts/):

- [Product Brief](docs/planning-artifacts/product-brief.md) — vision, problem statement, and success metrics
- [PRD](docs/planning-artifacts/prd.md) — detailed feature specifications and acceptance criteria
- [Architecture](docs/planning-artifacts/architecture.md) — technical design decisions
