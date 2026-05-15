/**
 * Shared test factories for data objects used across multiple test files.
 * Import these instead of redefining makeRecord / makeMeta / makeSettings locally.
 */
import { vi } from 'vitest'
import type { QuestionRecord, DomainMeta, SettingsFile } from '../domain/schema.js'
import { defaultSettings } from '../domain/schema.js'
import type { VerifiedQuestion } from '../ai/prompts.js'

export function makeRecord(overrides: Partial<QuestionRecord> = {}): QuestionRecord {
  return {
    question: 'What is TypeScript?',
    options: { A: 'A typed JS superset', B: 'A framework', C: 'A runtime', D: 'A test tool' },
    correctAnswer: 'A',
    userAnswer: 'A',
    isCorrect: true,
    answeredAt: '2026-03-12T10:00:00.000Z',
    timeTakenMs: 5000,
    speedTier: 'fast',
    scoreDelta: 60,
    difficultyLevel: 3,
    bookmarked: false,
    ...overrides,
  }
}

export function makeMeta(overrides: Partial<DomainMeta> = {}): DomainMeta {
  return {
    score: 0,
    difficultyLevel: 2,
    startingDifficulty: 2,
    streakCount: 0,
    streakType: 'none',
    totalTimePlayedMs: 0,
    createdAt: '2026-03-12T00:00:00.000Z',
    lastSessionAt: null,
    archived: false,
    ...overrides,
  }
}

export function makeSettings(overrides: Partial<SettingsFile> = {}): SettingsFile {
  return { ...defaultSettings(), ...overrides }
}

export function makeVerifiedQuestion(overrides: Partial<VerifiedQuestion> = {}): VerifiedQuestion {
  return {
    question: 'What is TypeScript?',
    options: { A: 'A typed JS superset', B: 'A framework', C: 'A runtime', D: 'A test tool' },
    correctAnswer: 'A',
    difficultyLevel: 2,
    speedThresholds: { fastMs: 8000, slowMs: 20000 },
    ...overrides,
  }
}

/**
 * Generate an array of QuestionRecord entries for testing paginated views.
 * @param count Number of records to generate
 * @param overrides Optional per-item override function (receives 0-based index)
 */
export function makeHistory(count: number, overrides?: (index: number) => Partial<QuestionRecord>): QuestionRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeRecord({
      question: `Q${i + 1}`,
      answeredAt: new Date(2026, 2, i + 1).toISOString(),
      ...(overrides?.(i) ?? {}),
    }),
  )
}

/** Spy on console.log and suppress output. Returns the spy for assertion access. */
export const muteLog = () => vi.spyOn(console, 'log').mockReturnValue(undefined)
/** Spy on console.warn and suppress output. Returns the spy for assertion access. */
export const muteWarn = () => vi.spyOn(console, 'warn').mockReturnValue(undefined)
/** Spy on console.error and suppress output. Returns the spy for assertion access. */
export const muteError = () => vi.spyOn(console, 'error').mockReturnValue(undefined)
