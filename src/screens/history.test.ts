import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  Separator: vi.fn(),
}))

vi.mock('../domain/store.js', () => ({
  readDomain: vi.fn(),
}))

vi.mock('../router.js', () => ({
  showDomainMenu: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn() }))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { readDomain } from '../domain/store.js'
import * as router from '../router.js'
import { select } from '@inquirer/prompts'
import { clearScreen } from '../utils/screen.js'
import { showHistory, buildPageChoices, formatTimestamp } from './history.js'

const mockReadDomain = vi.mocked(readDomain)
const mockShowDomainMenu = vi.mocked(router.showDomainMenu)
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
  mockShowDomainMenu.mockResolvedValue(undefined)
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
})

// ---------------------------------------------------------------------------
// buildPageChoices
// ---------------------------------------------------------------------------
describe('buildPageChoices', () => {
  it('returns only Back when there is exactly one question', () => {
    const choices = buildPageChoices(0, 1) as Array<{ name: string; value: string }>
    expect(choices).toHaveLength(1)
    expect(choices[0].value).toBe('back')
  })

  it('returns Next + Back on first question of multi-question history', () => {
    const choices = buildPageChoices(0, 3) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value)
    expect(values).toContain('next')
    expect(values).toContain('back')
    expect(values).not.toContain('prev')
  })

  it('returns Previous + Back on last question', () => {
    const choices = buildPageChoices(2, 3) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value)
    expect(values).toContain('prev')
    expect(values).toContain('back')
    expect(values).not.toContain('next')
  })

  it('returns Previous + Next + Back on a middle question', () => {
    const choices = buildPageChoices(1, 3) as Array<{ name: string; value: string }>
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
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
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
// showHistory — single question view
// ---------------------------------------------------------------------------
describe('showHistory — single question', () => {
  it('displays only the first (most recent) question on initial view', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(5) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    // Most recent is Question 5; Question 1 is oldest and must NOT appear on first view
    expect(allLogs).toContain('Question 5')
    expect(allLogs).not.toContain('#2 —')
    consoleSpy.mockRestore()
  })

  it('shows only Back when there is exactly one question', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
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

  it('shows "Question 1 of 1" header when there is exactly one question (AC6)', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Question 1 of 1')
    consoleSpy.mockRestore()
  })

  it('selecting Back calls router.showHome', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
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
    expect(allLogs).toContain('Your answer:')
    expect(allLogs).toContain('Correct:')
    expect(allLogs).toContain('Advanced')
    consoleSpy.mockRestore()
  })

  it('shows progress header "Question 1 of N"', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(5) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Question 1 of 5')
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showHistory — navigation
// ---------------------------------------------------------------------------
describe('showHistory — navigation', () => {
  it('first question shows Next + Back, no Previous', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(15) }
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

  it('selecting Next shows second question with updated progress header', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(15) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('next').mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondCallLogs = consoleSpy.mock.calls.map((c) => String(c[0]))
    const secondHeader = secondCallLogs.filter((l) => l.includes('Question 2 of'))
    expect(secondHeader.length).toBeGreaterThan(0)
    consoleSpy.mockRestore()
  })

  it('second question shows Previous + Back, no Next (when total is 2)', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(2) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('next').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const secondValues = secondChoices.map((c) => c.value)
    expect(secondValues).toContain('prev')
    expect(secondValues).toContain('back')
    expect(secondValues).not.toContain('next')
  })

  it('selecting Previous after Next returns to first question', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(15) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('prev')
      .mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // After next → prev, back at index 0: no Previous, has Next
    const thirdChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const values = thirdChoices.map((c) => c.value)
    expect(values).not.toContain('prev')
    expect(values).toContain('next')
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })

  it('only one entry is logged per navigation step', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // Only Question 3 (most recent, index 0) should appear; Question 2 and 1 must not
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('#1 — Question 3')
    expect(allLogs).not.toContain('#2 —')
    expect(allLogs).not.toContain('#3 —')
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
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
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

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('calls showHome on ExitPromptError during empty-history Back select', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockRejectedValue(new ExitPromptError('exit'))
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('calls clearScreen before rendering each history entry', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(vi.mocked(clearScreen)).toHaveBeenCalled()
  })

  it('calls clearScreen before rendering the empty history screen', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(vi.mocked(clearScreen)).toHaveBeenCalled()
  })

  it('re-throws non-ExitPromptError from navigation select', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    const boom = new Error('unexpected select failure')
    mockSelect.mockRejectedValueOnce(boom)
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await expect(showHistory('typescript')).rejects.toThrow('unexpected select failure')
  })

  it('re-throws non-ExitPromptError from empty-history navigation select', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    const boom = new Error('empty history select failure')
    mockSelect.mockRejectedValueOnce(boom)
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await expect(showHistory('typescript')).rejects.toThrow('empty history select failure')
  })
})
