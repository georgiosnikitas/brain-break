import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'
import { makeRecord, setupNavScreenBeforeEach } from './__test-helpers__/nav-test-setup.js'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  Separator: vi.fn(),
}))

vi.mock('../domain/store.js', () => ({
  readDomain: vi.fn(),
  readSettings: vi.fn(),
  writeDomain: vi.fn(),
}))

vi.mock('../router.js', () => ({
  showDomainMenu: vi.fn(),
}))

vi.mock('../ai/client.js', () => ({
  generateExplanation: vi.fn(),
  generateMicroLesson: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { readDomain, readSettings, writeDomain } from '../domain/store.js'
import * as router from '../router.js'
import { select } from '@inquirer/prompts'
import { clearAndBanner } from '../utils/screen.js'
import { generateExplanation, generateMicroLesson } from '../ai/client.js'
import { showHistory, buildPageChoices } from './history.js'

const mockReadDomain = vi.mocked(readDomain)
const mockReadSettings = vi.mocked(readSettings)
const mockWriteDomain = vi.mocked(writeDomain)
const mockShowDomainMenu = vi.mocked(router.showDomainMenu)
const mockSelect = vi.mocked(select)
const mockGenerateExplanation = vi.mocked(generateExplanation)
const mockGenerateMicroLesson = vi.mocked(generateMicroLesson)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeHistory(count: number): QuestionRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeRecord({ question: `Question ${i + 1}`, answeredAt: new Date(2026, 2, i + 1).toISOString() }),
  )
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  setupNavScreenBeforeEach({ mockShowDomainMenu, mockWriteDomain, mockReadDomain, mockReadSettings, mockGenerateExplanation, mockGenerateMicroLesson })
})

