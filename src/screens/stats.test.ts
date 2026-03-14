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
  showDomainMenu: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { readDomain } from '../domain/store.js'
import * as router from '../router.js'
import { select } from '@inquirer/prompts'
import {
  showStats,
  formatTotalTimePlayed,
  difficultyLabel,
  computeScoreTrend,
  daysSinceFirstSession,
  computeReturnStreak,
} from './stats.js'

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
    scoreDelta: 30,
    difficultyLevel: 2,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  mockShowDomainMenu.mockResolvedValue(undefined)
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  mockSelect.mockResolvedValue('back')
})

// ---------------------------------------------------------------------------
// formatTotalTimePlayed
// ---------------------------------------------------------------------------
describe('formatTotalTimePlayed', () => {
  it('formats zero ms as "0s"', () => {
    expect(formatTotalTimePlayed(0)).toBe('0s')
  })

  it('formats less than a minute as seconds only', () => {
    expect(formatTotalTimePlayed(45_000)).toBe('45s')
  })

  it('formats exactly one minute', () => {
    expect(formatTotalTimePlayed(60_000)).toBe('1m 0s')
  })

  it('formats hours, minutes and seconds', () => {
    expect(formatTotalTimePlayed(3_723_000)).toBe('1h 2m 3s')
  })

  it('formats minutes without hours', () => {
    expect(formatTotalTimePlayed(125_000)).toBe('2m 5s')
  })

  it('formats hours with zero minutes', () => {
    expect(formatTotalTimePlayed(3_603_000)).toBe('1h 0m 3s')
  })
})

// ---------------------------------------------------------------------------
// difficultyLabel
// ---------------------------------------------------------------------------
describe('difficultyLabel', () => {
  it('returns correct label for each level', () => {
    expect(difficultyLabel(1)).toBe('1 — Beginner')
    expect(difficultyLabel(2)).toBe('2 — Easy')
    expect(difficultyLabel(3)).toBe('3 — Intermediate')
    expect(difficultyLabel(4)).toBe('4 — Advanced')
    expect(difficultyLabel(5)).toBe('5 — Expert')
  })
})

// ---------------------------------------------------------------------------
// computeScoreTrend
// ---------------------------------------------------------------------------
describe('computeScoreTrend', () => {
  const now = new Date('2026-03-12T12:00:00.000Z').getTime()

  it('returns "flat" for empty history', () => {
    expect(computeScoreTrend([], now)).toBe('flat')
  })

  it('returns "flat" when no entries within last 30 days', () => {
    const old = makeRecord({
      answeredAt: new Date('2025-12-01T10:00:00.000Z').toISOString(),
      scoreDelta: 100,
    })
    expect(computeScoreTrend([old], now)).toBe('flat')
  })

  it('returns "growing" when sum of recent scoreDelta is positive', () => {
    const records = [
      makeRecord({ answeredAt: '2026-03-10T10:00:00.000Z', scoreDelta: 50 }),
      makeRecord({ answeredAt: '2026-03-11T10:00:00.000Z', scoreDelta: 30 }),
    ]
    expect(computeScoreTrend(records, now)).toBe('growing')
  })

  it('returns "declining" when sum of recent scoreDelta is negative', () => {
    const records = [
      makeRecord({ answeredAt: '2026-03-10T10:00:00.000Z', scoreDelta: -50 }),
      makeRecord({ answeredAt: '2026-03-11T10:00:00.000Z', scoreDelta: -20 }),
    ]
    expect(computeScoreTrend(records, now)).toBe('declining')
  })

  it('returns "flat" when sum of recent scoreDelta is zero', () => {
    const records = [
      makeRecord({ answeredAt: '2026-03-10T10:00:00.000Z', scoreDelta: 30 }),
      makeRecord({ answeredAt: '2026-03-11T10:00:00.000Z', scoreDelta: -30 }),
    ]
    expect(computeScoreTrend(records, now)).toBe('flat')
  })

  it('only considers entries within the last 30 days', () => {
    const records = [
      makeRecord({ answeredAt: '2025-12-01T10:00:00.000Z', scoreDelta: 9999 }),
      makeRecord({ answeredAt: '2026-03-10T10:00:00.000Z', scoreDelta: -10 }),
    ]
    expect(computeScoreTrend(records, now)).toBe('declining')
  })
})

