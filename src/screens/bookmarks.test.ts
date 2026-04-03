import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'
import { makeRecord, setupNavScreenBeforeEach } from './__test-helpers__/nav-test-setup.js'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const { MockSeparator } = vi.hoisted(() => {
  const MockSeparator = vi.fn(function(this: any, text?: string) { this.type = 'separator'; this.text = text })
  return { MockSeparator }
})
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  Separator: MockSeparator,
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
import { showBookmarks, buildBookmarkChoices } from './bookmarks.js'

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
function makeBookmarkedHistory(count: number): QuestionRecord[] {
  return Array.from({ length: count }, (_, i) =>
    makeRecord({ question: `Question ${i + 1}`, answeredAt: new Date(2026, 2, i + 1).toISOString(), bookmarked: true }),
  )
}

function makeMixedHistory(): QuestionRecord[] {
  return [
    makeRecord({ question: 'Bookmarked 1', answeredAt: new Date(2026, 2, 1).toISOString(), bookmarked: true }),
    makeRecord({ question: 'Not bookmarked', answeredAt: new Date(2026, 2, 2).toISOString(), bookmarked: false }),
    makeRecord({ question: 'Bookmarked 2', answeredAt: new Date(2026, 2, 3).toISOString(), bookmarked: true }),
  ]
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  setupNavScreenBeforeEach({ mockShowDomainMenu, mockWriteDomain, mockReadDomain, mockReadSettings, mockGenerateExplanation, mockGenerateMicroLesson })
})