// ---------------------------------------------------------------------------
// buildPageChoices
// ---------------------------------------------------------------------------
describe('buildPageChoices', () => {
  it('returns Explain + Back when there is exactly one question', () => {
    const choices = buildPageChoices(0, 1) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('explain')
    expect(values).toContain('back')
    expect(values).not.toContain('next')
    expect(values).not.toContain('prev')
  })

  it('returns Next + Explain + Back on first question of multi-question history', () => {
    const choices = buildPageChoices(0, 3) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('next')
    expect(values).toContain('explain')
    expect(values).toContain('back')
    expect(values).not.toContain('prev')
  })

  it('returns Previous + Explain + Back on last question', () => {
    const choices = buildPageChoices(2, 3) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('prev')
    expect(values).toContain('explain')
    expect(values).toContain('back')
    expect(values).not.toContain('next')
  })

  it('returns Previous + Next + Explain + Back on a middle question', () => {
    const choices = buildPageChoices(1, 3) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('prev')
    expect(values).toContain('next')
    expect(values).toContain('explain')
    expect(values).toContain('back')
  })

  it('hides Explain when explainVisible is true', () => {
    const choices = buildPageChoices(1, 3, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).not.toContain('explain')
    expect(values).toContain('prev')
    expect(values).toContain('next')
    expect(values).toContain('back')
  })

  it('shows Teach me more (not Explain) when explainVisible is true and teachVisible is false', () => {
    const choices = buildPageChoices(0, 1, true, false) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('teach')
    expect(values).not.toContain('explain')
    expect(values).toContain('back')
  })

  it('shows only bookmark + Back when explainVisible true and teachVisible true (micro-lesson shown, single question)', () => {
    const choices = buildPageChoices(0, 1, true, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toEqual(['bookmark', 'back'])
  })

  it('hides Teach me more when teachVisible is true on multi-question view', () => {
    const choices = buildPageChoices(1, 3, true, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).not.toContain('teach')
    expect(values).not.toContain('explain')
    expect(values).toContain('prev')
    expect(values).toContain('next')
    expect(values).toContain('back')
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

  it('shows Explain + Back when there is exactly one question', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const choices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).not.toContain('next')
    expect(values).not.toContain('prev')
    expect(values).toContain('explain')
    expect(values).toContain('back')
  })

  it('shows "Question 1 of 1" in select message when there is exactly one question (AC6)', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const selectMessage = mockSelect.mock.calls[0][0].message
    expect(selectMessage).toContain('Question 1 of 1')
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

    // Most recent is Question 3. The plain question text is logged.
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Question 3')
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
    expect(allLogs).toContain('► B)')        // user answer marker
    expect(allLogs).toContain('✗ Incorrect') // isCorrect: false
    expect(allLogs).toContain('Advanced')    // difficultyLevel: 4
    expect(allLogs).toContain('Answered:')   // showTimestamp: true in displayEntry
    consoleSpy.mockRestore()
  })

  it('shows progress "Question 1 of N" in select message', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(5) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const selectMessage = mockSelect.mock.calls[0][0].message
    expect(selectMessage).toContain('Question 1 of 5')
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showHistory — navigation
// ---------------------------------------------------------------------------
describe('showHistory — navigation', () => {
  it('first question shows Next + Explain + Back, no Previous', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(15) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const choices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('next')
    expect(values).toContain('explain')
    expect(values).toContain('back')
    expect(values).not.toContain('prev')
  })

  it('selecting Next shows second question with updated progress header', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(15) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('next').mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondMessage = mockSelect.mock.calls[1][0].message
    expect(secondMessage).toContain('Question 2 of')
    consoleSpy.mockRestore()
  })

  it('second question shows Previous + Explain + Back, no Next (when total is 2)', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(2) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('next').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const secondValues = secondChoices.map((c) => c.value).filter(Boolean)
    expect(secondValues).toContain('prev')
    expect(secondValues).toContain('explain')
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

    // After next → prev, back at index 0: no Previous, has Next + Explain
    const thirdChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const values = thirdChoices.map((c) => c.value).filter(Boolean)
    expect(values).not.toContain('prev')
    expect(values).toContain('next')
    expect(values).toContain('explain')
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
    expect(allLogs).toContain('Question 3')
    expect(allLogs).not.toContain('Question 2')
    expect(allLogs).not.toContain('Question 1')
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showHistory — explain answer
// ---------------------------------------------------------------------------
describe('showHistory — explain answer', () => {
  it('calls generateExplanation with correct arguments when Explain is selected', async () => {
    const record = makeRecord({ question: 'What is TS?', userAnswer: 'B', correctAnswer: 'A', difficultyLevel: 3 })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockGenerateExplanation).toHaveBeenCalledOnce()
    const [question, userAnswer, settings] = mockGenerateExplanation.mock.calls[0]
    expect(question.question).toBe('What is TS?')
    expect(question.options).toEqual(record.options)
    expect(question.correctAnswer).toBe('A')
    expect(userAnswer).toBe('B')
    expect(settings).toBeDefined()
  })

  it('renders explanation text inline after Explain is selected', async () => {
    mockGenerateExplanation.mockResolvedValue({ ok: true, data: 'Because A is the correct answer.' })
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Because A is the correct answer.')
    consoleSpy.mockRestore()
  })

  it('hides Explain after explanation is displayed', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // First call: has explain. Second call (after explain): no explain
    const firstChoices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name: string; value: string }>
    const firstValues = firstChoices.map((c) => c.value).filter(Boolean)
    expect(firstValues).toContain('explain')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const secondValues = secondChoices.map((c) => c.value).filter(Boolean)
    expect(secondValues).not.toContain('explain')
  })

  it('Explain is available again after navigating away and back', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    // explain → next → prev → back
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('prev')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // Call 0: has explain (before explain). Call 1: no explain (after explain).
    // Call 2: next question, has explain. Call 3: prev (back to original), has explain again.
    const call3Choices = mockSelect.mock.calls[3][0].choices as unknown as Array<{ name: string; value: string }>
    const call3Values = call3Choices.map((c) => c.value).filter(Boolean)
    expect(call3Values).toContain('explain')
  })

  it('shows warning and keeps Explain available when AI call fails', async () => {
    mockGenerateExplanation.mockResolvedValue({ ok: false, error: 'Network error' })
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not generate explanation'))
    // Second call should still have explain (failure didn't hide it)
    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const secondValues = secondChoices.map((c) => c.value).filter(Boolean)
    expect(secondValues).toContain('explain')
    // Warning must survive on screen — clearAndBanner only called once (initial render)
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
    warnSpy.mockRestore()
  })

  it('ignores a teach action when no explanation text is available', async () => {
    mockGenerateExplanation.mockResolvedValue({ ok: false, error: 'Network error' })
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockGenerateMicroLesson).not.toHaveBeenCalled()
    expect(mockSelect).toHaveBeenCalledTimes(3)
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('does not call clearAndBanner when rendering explanation inline', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    const mockClearAndBanner = vi.mocked(clearAndBanner)

    await showHistory('typescript')

    // clearAndBanner called once for initial render, NOT called again after explain
    expect(mockClearAndBanner).toHaveBeenCalledTimes(1)
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

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
  })

  it('calls clearScreen before rendering the empty history screen', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
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

// ---------------------------------------------------------------------------
// showHistory — teach me more
// ---------------------------------------------------------------------------
describe('showHistory — teach me more', () => {
  it('"Teach me more" appears in choices after explanation is shown', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    // explain → then back
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const secondValues = secondChoices.map((c) => c.value).filter(Boolean)
    expect(secondValues).toContain('teach')
    expect(secondValues).not.toContain('explain')
  })

  it('calls generateMicroLesson with correct arguments', async () => {
    const record = makeRecord({ question: 'What is TS?', userAnswer: 'B', correctAnswer: 'A', difficultyLevel: 3 })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockGenerateExplanation.mockResolvedValue({ ok: true, data: 'Explanation of TS.' })
    // explain → teach → back
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockGenerateMicroLesson).toHaveBeenCalledOnce()
    const [question, explanationText, settings] = mockGenerateMicroLesson.mock.calls[0]
    expect(question.question).toBe('What is TS?')
    expect(question.correctAnswer).toBe('A')
    expect(explanationText).toBe('Explanation of TS.')
    expect(settings).toBeDefined()
  })

  it('renders micro-lesson inline after Teach me more is selected', async () => {
    mockGenerateMicroLesson.mockResolvedValue({ ok: true, data: 'Deep dive into TypeScript generics.' })
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Deep dive into TypeScript generics.')
    consoleSpy.mockRestore()
  })

  it('"Teach me more" is removed from choices after micro-lesson is displayed', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // Call 2 (after teach): no teach option
    const thirdChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const thirdValues = thirdChoices.map((c) => c.value).filter(Boolean)
    expect(thirdValues).not.toContain('teach')
    expect(thirdValues).not.toContain('explain')
  })

  it('"Teach me more" available again after navigating away, back, and re-explaining', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    // explain → teach → next → prev → explain → back
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('prev')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // Call 5 (after second explain): teach should be available
    const call5Choices = mockSelect.mock.calls[5][0].choices as unknown as Array<{ name: string; value: string }>
    const call5Values = call5Choices.map((c) => c.value).filter(Boolean)
    expect(call5Values).toContain('teach')
    expect(call5Values).not.toContain('explain')
  })

  it('shows warning and keeps "Teach me more" available when AI call fails', async () => {
    mockGenerateMicroLesson.mockResolvedValue({ ok: false, error: 'Network error' })
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not generate micro-lesson'))
    // Third call: teach still available after failure
    const thirdChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const thirdValues = thirdChoices.map((c) => c.value).filter(Boolean)
    expect(thirdValues).toContain('teach')
    // Warning must survive on screen — clearAndBanner only called once (initial render)
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
    warnSpy.mockRestore()
  })

  it('single-entry history shows only Back after micro-lesson is displayed', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // Third call: bookmark + Back (no next/prev/teach/explain)
    const thirdChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const thirdValues = thirdChoices.map((c) => c.value).filter(Boolean)
    expect(thirdValues).toEqual(['bookmark', 'back'])
  })

  it('does not call clearAndBanner when rendering micro-lesson inline', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // clearAndBanner only called once for initial render, not after teach
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// buildPageChoices — bookmark
// ---------------------------------------------------------------------------
describe('buildPageChoices — bookmark', () => {
  it('includes bookmark in default state (no explain, no teach)', () => {
    const choices = buildPageChoices(0, 1) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('bookmark')
  })

  it('includes bookmark when explainVisible is true', () => {
    const choices = buildPageChoices(0, 1, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('bookmark')
  })

  it('includes bookmark when explainVisible and teachVisible are both true', () => {
    const choices = buildPageChoices(0, 1, true, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('bookmark')
  })

  it('shows "💫 Bookmark" label when bookmarked is false', () => {
    const choices = buildPageChoices(0, 1, false, false, false) as Array<{ name: string; value: string }>
    const bookmark = choices.find((c) => c.value === 'bookmark')
    expect(bookmark?.name).toBe('💫 Bookmark')
  })

  it('shows "⭐ Remove bookmark" label when bookmarked is true', () => {
    const choices = buildPageChoices(0, 1, false, false, true) as Array<{ name: string; value: string }>
    const bookmark = choices.find((c) => c.value === 'bookmark')
    expect(bookmark?.name).toBe('⭐ Remove bookmark')
  })

  it('defaults to "💫 Bookmark" when bookmarked param is omitted', () => {
    const choices = buildPageChoices(0, 1) as Array<{ name: string; value: string }>
    const bookmark = choices.find((c) => c.value === 'bookmark')
    expect(bookmark?.name).toBe('💫 Bookmark')
  })

  it('bookmark is positioned after explain and before next/prev', () => {
    const choices = buildPageChoices(0, 3) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    const explainIdx = values.indexOf('explain')
    const bookmarkIdx = values.indexOf('bookmark')
    const nextIdx = values.indexOf('next')
    expect(explainIdx).toBeLessThan(bookmarkIdx)
    expect(bookmarkIdx).toBeLessThan(nextIdx)
  })

  it('bookmark is positioned after teach (when explain visible, teach not yet shown)', () => {
    const choices = buildPageChoices(0, 1, true, false) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    const teachIdx = values.indexOf('teach')
    const bookmarkIdx = values.indexOf('bookmark')
    expect(teachIdx).toBeLessThan(bookmarkIdx)
  })
})

// ---------------------------------------------------------------------------
// showHistory — bookmark toggle
// ---------------------------------------------------------------------------
describe('showHistory — bookmark toggle', () => {
  it('selecting Bookmark calls writeDomain once', async () => {
    const domain = { ...defaultDomainFile(), history: [makeRecord({ bookmarked: false })] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockWriteDomain).toHaveBeenCalledOnce()
    expect(mockWriteDomain).toHaveBeenCalledWith('typescript', expect.any(Object))
  })

  it('selecting Bookmark toggles bookmarked from false to true', async () => {
    const record = makeRecord({ bookmarked: false })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const [, writtenDomain] = mockWriteDomain.mock.calls[0]
    expect((writtenDomain as typeof domain).history[0].bookmarked).toBe(true)
  })

  it('after bookmarking, choices show "⭐ Remove bookmark"', async () => {
    const domain = { ...defaultDomainFile(), history: [makeRecord({ bookmarked: false })] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const bookmark = secondChoices.find((c) => c.value === 'bookmark')
    expect(bookmark?.name).toBe('⭐ Remove bookmark')
  })

  it('selecting Remove bookmark toggles bookmarked from true to false', async () => {
    const record = makeRecord({ bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const [, writtenDomain] = mockWriteDomain.mock.calls[0]
    expect((writtenDomain as typeof domain).history[0].bookmarked).toBe(false)
  })

  it('after removing bookmark, choices show "💫 Bookmark"', async () => {
    const domain = { ...defaultDomainFile(), history: [makeRecord({ bookmarked: true })] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const bookmark = secondChoices.find((c) => c.value === 'bookmark')
    expect(bookmark?.name).toBe('💫 Bookmark')
  })

  it('bookmark toggle twice restores original state (false→true→false)', async () => {
    const domain = { ...defaultDomainFile(), history: [makeRecord({ bookmarked: false })] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
    const [, secondDomain] = mockWriteDomain.mock.calls[1]
    expect((secondDomain as typeof domain).history[0].bookmarked).toBe(false)
  })

  it('bookmark choice is present in default state choices on first render', async () => {
    const domain = { ...defaultDomainFile(), history: [makeRecord()] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const choices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('bookmark')
  })

  it('bookmark choice persists after explanation is shown', async () => {
    const domain = { ...defaultDomainFile(), history: [makeRecord()] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const values = secondChoices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('bookmark')
  })

  it('bookmark choice persists after micro-lesson is shown', async () => {
    const domain = { ...defaultDomainFile(), history: [makeRecord()] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const thirdChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const values = thirdChoices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('bookmark')
  })

  it('bookmark does not call writeDomain when not selected', async () => {
    const domain = { ...defaultDomainFile(), history: makeHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('next').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(mockWriteDomain).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// showHistory — question display
// ---------------------------------------------------------------------------
describe('showHistory — question display', () => {
  it('shows question text when record is bookmarked', async () => {
    const record = makeRecord({ question: 'What is TypeScript?', bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('What is TypeScript?')
    expect(allLogs).not.toContain('⭐ What is TypeScript?')
    consoleSpy.mockRestore()
  })

  it('shows question text when record is not bookmarked', async () => {
    const record = makeRecord({ question: 'What is TypeScript?', bookmarked: false })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('What is TypeScript?')
    consoleSpy.mockRestore()
  })

  it('bookmark toggle does not trigger screen re-render (clearAndBanner called once)', async () => {
    const record = makeRecord({ question: 'What is TypeScript?', bookmarked: false })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // clearAndBanner called once: initial render only (no re-render on bookmark toggle)
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
  })

  it('remove bookmark does not trigger screen re-render (clearAndBanner called once)', async () => {
    const record = makeRecord({ question: 'What is TypeScript?', bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    // clearAndBanner called once: initial render only (no re-render on bookmark toggle)
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
  })

  it('shows warning when writeDomain fails on bookmark', async () => {
    mockWriteDomain.mockResolvedValue({ ok: false, error: 'Disk full' })
    const domain = { ...defaultDomainFile(), history: [makeRecord({ bookmarked: false })] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showHistory('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save bookmark'))
    warnSpy.mockRestore()
  })
})

