---
Story: 1.1
Title: Project Scaffold & TypeScript Configuration
Status: done
Epic: 1 — Foundation & Infrastructure
Created: 2026-03-07
---

# Story 1.1: Project Scaffold & TypeScript Configuration

## Story

As a developer,
I want a fully configured TypeScript ESM project scaffold with all dependencies installed and the complete `src/` directory structure in place,
so that I have a verified, runnable foundation to build all features on.

## Acceptance Criteria

1. **Given** a fresh clone of the repo  
   **When** I run `npm install`  
   **Then** all runtime deps (`inquirer@12`, `ora@8`, `chalk@5`, `zod`) and dev deps (`typescript`, `tsx`, `@types/node`, `vitest`) are installed without errors

2. **Given** the project is installed  
   **When** I run `npm run typecheck`  
   **Then** `tsc --noEmit` exits with code 0 and no errors

3. **Given** the project is installed  
   **When** I run `tsx src/index.ts`  
   **Then** the process starts without crashing (may print a placeholder message and exit cleanly)

4. **Given** the project structure  
   **When** I inspect the repo  
  **Then** `package.json` has `"type": "module"`, a `bin` field pointing to `dist/index.js`, `engines.node: ">=22.0.0"`, and all required scripts (`dev`, `build`, `start`, `typecheck`, `test`, `test:watch`)  
   **And** `tsconfig.json` has `strict: true`, `module: "nodenext"`, `moduleResolution: "nodenext"`, `target: "es2022"`  
   **And** the full `src/` directory tree exists (all files may be empty stubs): `index.ts`, `router.ts`, `screens/`, `ai/`, `domain/`, `utils/`  
   **And** `.gitignore` excludes `node_modules/` and `dist/`

## Tasks / Subtasks

