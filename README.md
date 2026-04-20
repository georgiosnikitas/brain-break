
# 🧠🔨 Brain Break

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=georgiosnikitas_brain-break&metric=alert_status)](https://sonarcloud.io/summary/overall?id=georgiosnikitas_brain-break)
[![CI](https://github.com/georgiosnikitas/brain-break/actions/workflows/ci.yml/badge.svg)](https://github.com/georgiosnikitas/brain-break/actions/workflows/ci.yml)
[![Release](https://github.com/georgiosnikitas/brain-break/actions/workflows/release.yml/badge.svg?event=push)](https://github.com/georgiosnikitas/brain-break/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/brain-break)](https://www.npmjs.com/package/brain-break)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/github/license/georgiosnikitas/brain-break)](LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/georgiosnikitas)

Brain Break is an AI-powered terminal quiz app built with TypeScript. Define quiz domains, answer AI-generated questions, and review your score progression and history — all from a CLI interface. Choose from multiple AI providers including OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama for local models, or any OpenAI-compatible endpoint.

```
  🧠🔨
   ____            _          ____                 _
  | __ ) _ __ __ _(_)_ __    | __ ) _ __ ___  __ _| | __
  |  _ \| '__/ _` | | '_ \   |  _ \| '__/ _ \/ _` | |/ /
  | |_) | | | (_| | | | | |  | |_) | | |  __/ (_| |   <
  |____/|_|  \__,_|_|_| |_|  |____/|_|  \___|\__,_|_|\_\

  > Train your brain, one question at a time_
```

## ✨ Features

- **Multiple AI providers** — OpenAI, Anthropic, Google Gemini, GitHub Copilot, Ollama (local LLMs), and any OpenAI-compatible endpoint
- **Domain-based quiz sessions** — create any topic like `java-programming`, `greek-mythology`, or `thai-cuisine`
- **AI-generated questions** — multiple-choice questions with automatic deduplication
- **Adaptive difficulty** — scoring and difficulty progression based on correctness and response speed
- **Explain answer** — ask the AI to explain why the correct answer is right after any question
- **Teach me more** — drill deeper with AI-generated micro-lessons after viewing an explanation
- **Question bookmarking** — bookmark any answered question from the quiz or history for later revisiting via a dedicated bookmarks view
- **My Coach** — AI-generated coaching report per domain analyzing your question history to surface strengths, weaknesses, trajectory, and recommendations
- **Domain sub-menu** — play, challenge, history, bookmarks, stats, my coach, ASCII art, archive, and delete per domain
- **Stats dashboard** — per-domain score trend, accuracy, and return streak
- **ASCII art milestone** — unlock FIGlet ASCII art per domain
- **Configurable language and tone** — language selection for questions and explanations, plus 7 tone options including humorous, sarcastic, and pirate
- **Dark & Light theme** — toggle between dark and light terminal background modes for readable colors on any terminal
- **Settings screen** — change provider, model, language, tone, my coach scope, theme, and welcome screen at any time

## 📋 Requirements

- Node.js `>= 22.0.0`
- An AI provider configured through the in-app settings:
  - **Anthropic** — `ANTHROPIC_API_KEY` environment variable
  - **OpenAI** — `OPENAI_API_KEY` environment variable
  - **Google Gemini** — `GOOGLE_GENERATIVE_AI_API_KEY` environment variable
  - **GitHub Copilot** — active Copilot subscription and authentication in the environment
  - **Ollama** — a running Ollama instance
  - **OpenAI Compatible API** — `OPENAI_COMPATIBLE_API_KEY` environment variable. Use for any service exposing an OpenAI-compatible chat completions endpoint (e.g. Azure OpenAI, Groq, Together AI, Mistral, Perplexity, DeepSeek, LM Studio, vLLM). 

## 🚀 Installation

### 🍺 Homebrew (macOS)

```bash
brew tap georgiosnikitas/brain-break
brew install brain-break
```

### 📦 From npm

```bash
npm install -g brain-break
```

### 📦 From GitHub Packages

```bash
npm install -g @georgiosnikitas/brain-break --registry=https://npm.pkg.github.com
```

> **Note:** GitHub Packages requires authentication even for public packages. Add a [personal access token](https://github.com/settings/tokens) with `read:packages` scope to your `~/.npmrc`:
>
> ```
> //npm.pkg.github.com/:_authToken=YOUR_TOKEN
> ```

After installing via Homebrew, npm, or GitHub Packages, run it from anywhere:

```bash
brain-break
```

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

- All quiz data and settings are stored locally under `~/.brain-break/`.

## 🤝 Contributing

Contributions are welcome. The project uses TypeScript with Vitest for testing — run `npm test` before submitting a pull request.

For context on the product goals and feature decisions, see the planning artifacts in [`docs/planning-artifacts/`](docs/planning-artifacts/):

- [Product Brief](docs/planning-artifacts/product-brief.md) — vision, problem statement, and success metrics
- [PRD](docs/planning-artifacts/prd.md) — detailed feature specifications and acceptance criteria
- [Architecture](docs/planning-artifacts/architecture.md) — technical design decisions