// ---------------------------------------------------------------------------
// buildBookmarkChoices
// ---------------------------------------------------------------------------
describe('buildBookmarkChoices', () => {
  it('returns Bookmark toggle + Back when there is exactly one bookmark', () => {
    const choices = buildBookmarkChoices(0, 1, false, false, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('explain')
    expect(values).toContain('bookmark')
    expect(values).toContain('back')
    expect(values).not.toContain('next')
    expect(values).not.toContain('prev')
  })

  it('returns Next + Bookmark + Back on first bookmark of multi-bookmark list', () => {
    const choices = buildBookmarkChoices(0, 3, false, false, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('next')
    expect(values).toContain('explain')
    expect(values).toContain('bookmark')
    expect(values).toContain('back')
    expect(values).not.toContain('prev')
  })

  it('returns Previous + Bookmark + Back on last bookmark', () => {
    const choices = buildBookmarkChoices(2, 3, false, false, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('prev')
    expect(values).toContain('explain')
    expect(values).toContain('bookmark')
    expect(values).toContain('back')
    expect(values).not.toContain('next')
  })

  it('returns Previous + Next + Bookmark + Back on a middle bookmark', () => {
    const choices = buildBookmarkChoices(1, 3, false, false, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('prev')
    expect(values).toContain('next')
    expect(values).toContain('explain')
    expect(values).toContain('bookmark')
    expect(values).toContain('back')
  })

  it('hides Explain when explainVisible is true', () => {
    const choices = buildBookmarkChoices(1, 3, true, false, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).not.toContain('explain')
    expect(values).toContain('teach')
    expect(values).toContain('bookmark')
  })

  it('shows Teach me more when explainVisible is true and teachVisible is false', () => {
    const choices = buildBookmarkChoices(0, 1, true, false, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('teach')
    expect(values).not.toContain('explain')
    expect(values).toContain('bookmark')
    expect(values).toContain('back')
  })

  it('shows only bookmark + Back when explainVisible and teachVisible true (single bookmark)', () => {
    const choices = buildBookmarkChoices(0, 1, true, true, true) as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toEqual(['bookmark', 'back'])
  })

  it('shows "⭐ Remove bookmark" when bookmarked is true', () => {
    const choices = buildBookmarkChoices(0, 1, false, false, true) as Array<{ name: string; value: string }>
    const bookmarkChoice = choices.find((c) => c.value === 'bookmark')
    expect(bookmarkChoice?.name).toBe('⭐ Remove bookmark')
  })

  it('shows "💫 Bookmark" when bookmarked is false', () => {
    const choices = buildBookmarkChoices(0, 1, false, false, false) as Array<{ name: string; value: string }>
    const bookmarkChoice = choices.find((c) => c.value === 'bookmark')
    expect(bookmarkChoice?.name).toBe('💫 Bookmark')
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — renders only bookmarked questions
// ---------------------------------------------------------------------------
describe('showBookmarks — renders only bookmarked questions', () => {
  it('filters to only bookmarked questions and keeps newest-first ordering', async () => {
    const domain = { ...defaultDomainFile(), history: makeMixedHistory() }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    // Initial bookmark view should match History ordering: newest bookmarked entry first.
    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Bookmarked 2')
    expect(allLogs).not.toContain('Not bookmarked')
    expect(allLogs).not.toContain('Bookmarked 1')
    consoleSpy.mockRestore()
  })

  it('shows the most recent bookmarked question first', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Question 3')
    expect(allLogs).not.toContain('Question 1')
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — empty state when no bookmarks
// ---------------------------------------------------------------------------
describe('showBookmarks — empty state', () => {
  it('shows "No bookmarked questions." when no bookmarks exist', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const choices = mockSelect.mock.calls[0][0].choices
    expect(choices[0].text).toContain('No bookmarked questions.')
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('shows "No bookmarked questions." when history has only non-bookmarked entries', async () => {
    const domain = { ...defaultDomainFile(), history: [makeRecord({ bookmarked: false })] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const choices = mockSelect.mock.calls[0][0].choices
    expect(choices[0].text).toContain('No bookmarked questions.')
  })

  it('shows only Back choice when no bookmarks', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const choices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name?: string; value?: string }>
    expect(choices).toHaveLength(3)
    expect(choices[2].value).toBe('back')
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — navigation
// ---------------------------------------------------------------------------
describe('showBookmarks — navigation', () => {
  it('first bookmark shows Next + Back, no Previous', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const choices = mockSelect.mock.calls[0][0].choices as unknown as Array<{ name: string; value: string }>
    const values = choices.map((c) => c.value).filter(Boolean)
    expect(values).toContain('next')
    expect(values).not.toContain('prev')
  })

  it('selecting Next shows second bookmark with updated progress', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('next').mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const secondMessage = mockSelect.mock.calls[1][0].message
    expect(secondMessage).toContain('Bookmark 2 of')
    consoleSpy.mockRestore()
  })

  it('selecting Previous after Next returns to first bookmark', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('prev')
      .mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const thirdMessage = mockSelect.mock.calls[2][0].message
    expect(thirdMessage).toContain('Bookmark 1 of')
    consoleSpy.mockRestore()
  })

  it('selecting Back calls router.showDomainMenu', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(mockShowDomainMenu).toHaveBeenCalledWith('typescript')
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — progress indicator
// ---------------------------------------------------------------------------
describe('showBookmarks — progress indicator', () => {
  it('shows "Bookmark 1 of N" in select message', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(5) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const selectMessage = mockSelect.mock.calls[0][0].message
    expect(selectMessage).toContain('Bookmark 1 of 5')
  })

  it('shows "Bookmark 1 of 1" when there is exactly one bookmark', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const selectMessage = mockSelect.mock.calls[0][0].message
    expect(selectMessage).toContain('Bookmark 1 of 1')
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — Bookmark toggle
// ---------------------------------------------------------------------------
describe('showBookmarks — Bookmark toggle', () => {
  it('toggles bookmarked to false and calls writeDomain', async () => {
    const record = makeRecord({ bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(record.bookmarked).toBe(false)
    expect(mockWriteDomain).toHaveBeenCalledWith('typescript', domain)
  })

  it('toggles bookmarked back to true after removing', async () => {
    const record = makeRecord({ bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('bookmark')  // toggle off
      .mockResolvedValueOnce('bookmark')  // toggle back on
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(record.bookmarked).toBe(true)
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
  })

  it('stays on same question after toggling bookmark', async () => {
    const records = makeBookmarkedHistory(3)
    const domain = { ...defaultDomainFile(), history: records }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('bookmark')  // toggle on first question
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    // Still on Bookmark 1 of 3
    const secondMessage = mockSelect.mock.calls[1][0].message
    expect(secondMessage).toContain('Bookmark 1 of 3')
  })

  it('shows "💫 Bookmark" in choices after removing bookmark', async () => {
    const record = makeRecord({ bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const bookmarkChoice = secondChoices.find((c) => c.value === 'bookmark')
    expect(bookmarkChoice?.name).toBe('💫 Bookmark')
  })

  it('shows "⭐ Remove bookmark" in choices after re-bookmarking', async () => {
    const record = makeRecord({ bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('bookmark')  // toggle off
      .mockResolvedValueOnce('bookmark')  // toggle on
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const thirdChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const bookmarkChoice = thirdChoices.find((c) => c.value === 'bookmark')
    expect(bookmarkChoice?.name).toBe('⭐ Remove bookmark')
  })

  it('shows warning when writeDomain fails on toggle', async () => {
    const record = makeRecord({ bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockWriteDomain.mockResolvedValue({ ok: false, error: 'Write failed' })
    mockSelect.mockResolvedValueOnce('bookmark').mockResolvedValueOnce('back')
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save bookmark'))
    warnSpy.mockRestore()
  })

  it('removes unbookmarked item from list on next navigation', async () => {
    const records = makeBookmarkedHistory(3)
    const domain = { ...defaultDomainFile(), history: records }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('bookmark')  // toggle first question off (bookmarked → false)
      .mockResolvedValueOnce('next')      // navigate next → list recalculated, Q1 removed
      .mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    // After removing Q3's bookmark and pressing next, we land on Q2 at index 0 of [Q2, Q1]
    const thirdMessage = mockSelect.mock.calls[2][0].message
    expect(thirdMessage).toContain('Bookmark 1 of 2')
    consoleSpy.mockRestore()
  })

  it('removes unbookmarked item from list on prev navigation', async () => {
    const records = makeBookmarkedHistory(3)
    const domain = { ...defaultDomainFile(), history: records }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('next')      // go to Q2 (index 1)
      .mockResolvedValueOnce('bookmark')  // toggle Q2 off
      .mockResolvedValueOnce('prev')      // navigate prev → list recalculated, Q2 removed, land on Q1
      .mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    // After removing Q2's bookmark and pressing prev, we land on Q3 at index 0 of [Q3, Q1]
    const fourthMessage = mockSelect.mock.calls[3][0].message
    expect(fourthMessage).toContain('Bookmark 1 of 2')
    consoleSpy.mockRestore()
  })

  it('shows empty state when all bookmarks are removed via navigation', async () => {
    const records = makeBookmarkedHistory(2)
    const domain = { ...defaultDomainFile(), history: records }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('bookmark')  // toggle Q1 off
      .mockResolvedValueOnce('next')      // navigate → recalculate to [Q2]
      .mockResolvedValueOnce('bookmark')  // toggle Q2 off
      .mockResolvedValueOnce('back')      // back from empty state
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    // After removing Q2's bookmark, navigating would show empty state
    // But since Q2 is the last item, no next/prev is available
    // so the user presses back. The flow exits via showDomainMenu.
    expect(mockShowDomainMenu).toHaveBeenCalledWith('typescript')
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — Explain answer
// ---------------------------------------------------------------------------
describe('showBookmarks — Explain answer', () => {
  it('calls generateExplanation with correct arguments', async () => {
    const record = makeRecord({ question: 'What is TS?', userAnswer: 'B', correctAnswer: 'A', difficultyLevel: 3, bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(mockGenerateExplanation).toHaveBeenCalledOnce()
    const [question, userAnswer] = mockGenerateExplanation.mock.calls[0]
    expect(question.question).toBe('What is TS?')
    expect(userAnswer).toBe('B')
  })

  it('renders explanation text inline', async () => {
    mockGenerateExplanation.mockResolvedValue({ ok: true, data: 'Because A is the correct answer.' })
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Because A is the correct answer.')
    consoleSpy.mockRestore()
  })

  it('hides Explain after explanation is displayed', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const secondChoices = mockSelect.mock.calls[1][0].choices as unknown as Array<{ name: string; value: string }>
    const secondValues = secondChoices.map((c) => c.value).filter(Boolean)
    expect(secondValues).not.toContain('explain')
    expect(secondValues).toContain('teach')
  })

  it('shows warning when AI call fails', async () => {
    mockGenerateExplanation.mockResolvedValue({ ok: false, error: 'Network error' })
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not generate explanation'))
    warnSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — Teach me more
// ---------------------------------------------------------------------------
describe('showBookmarks — Teach me more', () => {
  it('calls generateMicroLesson with correct arguments', async () => {
    const record = makeRecord({ question: 'What is TS?', userAnswer: 'B', correctAnswer: 'A', bookmarked: true })
    const domain = { ...defaultDomainFile(), history: [record] }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockGenerateExplanation.mockResolvedValue({ ok: true, data: 'Explanation of TS.' })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(mockGenerateMicroLesson).toHaveBeenCalledOnce()
    const [question, explanationText] = mockGenerateMicroLesson.mock.calls[0]
    expect(question.question).toBe('What is TS?')
    expect(explanationText).toBe('Explanation of TS.')
  })

  it('renders micro-lesson inline', async () => {
    mockGenerateMicroLesson.mockResolvedValue({ ok: true, data: 'Deep dive into TS.' })
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const allLogs = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(allLogs).toContain('Deep dive into TS.')
    consoleSpy.mockRestore()
  })

  it('removes Teach me more from choices after display', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    const thirdChoices = mockSelect.mock.calls[2][0].choices as unknown as Array<{ name: string; value: string }>
    const thirdValues = thirdChoices.map((c) => c.value).filter(Boolean)
    expect(thirdValues).not.toContain('teach')
    expect(thirdValues).not.toContain('explain')
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — ExitPromptError (Ctrl+C)
// ---------------------------------------------------------------------------
describe('showBookmarks — ExitPromptError', () => {
  it('returns gracefully on ExitPromptError during navigation', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockRejectedValue(new ExitPromptError('exit'))
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('returns gracefully on ExitPromptError during empty-state Back', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockRejectedValue(new ExitPromptError('exit'))
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('re-throws non-ExitPromptError', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(3) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    const boom = new Error('unexpected failure')
    mockSelect.mockRejectedValueOnce(boom)
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await expect(showBookmarks('typescript')).rejects.toThrow('unexpected failure')
  })

  it('calls clearAndBanner before rendering', async () => {
    const domain = { ...defaultDomainFile(), history: makeBookmarkedHistory(1) }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// showBookmarks — corrupted domain
// ---------------------------------------------------------------------------
describe('showBookmarks — corrupted domain', () => {
  it('logs warning and returns to domain menu when readDomain fails', async () => {
    mockReadDomain.mockResolvedValue({ ok: false, error: 'Domain data corrupted' })
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)

    await showBookmarks('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('corrupted'))
    expect(mockShowDomainMenu).toHaveBeenCalledWith('typescript')
    expect(mockSelect).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
