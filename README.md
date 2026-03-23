
[![CI](https://github.com/georgiosnikitas/brain-break/actions/workflows/ci.yml/badge.svg)](https://github.com/georgiosnikitas/brain-break/actions/workflows/ci.yml)
[![Release](https://github.com/georgiosnikitas/brain-break/actions/workflows/release.yml/badge.svg?event=push)](https://github.com/georgiosnikitas/brain-break/actions/workflows/release.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=georgiosnikitas_brain-break&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=georgiosnikitas_brain-break)
[![License](https://img.shields.io/github/license/georgiosnikitas/brain-break)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/georgiosnikitas)


```
  🧠🔨
   ____            _          ____                 _
  | __ ) _ __ __ _(_)_ __    | __ ) _ __ ___  __ _| | __
  |  _ \| '__/ _` | | '_ \   |  _ \| '__/ _ \/ _` | |/ /
  | |_) | | | (_| | | | | |  | |_) | | |  __/ (_| |   <
  |____/|_|  \__,_|_|_| |_|  |____/|_|  \___|\__,_|_|\_\

  Train your brain, one question at a time!
```

Brain Break is an AI-powered terminal quiz app built with TypeScript. Define quiz domains, answer AI-generated questions, and review your score progression and history — all from a CLI interface. Choose from multiple AI providers including GitHub Copilot, OpenAI, Anthropic, Google Gemini, and Ollama for local models.

## ✨ Features

- **Multiple AI providers** — GitHub Copilot, OpenAI, Anthropic, Google Gemini, and Ollama (local LLMs)
- Domain-based quiz sessions — create any topic like `java-programming`, `greek-mythology`, or `thai-cuisine`
- AI-generated multiple-choice questions with automatic deduplication
- Adaptive scoring and difficulty progression based on correctness and response speed
- **Configurable language and tone** — 7 tone options including humorous, sarcastic, and pirate
- **Domain sub-menu** — play, history, stats, archive, and delete per domain
- Per-domain stats dashboard with score trend, accuracy, and return streak
- **Settings screen** to change provider, model, language, tone, and welcome screen at any time

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

## 📜 Available Scripts

```bash
npm run dev         # run from source with tsx
npm run build       # compile TypeScript to dist/
npm start           # run the compiled CLI
npm run typecheck   # run TypeScript type checking without emitting
npm test            # run the Vitest test suite once
npm run test:watch  # run Vitest in watch mode
```

## ⚙️ How It Works

On first launch, Brain Break prompts you to select and configure an AI provider. From the home screen you can create quiz domains, play sessions, review history and stats, or change settings. During a quiz, the app generates questions via your chosen provider, times your answers, and updates your score and difficulty level automatically.

## 📝 Notes

- For cloud providers (OpenAI, Anthropic, Gemini), set the corresponding API key environment variable before running the app.
- For Ollama, ensure the Ollama server is running and the chosen model is pulled locally.
- All quiz data and settings are stored locally under `~/.brain-break/`.

## 🤝 Contributing

Contributions are welcome. The project uses TypeScript with Vitest for testing — run `npm test` before submitting a pull request.

For context on the product goals and feature decisions, see the planning artifacts in [`docs/planning-artifacts/`](docs/planning-artifacts/):

- [Product Brief](docs/planning-artifacts/product-brief.md) — vision, problem statement, and success metrics
- [PRD](docs/planning-artifacts/prd.md) — detailed feature specifications and acceptance criteria
- [Architecture](docs/planning-artifacts/architecture.md) — technical design decisions
