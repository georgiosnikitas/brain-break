import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { MAX_COACH_REPORT_LENGTH, defaultDomainFile, defaultSettings, type DomainFile, type QuestionRecord, type SettingsFile } from '../domain/schema.js'
import { makeRecord, makeHistory } from '../__test-helpers__/factories.js'

// ---------------------------------------------------------------------------
// Hoisted mocks
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

vi.mock('../ai/client.js', () => ({
  generateCoachReport: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({
  clearAndBanner: vi.fn(),
}))

vi.mock('../utils/format.js', () => ({
  header: (s: string) => `[header]${s}`,
  dim: (s: string) => `[dim]${s}`,
  warn: (s: string) => `[warn]${s}`,
  error: (s: string) => `[error]${s}`,
  menuTheme: {},
}))

vi.mock('ora', () => ({
  default: () => ({ start: () => ({ stop: vi.fn(), text: '' }) }),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { select } from '@inquirer/prompts'
import { readDomain, readSettings, writeDomain } from '../domain/store.js'
import { generateCoachReport } from '../ai/client.js'
import { clearAndBanner } from '../utils/screen.js'
import { showMyCoachScreen, sliceHistoryByScope, formatCoachTimestamp } from './my-coach.js'

const mockSelect = vi.mocked(select)
const mockReadDomain = vi.mocked(readDomain)
const mockReadSettings = vi.mocked(readSettings)
const mockWriteDomain = vi.mocked(writeDomain)
const mockGenerateCoachReport = vi.mocked(generateCoachReport)
const mockClearAndBanner = vi.mocked(clearAndBanner)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeDomain(history: QuestionRecord[] = [], metaOverrides: Partial<DomainFile['meta']> = {}): DomainFile {
  const base = defaultDomainFile()
  return {
    ...base,
    meta: { ...base.meta, ...metaOverrides },
    history,
  }
}

function settingsWithScope(scope: SettingsFile['myCoachScope']): SettingsFile {
  return { ...defaultSettings(), myCoachScope: scope }
}

let consoleSpy: ReturnType<typeof vi.spyOn>

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  mockReadSettings.mockResolvedValue({ ok: true, data: defaultSettings() })
  mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(5)) })
  mockWriteDomain.mockResolvedValue({ ok: true, data: undefined })
  mockGenerateCoachReport.mockResolvedValue({ ok: true, data: 'COACH REPORT' })
  // Default: press back
  mockSelect.mockResolvedValue('back')
  consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
})

afterEach(() => {
})

// ---------------------------------------------------------------------------
// sliceHistoryByScope
// ---------------------------------------------------------------------------
describe('sliceHistoryByScope', () => {
  it('returns the last 25 items when scope="25" and history is longer', () => {
    const history = makeHistory(40)
    const sliced = sliceHistoryByScope(history, '25')
    expect(sliced).toHaveLength(25)
    expect(sliced[0].question).toBe('Q16')
    expect(sliced.at(-1)?.question).toBe('Q40')
  })

  it('returns all items when scope="25" and history is shorter', () => {
    const history = makeHistory(10)
    const sliced = sliceHistoryByScope(history, '25')
    expect(sliced).toHaveLength(10)
  })

  it('returns the last 100 items when scope="100" and history is longer', () => {
    const history = makeHistory(150)
    const sliced = sliceHistoryByScope(history, '100')
    expect(sliced).toHaveLength(100)
    expect(sliced[0].question).toBe('Q51')
  })

  it('returns the full history when scope="all"', () => {
    const history = makeHistory(200)
    const sliced = sliceHistoryByScope(history, 'all')
    expect(sliced).toHaveLength(200)
  })

  it('returns empty array for empty history', () => {
    expect(sliceHistoryByScope([], '25')).toEqual([])
    expect(sliceHistoryByScope([], '100')).toEqual([])
    expect(sliceHistoryByScope([], 'all')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// formatCoachTimestamp
// ---------------------------------------------------------------------------
describe('formatCoachTimestamp', () => {
  it('formats a date as "Mon DD, YYYY at HH:MM"', () => {
    const d = new Date('2026-04-19T14:32:00.000Z')
    const formatted = formatCoachTimestamp(d)
    // Match pattern regardless of locale offset
    expect(formatted).toMatch(/^[A-Za-z]{3} \d{1,2}, \d{4} at \d{2}:\d{2}$/)
  })
})

// ---------------------------------------------------------------------------
// showMyCoachScreen — rendering
// ---------------------------------------------------------------------------
describe('showMyCoachScreen — rendering', () => {
  it('calls clearAndBanner and renders the domain header', async () => {

    await showMyCoachScreen('typescript')

    expect(mockClearAndBanner).toHaveBeenCalled()
    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('🏋️ My Coach — typescript')
  })

  it('renders the coaching report from the AI', async () => {
    mockGenerateCoachReport.mockResolvedValueOnce({ ok: true, data: 'My personal coaching report.' })

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('My personal coaching report.')
  })

  it('renders a generation timestamp in dim text below the header', async () => {

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toMatch(/\[dim\]Generated: /)
  })

  it('renders the tip when history has fewer than 25 answered questions', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(10)) })

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('Tip: Reports become more accurate with at least 25 answered questions.')
  })

  it('hides the tip when history has 25 or more questions', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(30)) })

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).not.toContain('Tip: Reports become more accurate')
  })

  it('shows a warning and does not generate a report when the domain has no answered questions', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain([]) })

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('Answer at least one question before using My Coach.')
    expect(mockGenerateCoachReport).not.toHaveBeenCalled()
    expect(mockWriteDomain).not.toHaveBeenCalled()
    expect(mockSelect).toHaveBeenCalledTimes(1) // Back-only navigation prompt
  })
})

