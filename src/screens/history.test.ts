import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}))

vi.mock('../domain/store.js', () => ({
  readDomain: vi.fn(),
}))

vi.mock('../router.js', () => ({
  showHome: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { readDomain } from '../domain/store.js'
import * as router from '../router.js'
import { select } from '@inquirer/prompts'
import { showHistory, buildPageChoices, formatTimestamp, PAGE_SIZE } from './history.js'

const mockReadDomain = vi.mocked(readDomain)
const mockShowHome = vi.mocked(router.showHome)
const mockSelect = vi.mocked(select)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRecord(overrides: Partial<QuestionRecord> = {}): QuestionRecord {
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
    ...overrides,
  }
}

function makeHistory(count: number): QuestionRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeRecord({ question: `Question ${i + 1}`, answeredAt: new Date(2026, 2, i + 1).toISOString() }),
  )
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  mockShowHome.mockResolvedValue(undefined)
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
})

// ---------------------------------------------------------------------------
// buildPageChoices
// ---------------------------------------------------------------------------
describe('buildPageChoices', () => {
  it('returns only Back on the only page', () => {
    const choices = buildPageChoices(0, 1)
    expect(choices).toHaveLength(1)
    expect(choices[0].value).toBe('back')
  })

  it('returns Next + Back on first page of multi-page', () => {
    const choices = buildPageChoices(0, 3)
    const values = choices.map((c) => c.value)
    expect(values).toContain('next')
    expect(values).toContain('back')
    expect(values).not.toContain('prev')
  })

  it('returns Previous + Back on last page', () => {
    const choices = buildPageChoices(2, 3)
    const values = choices.map((c) => c.value)
    expect(values).toContain('prev')
    expect(values).toContain('back')
    expect(values).not.toContain('next')
  })

  it('returns Previous + Next + Back on middle page', () => {
    const choices = buildPageChoices(1, 3)
    const values = choices.map((c) => c.value)
    expect(values).toContain('prev')
    expect(values).toContain('next')
    expect(values).toContain('back')
  })
})

// ---------------------------------------------------------------------------
// formatTimestamp
// ---------------------------------------------------------------------------
describe('formatTimestamp', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatTimestamp('2026-03-12T10:00:00.000Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// showHistory — empty history
// ---------------------------------------------------------------------------
describe('showHistory — empty history', () => {
  it('logs "No questions answered yet" and calls showHome after Back', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('No questions answered yet')
    expect(mockShowHome).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })

  it('shows only Back choice when history is empty', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const choices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name: string; value: string }>
    expect(choices).toHaveLength(1)
    expect(choices[0].value).toBe('back')
  })
})

// ---------------------------------------------------------------------------
// showHistory — single page (≤ PAGE_SIZE)
// ---------------------------------------------------------------------------
describe('showHistory — single page', () => {
  it('displays all entries when history ≤ PAGE_SIZE', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(PAGE_SIZE) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // Each entry should have been logged (header + entry lines)
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Question 1')
    expect(allLogs).toContain(`Question ${PAGE_SIZE}`)
    consoleSpy.mockRestore()
  })

  it('shows only Back navigation on single page', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(5) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const choices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value)
    expect(values).not.toContain('next')
    expect(values).not.toContain('prev')
    expect(values).toContain('back')
  })

  it('selecting Back calls router.showHome', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockShowHome).toHaveBeenCalledOnce()
  })

  it('displays most-recent entry first (reversed history)', async () => {
    const records = makeHistory(3) // Question 1, Question 2, Question 3 in order
    const domain = { ...defaultDomainFile(), history: records }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // Most recent is Question 3. The entry header format is "#1 — Question 3"
    const loggedLines = consoleSpy.mock.calls.map((c) => String(c[0]))
    const firstEntryLine = loggedLines.find((l) => l.includes('#1 —'))
    expect(firstEntryLine).toBeDefined()
    expect(firstEntryLine).toContain('Question 3')
    consoleSpy.mockRestore()
  })

  it('each entry log contains required fields', async () => {
    const record = makeRecord({
      question: 'What is Zod?',
      userAnswer: 'B',
      correctAnswer: 'C',
      isCorrect: false,
      timeTakenMs: 12000,
      speedTier: 'normal',
      scoreDelta: -30,
      difficultyLevel: 4,
    })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('What is Zod?')
    expect(allLogs).toContain('Your answer:')  // answer row is rendered
    expect(allLogs).toContain('Correct:')      // correct answer label present
    expect(allLogs).toContain('4')             // difficulty level
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showHistory — multi-page
// ---------------------------------------------------------------------------
describe('showHistory — multi-page', () => {
  it('first page shows Next + Back, no Previous', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(PAGE_SIZE + 5) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const choices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value)
    expect(values).toContain('next')
    expect(values).toContain('back')
    expect(values).not.toContain('prev')
  })

  it('navigating Next increments page and shows Previous on second page', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(PAGE_SIZE + 5) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('next').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondPageChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const secondPageValues = secondPageChoices.map((c) => c.value)
    expect(secondPageValues).toContain('prev')
    expect(secondPageValues).toContain('back')
    expect(secondPageValues).not.toContain('next')
  })

  it('navigating Previous after Next returns to first page (no Previous)', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(PAGE_SIZE + 5) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('prev')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const thirdPageChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const values = thirdPageChoices.map((c) => c.value)
    expect(values).not.toContain('prev')
    expect(values).toContain('next')
    expect(mockShowHome).toHaveBeenCalledOnce()
  })

  it('only PAGE_SIZE entries are logged per page', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(PAGE_SIZE + 3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // First page (most-recent-first): entries for Question 13..4
    // Question 3, 2, 1 are on page 2 and must NOT appear
    // Note: 'Question 3' is NOT a substring of any page-1 entry name (Q4–Q13)
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain(`Question ${PAGE_SIZE + 3}`)
    expect(allLogs).not.toContain('#11 —')
    expect(allLogs).not.toContain('Question 3\n')
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showHistory — corrupted domain read
// ---------------------------------------------------------------------------
describe('showHistory — corrupted domain', () => {
  it('logs warning and shows empty history when readDomain fails', async () => {
    mockReadDomain.mockResolvedValue({ ok: false, error: 'Domain data for typescript appears corrupted' })
    mockSelect.mockResolvedValue('back')
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    const logSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('corrupted'))
    const allLogs = logSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('No questions answered yet')
    expect(mockShowHome).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
    logSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showHistory — ExitPromptError
// ---------------------------------------------------------------------------
describe('showHistory — ExitPromptError', () => {
  it('calls showHome on ExitPromptError during navigation select', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockRejectedValue(new ExitPromptError('exit'))
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockShowHome).toHaveBeenCalledOnce()
  })

  it('calls showHome on ExitPromptError during empty-history Back select', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockRejectedValue(new ExitPromptError('exit'))
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockShowHome).toHaveBeenCalledOnce()
  })
})