// ---------------------------------------------------------------------------
// daysSinceFirstSession
// ---------------------------------------------------------------------------
describe('daysSinceFirstSession', () => {
  const now = new Date('2026-03-12T12:00:00.000Z').getTime()

  it('returns null for empty history', () => {
    expect(daysSinceFirstSession([], now)).toBeNull()
  })

  it('returns 0 when first session is today', () => {
    const records = [makeRecord({ answeredAt: '2026-03-12T08:00:00.000Z' })]
    expect(daysSinceFirstSession(records, now)).toBe(0)
  })

  it('returns correct day count for past first session', () => {
    const records = [
      makeRecord({ answeredAt: '2026-03-09T10:00:00.000Z' }),
      makeRecord({ answeredAt: '2026-03-11T10:00:00.000Z' }),
    ]
    expect(daysSinceFirstSession(records, now)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// computeReturnStreak
// ---------------------------------------------------------------------------
describe('computeReturnStreak', () => {
  const nowMs = new Date('2026-03-12T12:00:00.000Z').getTime()

  it('returns 0 for empty history', () => {
    expect(computeReturnStreak([])).toBe(0)
  })

  it.each([
    ['returns 1 for a single day', ['2026-03-12T10:00:00.000Z'], 1],
    [
      'returns correct streak for consecutive days',
      ['2026-03-10T10:00:00.000Z', '2026-03-11T10:00:00.000Z', '2026-03-12T10:00:00.000Z'],
      3,
    ],
    [
      'breaks streak on gap',
      ['2026-03-08T10:00:00.000Z', '2026-03-10T10:00:00.000Z', '2026-03-11T10:00:00.000Z', '2026-03-12T10:00:00.000Z'],
      3,
    ],
    [
      'counts multiple records on the same day as one day',
      ['2026-03-11T08:00:00.000Z', '2026-03-11T20:00:00.000Z', '2026-03-12T10:00:00.000Z'],
      2,
    ],
  ] as const)('%s', (_, dates, expected) => {
    const records = (dates as readonly string[]).map((answeredAt) => makeRecord({ answeredAt }))
    expect(computeReturnStreak(records, nowMs)).toBe(expected)
  })

  it('returns 0 when most recent play was more than 1 day ago', () => {
    const records = [
      makeRecord({ answeredAt: '2026-03-09T10:00:00.000Z' }),
      makeRecord({ answeredAt: '2026-03-10T10:00:00.000Z' }),
    ]
    const staleNow = new Date('2026-03-13T12:00:00.000Z').getTime()
    expect(computeReturnStreak(records, staleNow)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// showStats — empty history
// ---------------------------------------------------------------------------
describe('showStats — empty history', () => {
  it('displays "No data yet" placeholders and calls showHome after Back', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showStats('some-topic')

    const logged = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n')
    expect(logged).toContain('No data yet')
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })

  it('shows score 0 for empty domain', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showStats('some-topic')

    const scoreCall = consoleSpy.mock.calls.find((c) => (c[0] as string).includes('Score:'))
    expect(scoreCall).toBeDefined()
    expect(scoreCall![0]).toContain(' 0')
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showStats — with history
// ---------------------------------------------------------------------------
function makeDomainWithHistory(records: QuestionRecord[]) {
  return {
    ...defaultDomainFile(),
    meta: {
      ...defaultDomainFile().meta,
      score: 200,
      difficultyLevel: 3,
      totalTimePlayedMs: 3_723_000,
    },
    history: records,
  }
}

async function runStatsAndCapture(records: QuestionRecord[], nowMs?: number): Promise<string> {
  mockReadDomain.mockResolvedValue({ ok: true, data: makeDomainWithHistory(records) })
  mockSelect.mockResolvedValue('back')
  const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
  await showStats('some-topic', nowMs)
  const logged = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n')
  consoleSpy.mockRestore()
  return logged
}

describe('showStats — with history', () => {
  it('displays correct, incorrect counts and accuracy', async () => {
    const logged = await runStatsAndCapture([
      makeRecord({ isCorrect: true }),
      makeRecord({ isCorrect: true }),
      makeRecord({ isCorrect: false }),
    ])
    expect(logged).toContain('2 / 1')
    expect(logged).toContain('66.7%')
  })

  it('displays formatted total time played', async () => {
    const logged = await runStatsAndCapture([makeRecord()])
    expect(logged).toContain('1h 2m 3s')
  })

  it('displays difficulty label', async () => {
    const logged = await runStatsAndCapture([makeRecord()])
    expect(logged).toContain('3 — Intermediate')
  })

  it('displays score trend label', async () => {
    const logged = await runStatsAndCapture([makeRecord({ answeredAt: '2026-03-10T10:00:00.000Z', scoreDelta: 50 })])
    expect(logged).toContain('Growing 📈')
  })

  it('displays days since first session field', async () => {
    const logged = await runStatsAndCapture([makeRecord({ answeredAt: '2026-03-09T00:00:00.000Z' })])
    expect(logged).toContain('Days since first session:')
  })

  it('displays return streak with day/days suffix', async () => {
    const fixedNow = new Date('2026-03-13T12:00:00.000Z').getTime()
    const logged = await runStatsAndCapture([makeRecord({ answeredAt: '2026-03-12T10:00:00.000Z' })], fixedNow)
    expect(logged).toContain('1 day')
  })
})

// ---------------------------------------------------------------------------
// showStats — navigation
// ---------------------------------------------------------------------------
describe('showStats — navigation', () => {
  it('calls router.showHome when Back is selected', async () => {
    mockSelect.mockResolvedValue('back')
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showStats('some-topic')

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('calls router.showHome on ExitPromptError', async () => {
    mockSelect.mockRejectedValue(new ExitPromptError())
    vi.spyOn(console, 'log').mockReturnValue(undefined)

    await showStats('some-topic')

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// showStats — corrupted domain
// ---------------------------------------------------------------------------
describe('showStats — corrupted domain', () => {
  it('warns and shows empty stats on corrupted domain read', async () => {
    mockReadDomain.mockResolvedValue({ ok: false, error: 'Domain data appears corrupted.' })
    mockSelect.mockResolvedValue('back')
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)

    await showStats('bad-topic')

    expect(warnSpy).toHaveBeenCalledOnce()
    const logged = consoleSpy.mock.calls.map((c) => c[0] as string).join('\n')
    expect(logged).toContain('No data yet')
    consoleSpy.mockRestore()
    warnSpy.mockRestore()
  })
})