// ---------------------------------------------------------------------------
// showMyCoachScreen — scope and AI call
// ---------------------------------------------------------------------------
describe('showMyCoachScreen — AI call scope', () => {
  it('calls generateCoachReport with history sliced to the last 25 when scope="25"', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithScope('25') })
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(40)) })

    await showMyCoachScreen('typescript')

    const [slugArg, historyArg] = mockGenerateCoachReport.mock.calls[0]
    expect(slugArg).toBe('typescript')
    expect(historyArg).toHaveLength(25)
  })

  it('calls generateCoachReport with history sliced to the last 100 when scope="100"', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithScope('100') })
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(150)) })

    await showMyCoachScreen('typescript')

    const [, historyArg] = mockGenerateCoachReport.mock.calls[0]
    expect(historyArg).toHaveLength(100)
  })

  it('calls generateCoachReport with the full history when scope="all"', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithScope('all') })
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(200)) })

    await showMyCoachScreen('typescript')

    const [, historyArg] = mockGenerateCoachReport.mock.calls[0]
    expect(historyArg).toHaveLength(200)
  })

  it('passes the full history when history length is below the scope', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithScope('100') })
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(8)) })

    await showMyCoachScreen('typescript')

    const [, historyArg] = mockGenerateCoachReport.mock.calls[0]
    expect(historyArg).toHaveLength(8)
  })
})

