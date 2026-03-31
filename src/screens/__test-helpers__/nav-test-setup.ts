/**
 * Shared test helpers for history and bookmark screen tests.
 * Centralises makeRecord and mock setup helpers
 * that were previously duplicated across both test files.
 */
import { vi } from 'vitest'
import { defaultDomainFile, type QuestionRecord } from '../../domain/schema.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export const DEFAULT_SETTINGS = {
  provider: null,
  language: 'English',
  tone: 'natural' as const,
  openaiModel: 'gpt-4o-mini',
  anthropicModel: 'claude-sonnet-4-20250514',
  geminiModel: 'gemini-2.0-flash',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3',
  showWelcome: true,
}

/**
 * Standard beforeEach setup for nav screen tests.
 * Requires the mocked modules to already be imported in the calling scope.
 */
interface NavScreenMocks {
  mockShowDomainMenu: ReturnType<typeof vi.fn>
  mockWriteDomain: ReturnType<typeof vi.fn>
  mockReadDomain: ReturnType<typeof vi.fn>
  mockReadSettings: ReturnType<typeof vi.fn>
  mockGenerateExplanation: ReturnType<typeof vi.fn>
  mockGenerateMicroLesson: ReturnType<typeof vi.fn>
}

export function setupNavScreenBeforeEach(mocks: NavScreenMocks): void {
  const { mockShowDomainMenu, mockWriteDomain, mockReadDomain, mockReadSettings, mockGenerateExplanation, mockGenerateMicroLesson } = mocks
  vi.clearAllMocks()
  mockShowDomainMenu.mockResolvedValue(undefined)
  mockWriteDomain.mockResolvedValue({ ok: true, data: undefined })
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  mockReadSettings.mockResolvedValue({ ok: true, data: DEFAULT_SETTINGS })
  mockGenerateExplanation.mockResolvedValue({ ok: true, data: 'Test explanation text' })
  mockGenerateMicroLesson.mockResolvedValue({ ok: true, data: 'Test micro-lesson text' })
}