- [x] Task 1: Initialize npm project and install dependencies (AC: 1, 4)
  - [x] 1.1 Run `npm init -y` to create `package.json`
  - [x] 1.2 Set `"type": "module"` in `package.json`
  - [x] 1.3 Set `"engines": { "node": ">=22.0.0" }` in `package.json`
  - [x] 1.4 Set `"bin": { "brain-break": "dist/index.js" }` in `package.json`
  - [x] 1.5 Add all scripts: `dev` (`tsx src/index.ts`), `build` (`tsc`), `start` (`node dist/index.js`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:watch` (`vitest`)
  - [x] 1.6 Install runtime deps: `npm install inquirer@^12 ora@^8 chalk@^5 zod`
  - [x] 1.7 Install dev deps: `npm install -D typescript tsx @types/node vitest`

- [x] Task 2: Configure TypeScript (AC: 2, 4)
  - [x] 2.1 Run `npx tsc --init --module nodenext --moduleResolution nodenext --target es2022`
  - [x] 2.2 Ensure `strict: true` is set in `tsconfig.json`
  - [x] 2.3 Set `outDir: "dist"` and `rootDir: "src"` in `tsconfig.json`
  - [x] 2.4 Verify `npm run typecheck` exits with code 0

- [x] Task 3: Create full `src/` directory structure as empty stubs (AC: 3, 4)
  - [x] 3.1 Create `src/index.ts` — entry point that prints a placeholder and exits
  - [x] 3.2 Create `src/router.ts` — empty stub (export placeholder function)
  - [x] 3.3 Create `src/screens/home.ts` — empty stub
  - [x] 3.4 Create `src/screens/quiz.ts` — empty stub
  - [x] 3.5 Create `src/screens/history.ts` — empty stub
  - [x] 3.6 Create `src/screens/stats.ts` — empty stub
  - [x] 3.7 Create `src/ai/client.ts` — empty stub
  - [x] 3.8 Create `src/ai/prompts.ts` — empty stub
  - [x] 3.9 Create `src/domain/store.ts` — empty stub
  - [x] 3.10 Create `src/domain/schema.ts` — empty stub
  - [x] 3.11 Create `src/domain/scoring.ts` — empty stub
  - [x] 3.12 Create `src/utils/hash.ts` — empty stub
  - [x] 3.13 Create `src/utils/slugify.ts` — empty stub
  - [x] 3.14 Create `src/utils/format.ts` — empty stub
  - [x] 3.15 Verify `tsx src/index.ts` runs without crashing

- [x] Task 4: Update `.gitignore` (AC: 4)
  - [x] 4.1 Ensure `node_modules/` is excluded
  - [x] 4.2 Ensure `dist/` is excluded

- [x] Task 5: Write vitest smoke test (AC: 1, 2)
  - [x] 5.1 Create `src/index.test.ts` with a single passing smoke test (e.g., `expect(true).toBe(true)`)
  - [x] 5.2 Verify `npm test` exits with code 0

## Dev Notes

### Project Overview

This is a **terminal-only** CLI application: a brain-break quiz tool powered by the GitHub Copilot SDK. This first story creates the entire structural foundation — no features are implemented, just verified scaffold.

### Architecture — Critical Rules

**Module system:** `"type": "module"` in `package.json`. NodeNext module resolution requires the `.js` extension on ALL local imports, even though the source files are `.ts`:
```ts
// ✅ CORRECT — required by NodeNext
import { writeDomain } from './domain/store.js'

// ❌ WRONG — will fail at runtime
import { writeDomain } from './domain/store'
```

**ESM-native libraries only:** `inquirer@12`, `ora@8`, `chalk@5` — all are ESM-only packages in their current major versions. Do **not** use older CJS versions.

**TypeScript target:** `es2022` supports native `Array.at()`, top-level `await`, and other modern syntax used by dependencies.

**`strict: true`** in tsconfig is mandatory. All subsequent stories depend on strict null-checks.

### `src/` Directory Structure

Exact layout required by Architecture [Source: architecture.md#Module Architecture]:

```
src/
├── index.ts              # Entry point — bootstraps and calls router
├── router.ts             # Navigation between screens
├── screens/
│   ├── home.ts
│   ├── quiz.ts
│   ├── history.ts
│   └── stats.ts
├── ai/
│   ├── client.ts
│   └── prompts.ts
├── domain/
│   ├── store.ts
│   ├── schema.ts
│   └── scoring.ts
└── utils/
    ├── hash.ts
    ├── slugify.ts
    └── format.ts
```

**Dependency rules (NO violations):**
- `screens/` may import from `domain/`, `ai/`, `utils/` — never the reverse
- `router.ts` imports from `screens/` only  
- `domain/store.ts` is the **only** module that writes to disk  
- `ai/client.ts` is the **only** module that calls the Copilot SDK  
- No index barrel files — import from specific module files only

### `package.json` Final Shape

```json
{
  "name": "brain-break",
  "version": "1.0.0",
  "description": "",
  "type": "module",
  "bin": {
    "brain-break": "dist/index.js"
  },
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "chalk": "^5.0.0",
    "inquirer": "^12.0.0",
    "ora": "^8.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

### `tsconfig.json` Critical Settings

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Stub File Pattern

Each stub file must be valid TypeScript that compiles cleanly under strict mode. Use the minimal pattern:

```ts
// src/router.ts — stub
export function placeholder(): void {
  // TODO: implement in later stories
}
```

`src/index.ts` is the **only** stub that actually executes — it should print a message and `process.exit(0)`:

```ts
// src/index.ts
console.log('brain-break — scaffold ready')
process.exit(0)
```

### Testing Approach

- Co-located test files: `*.test.ts` alongside each source file [Source: architecture.md#Structure Patterns]
- No separate `__tests__/` folder — **never**
- This story only requires a single smoke test (`src/index.test.ts`) to verify vitest is wired correctly
- All real unit tests live in Stories 1.2–1.4

### Naming Conventions (for stubs)

[Source: architecture.md#Naming Patterns]
- All file names: `kebab-case` ✅ (already enforced by directory layout)
- Types/Interfaces: `PascalCase`
- Functions: `camelCase`
- Zod schemas: `PascalCase` + `Schema` suffix (e.g. `DomainFileSchema`)
- Constants: `SCREAMING_SNAKE_CASE`

### `.gitignore` — Existing File

The repo already has a `.gitignore`. Check its contents and **add** missing entries rather than overwriting. Ensure `node_modules/` and `dist/` are present.

### Project Structure Notes

- Alignment with unified project structure: confirmed match with Architecture doc [Source: architecture.md#Module Architecture]
- No conflicts detected — repo is currently empty of source files

### References

- [Source: architecture.md#Starter Template Evaluation] — Minimal TypeScript scaffold rationale
- [Source: architecture.md#Module Architecture] — Full `src/` directory structure
- [Source: architecture.md#Structure Patterns] — Test co-location, no barrel files
- [Source: architecture.md#Naming Patterns] — File, type, and function naming
- [Source: architecture.md#Format Patterns] — ESM import `.js` extension requirement
- [Source: epics.md#Story 1.1] — Acceptance criteria and additional requirements section

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- All 5 tasks / 25 subtasks complete. `package.json` and `tsconfig.json` created from scratch matching architecture spec. Full `src/` stub tree (14 files) created. `npm install` succeeded (100 packages, 0 vulnerabilities). `npm run typecheck` exits 0. `tsx src/index.ts` prints placeholder and exits cleanly. `npm test` passes (1/1). `.gitignore` already contained `node_modules/` and `dist/`.

### Senior Developer Review (AI)

**Outcome:** Changes Requested → Fixed  
**Date:** 2026-03-07  
**Action Items:** 5 found, 5 resolved

#### Action Items

- [x] [Med] `package-lock.json` missing from File List
- [x] [Med] Dev deps used `"latest"` instead of pinned semver ranges — pinned to resolved versions
- [x] [Med] `src/index.ts` missing `#!/usr/bin/env node` shebang
- [x] [Low] No `vitest.config.ts` — created with explicit `src/**/*.test.ts` include
- [x] [Low] `package.json` missing `files` field — added `["dist"]`

### File List

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- `src/index.ts`
- `src/index.test.ts`
- `src/router.ts`
- `src/screens/home.ts`
- `src/screens/quiz.ts`
- `src/screens/history.ts`
- `src/screens/stats.ts`
- `src/ai/client.ts`
- `src/ai/prompts.ts`
- `src/domain/store.ts`
- `src/domain/schema.ts`
- `src/domain/scoring.ts`
- `src/utils/hash.ts`
- `src/utils/slugify.ts`
- `src/utils/format.ts`