// ---------------------------------------------------------------------------
// showMyCoachScreen — persistence
// ---------------------------------------------------------------------------
describe('showMyCoachScreen — persistence', () => {
  it('persists lastCoachQuestionCount and lastCoachTimestamp after a successful report', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(30)) })

    await showMyCoachScreen('typescript')

    expect(mockWriteDomain).toHaveBeenCalledTimes(1)
    const [slugArg, domainArg] = mockWriteDomain.mock.calls[0]
    expect(slugArg).toBe('typescript')
    expect(domainArg.meta.lastCoachQuestionCount).toBe(30)
    expect(domainArg.meta.lastCoachTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('does NOT persist metadata when the AI call fails', async () => {
    mockGenerateCoachReport.mockResolvedValueOnce({ ok: false, error: 'boom' })

    await showMyCoachScreen('typescript')

    expect(mockWriteDomain).not.toHaveBeenCalled()
  })

  it('surfaces writeDomain errors to the user instead of silently succeeding', async () => {
    mockWriteDomain.mockResolvedValueOnce({ ok: false, error: 'Failed to write domain file' })

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('Failed to write domain file')
    // No report should be rendered when the write fails
    expect(logged).not.toContain('COACH REPORT')
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('truncates oversized coaching reports before persisting them', async () => {
    mockGenerateCoachReport.mockResolvedValueOnce({ ok: true, data: 'x'.repeat(MAX_COACH_REPORT_LENGTH + 17) })

    await showMyCoachScreen('typescript')

    const [, domainArg] = mockWriteDomain.mock.calls[0]
    expect(domainArg.meta.lastCoachReport).toHaveLength(MAX_COACH_REPORT_LENGTH)
  })
})

// ---------------------------------------------------------------------------
// showMyCoachScreen — regenerate & staleness
// ---------------------------------------------------------------------------
describe('showMyCoachScreen — regenerate & staleness', () => {
  it('regenerates a fresh report on Regenerate and updates metadata again', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(30)) })
    mockSelect
      .mockResolvedValueOnce('regenerate')
      .mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    expect(mockGenerateCoachReport).toHaveBeenCalledTimes(2)
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
  })

  it('shows the staleness notice using the last persisted report metadata on regenerate', async () => {
    // Iteration 1 (first render): no staleness notice.
    // Iteration 2 (after Regenerate): the prior report already persisted count=30, so 0 new questions → notice fires.
    mockReadDomain.mockImplementation(async () => ({ ok: true, data: makeDomain(makeHistory(30), { lastCoachQuestionCount: 30 }) }))
    mockSelect
      .mockResolvedValueOnce('regenerate')
      .mockResolvedValueOnce('back')


    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('Only 0 new questions answered since your last report')
    expect(logged).toContain('may not differ significantly')
  })

  it('does NOT show staleness notice before Regenerate when ≥25 new questions since last report', async () => {
    // Use a cached report so the initial view shows the prompt without generating first.
    // 40 new questions ≥ threshold → no staleness warning before the Regenerate option.
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(60), {
      lastCoachReport: 'Cached report',
      lastCoachTimestamp: '2026-04-01T10:00:00.000Z',
      lastCoachQuestionCount: 20,
    }) })
    mockSelect.mockResolvedValueOnce('back')


    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).not.toContain('may not differ significantly')
  })

  it('does NOT show staleness notice after the first-ever generation (no prior report)', async () => {
    // First-ever run: domain has history but no cached report. The post-generation prompt
    // should NOT show a staleness notice, since there's no "last report" to compare against.
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(30)) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).not.toContain('may not differ significantly')
    expect(mockGenerateCoachReport).toHaveBeenCalledTimes(1)
  })

  it('shows the staleness notice on every iteration of the regenerate loop', async () => {
    // After each regeneration lastCoachQuestionCount = history.length, so newQuestions = 0
    // on every subsequent prompt — the notice should appear twice across two consecutive regenerates.
    let callCount = 0
    mockReadDomain.mockImplementation(async () => {
      callCount++
      // First call: no cache (first-ever generation, no notice)
      // Subsequent calls: simulate persisted cache matching the just-generated state
      if (callCount === 1) {
        return { ok: true, data: makeDomain(makeHistory(30)) }
      }
      return { ok: true, data: makeDomain(makeHistory(30), { lastCoachQuestionCount: 30 }) }
    })
    mockSelect
      .mockResolvedValueOnce('regenerate') // after first generation
      .mockResolvedValueOnce('regenerate') // after second generation
      .mockResolvedValueOnce('back')       // after third generation


    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    const matches = logged.match(/may not differ significantly/g) ?? []
    expect(matches.length).toBe(2) // shown before the 2nd and 3rd Regenerate/Back prompts
    expect(mockGenerateCoachReport).toHaveBeenCalledTimes(3)
  })
})

// ---------------------------------------------------------------------------
// showMyCoachScreen — navigation / errors
// ---------------------------------------------------------------------------
describe('showMyCoachScreen — navigation', () => {
  it('returns when the user selects Back', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    // One generation, one select, no further loops
    expect(mockGenerateCoachReport).toHaveBeenCalledTimes(1)
  })

  it('returns gracefully on ExitPromptError (Ctrl+C)', async () => {
    mockSelect.mockRejectedValueOnce(new ExitPromptError('canceled'))

    await expect(showMyCoachScreen('typescript')).resolves.toBeUndefined()
  })

  it('shows the AI error message and returns to menu on provider failure', async () => {
    mockGenerateCoachReport.mockResolvedValueOnce({ ok: false, error: 'AI provider not ready. Go to Settings to configure.' })

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('AI provider not ready')
    expect(mockWriteDomain).not.toHaveBeenCalled()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('shows error and exits when readDomain fails in the regenerate loop', async () => {
    mockReadDomain
      .mockResolvedValueOnce({ ok: true, data: makeDomain(makeHistory(5)) }) // initial entry
      .mockResolvedValueOnce({ ok: false, error: 'Domain corrupted in loop' }) // regenerate loop
    mockSelect.mockResolvedValueOnce('regenerate')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('Domain corrupted in loop')
  })

  it('shows error and exits when AI generation fails in the regenerate loop', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomain(makeHistory(5)) })
    mockGenerateCoachReport
      .mockResolvedValueOnce({ ok: true, data: 'First report' }) // initial generation
      .mockResolvedValueOnce({ ok: false, error: 'AI quota exceeded in loop' }) // regenerate loop
    mockSelect.mockResolvedValueOnce('regenerate')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('AI quota exceeded in loop')
  })
})

// ---------------------------------------------------------------------------
// showMyCoachScreen — cached report (preview on entry)
// ---------------------------------------------------------------------------
describe('showMyCoachScreen — cached report', () => {
  const CACHED_REPORT = 'Previously generated coaching report.'
  const CACHED_TIMESTAMP = '2026-04-01T10:00:00.000Z'

  function makeDomainWithCache(historyLength: number, lastCoachQuestionCount: number = historyLength): DomainFile {
    return makeDomain(makeHistory(historyLength), {
      lastCoachReport: CACHED_REPORT,
      lastCoachTimestamp: CACHED_TIMESTAMP,
      lastCoachQuestionCount,
    })
  }

  it('displays the cached report without calling generateCoachReport', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(30) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    expect(mockGenerateCoachReport).not.toHaveBeenCalled()
    expect(mockWriteDomain).not.toHaveBeenCalled()
  })

  it('ignores cached reports generated from zero-history metadata and regenerates from real history', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(10, 0) })
    mockGenerateCoachReport.mockResolvedValueOnce({ ok: true, data: 'Fresh report from actual history.' })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(mockGenerateCoachReport).toHaveBeenCalledTimes(1)
    expect(logged).toContain('Fresh report from actual history.')
    expect(logged).not.toContain(CACHED_REPORT)
  })

  it('renders the cached report text on initial view', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(30) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain(CACHED_REPORT)
  })

  it('renders the cached timestamp when showing a cached report', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(30) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toMatch(/\[dim\]Generated: /)
  })

  it('shows the tip for <25 questions even when displaying a cached report', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(10) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('Tip: Reports become more accurate with at least 25 answered questions.')
  })

  it('does NOT show staleness notice on initial cached report view', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(30, 5) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).not.toContain('may not differ significantly')
  })

  it('calls generateCoachReport on Regenerate after showing the cached report', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(30) })
    mockSelect
      .mockResolvedValueOnce('regenerate')
      .mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    expect(mockGenerateCoachReport).toHaveBeenCalledTimes(1)
    expect(mockWriteDomain).toHaveBeenCalledTimes(1)
  })

  it('shows staleness notice before Regenerate prompt on initial cached view when <25 new questions', async () => {
    // Staleness warning now appears BEFORE the user selects Regenerate, acting as a deterrent.
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(30, 28) }) // 2 new questions
    mockSelect.mockResolvedValueOnce('back') // user sees warning and decides not to regenerate

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('Only 2 new questions answered since your last report')
    expect(logged).toContain('may not differ significantly')
    expect(mockGenerateCoachReport).not.toHaveBeenCalled() // warning shown before any generation
  })

  it('shows staleness notice on Regenerate when <25 new questions since cached report', async () => {
    mockReadDomain.mockImplementation(async () => ({
      ok: true,
      data: makeDomainWithCache(30, 28),
    }))
    mockSelect
      .mockResolvedValueOnce('regenerate')
      .mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('Only 2 new questions answered since your last report')
  })

  it('does NOT show staleness notice before Regenerate when ≥25 new questions since cached report', async () => {
    // 40 new questions ≥ threshold → no staleness warning before the Regenerate option.
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(60, 20) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).not.toContain('may not differ significantly')
  })

  it('returns without generating when Back is selected from the cached report view', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(30) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    expect(mockGenerateCoachReport).not.toHaveBeenCalled()
    expect(mockSelect).toHaveBeenCalledTimes(1)
  })

  it('shows fresh-data hint on cached entry when 25+ new questions since last report', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(60, 20) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).toContain('40 new questions since this report')
    expect(logged).toContain('consider regenerating')
  })

  it('does NOT show fresh-data hint on cached entry when <25 new questions', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithCache(30, 28) })
    mockSelect.mockResolvedValueOnce('back')

    await showMyCoachScreen('typescript')

    const logged = consoleSpy.mock.calls.map(c => String(c[0])).join('\n')
    expect(logged).not.toContain('consider regenerating')
  })
})
