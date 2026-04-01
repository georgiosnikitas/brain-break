/**
 * Regression tests covering two key invariants.
 *
 * (1) Scoring chain — simulates a 6-answer session through the real
 *     applyAnswer function and asserts the exact accumulated state.
 *     Complements the per-step unit tests by catching bugs that only
 *     surface across multiple, interacting state transitions.
 *
 * (2) Stats screen output snapshot — captures every console.log line
 *     produced by showStats with fixed mock data and fake timers, then
 *     saves them as a Vitest snapshot.  Any unintended change to field
 *     labels, ordering, or formatting causes the snapshot diff to fail.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defaultDomainFile, type DomainFile, type QuestionRecord, type DifficultyLevel } from './domain/schema.js'
import { applyAnswer } from './domain/scoring.js'
import { computeScoreTrend, daysSinceFirstSession, computeReturnStreak, showStats } from './screens/stats.js'

// ---------------------------------------------------------------------------
// Module mocks (hoisted — must appear before the imports they affect)
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', () => ({ select: vi.fn(), Separator: vi.fn() }))
vi.mock('./domain/store.js', () => ({ readDomain: vi.fn() }))
vi.mock('./router.js', () => ({ showDomainMenu: vi.fn(), showHome: vi.fn() }))
vi.mock('./utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))

import { select } from '@inquirer/prompts'
import { readDomain } from './domain/store.js'

const mockSelect = vi.mocked(select)
const mockReadDomain = vi.mocked(readDomain)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fixed timestamp so all date-dependent fields are deterministic forever. */
const FIXED_NOW = new Date('2026-03-15T12:00:00.000Z').getTime()

/** Remove ANSI escape codes so snapshots are readable plain text. */
const stripAnsi = (s: string) => s.replaceAll(/\u001b\[[0-9;]*[mGKHF]/g, '')

/** Factory for QuestionRecord with sensible defaults — override only what matters. */
function makeRecord(overrides: Partial<QuestionRecord> = {}): QuestionRecord {
  return {
    question: 'Test question?',
    options: { A: 'Opt A', B: 'Opt B', C: 'Opt C', D: 'Opt D' },
    correctAnswer: 'A',
    userAnswer: 'A',
    isCorrect: true,
    answeredAt: '2026-03-15T10:00:00.000Z',
    timeTakenMs: 5_000,
    speedTier: 'fast',
    scoreDelta: 40,
    difficultyLevel: 2,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Fixed domain data for the stats output snapshot
// ---------------------------------------------------------------------------
const SNAPSHOT_DOMAIN: DomainFile = {
  meta: {
    score: 10,
    difficultyLevel: 2,
    startingDifficulty: 2,
    streakCount: 1,
    streakType: 'incorrect',
    totalTimePlayedMs: 30_000,
    createdAt: '2026-03-14T09:00:00.000Z',
    lastSessionAt: '2026-03-15T09:00:00.000Z',
    archived: false,
  },
  hashes: [],
  history: [
    {
      question: 'What is TypeScript?',
      options: { A: 'Typed JS superset', B: 'A framework', C: 'A runtime', D: 'A test tool' },
      correctAnswer: 'A',
      userAnswer: 'A',
      isCorrect: true,
      answeredAt: '2026-03-14T10:00:00.000Z',
      timeTakenMs: 5_000,
      speedTier: 'fast',
      scoreDelta: 40,
      difficultyLevel: 2,
    },
    {
      question: 'What is Zod?',
      options: { A: 'A DB ORM', B: 'A validation lib', C: 'A test runner', D: 'A type checker' },
      correctAnswer: 'B',
      userAnswer: 'C',
      isCorrect: false,
      answeredAt: '2026-03-15T09:00:00.000Z',
      timeTakenMs: 25_000,
      speedTier: 'normal',
      scoreDelta: -30,
      difficultyLevel: 2,
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockResolvedValue('back')
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
})

// ===========================================================================
// 1. Scoring chain — golden state after a multi-question session
// ===========================================================================
describe('scoring chain — 6-question session golden state', () => {
  const thresholds = { fastMs: 10_000, slowMs: 30_000 }

  it('produces the exact accumulated state after a mixed sequence of answers', () => {
    // Start from a fresh domain at difficulty 2
    let meta = defaultDomainFile().meta

    const answers = [
      { isCorrect: true,  ms: 5_000  },  // correct  fast   @ L2 → +40
      { isCorrect: true,  ms: 5_000  },  // correct  fast   @ L2 → +40
      { isCorrect: true,  ms: 5_000  },  // correct  fast   @ L2 → +40  (streak→3 → L2 becomes L3)
      { isCorrect: false, ms: 35_000 },  // incorrect slow  @ L3 → −60
      { isCorrect: false, ms: 35_000 },  // incorrect slow  @ L3 → −60
      { isCorrect: true,  ms: 15_000 },  // correct  normal @ L3 → +30
    ]

    for (const { isCorrect, ms } of answers) {
      const { updatedMeta } = applyAnswer(meta, isCorrect, ms, thresholds)
      meta = updatedMeta
    }

    expect(meta.score).toBe(30)             // 40+40+40−60−60+30
    expect(meta.difficultyLevel).toBe(3)    // promoted after 3-correct streak
    expect(meta.streakCount).toBe(1)        // streak reset on promotion, now 1 correct
    expect(meta.streakType).toBe('correct')
    expect(meta.totalTimePlayedMs).toBe(100_000) // 5000×3 + 35000×2 + 15000
  })
})

// ===========================================================================
// 2. Scoring boundary conditions — edge-case regression
// ===========================================================================
describe('scoring boundaries — difficulty and streak edge cases', () => {
  const thresholds = { fastMs: 10_000, slowMs: 30_000 }

  it('caps difficulty at 5 when streak of 3 correct at level 5', () => {
    let meta = { ...defaultDomainFile().meta, difficultyLevel: 5 as DifficultyLevel }
    for (let i = 0; i < 3; i++) {
      const { updatedMeta } = applyAnswer(meta, true, 5_000, thresholds)
      meta = updatedMeta
    }
    expect(meta.difficultyLevel).toBe(5)
    expect(meta.streakCount).toBe(0)
    expect(meta.streakType).toBe('none')
  })

  it('floors difficulty at 1 when streak of 3 incorrect at level 1', () => {
    let meta = { ...defaultDomainFile().meta, difficultyLevel: 1 as DifficultyLevel }
    for (let i = 0; i < 3; i++) {
      const { updatedMeta } = applyAnswer(meta, false, 15_000, thresholds)
      meta = updatedMeta
    }
    expect(meta.difficultyLevel).toBe(1)
    expect(meta.streakCount).toBe(0)
    expect(meta.streakType).toBe('none')
  })

  it('allows score to go negative', () => {
    let meta = { ...defaultDomainFile().meta, score: 0, difficultyLevel: 5 as DifficultyLevel }
    const { updatedMeta } = applyAnswer(meta, false, 35_000, thresholds)
    expect(updatedMeta.score).toBe(-100) // 50 * -2
  })

  it('resets streak to none after promotion then starts fresh', () => {
    let meta = { ...defaultDomainFile().meta, difficultyLevel: 3 as DifficultyLevel }

    // 3 correct → promote to L4, streak resets
    for (let i = 0; i < 3; i++) {
      const { updatedMeta } = applyAnswer(meta, true, 5_000, thresholds)
      meta = updatedMeta
    }
    expect(meta.difficultyLevel).toBe(4)
    expect(meta.streakCount).toBe(0)
    expect(meta.streakType).toBe('none')

    // Next incorrect starts a fresh incorrect streak at 1
    const { updatedMeta } = applyAnswer(meta, false, 15_000, thresholds)
    expect(updatedMeta.streakCount).toBe(1)
    expect(updatedMeta.streakType).toBe('incorrect')
  })
})

// ===========================================================================
// 2b. Timeout scoring — forced slow tier regression
// ===========================================================================
describe('timeout scoring — forced slow tier penalty', () => {
  const thresholds = { fastMs: 2_000, slowMs: 8_000 }

  it('timeout at fast elapsed time still gets slow+incorrect penalty when forced to slowMs', () => {
    const meta = { ...defaultDomainFile().meta, difficultyLevel: 2 as DifficultyLevel }

    // Simulate the forced-slow-tier pattern used in autoSubmitTimeoutQuestion:
    // actual elapsed = 3_000ms (would be "normal"), but we force Math.max(3_000, 8_000)
    const forcedTime = Math.max(3_000, thresholds.slowMs)
    const { updatedMeta, scoreDelta, speedTier } = applyAnswer(meta, false, forcedTime, thresholds)

    expect(speedTier).toBe('slow')
    expect(scoreDelta).toBe(-40) // basePts(20) * slow+incorrect multiplier(-2)
    expect(updatedMeta.score).toBe(-40)
  })

  it('timeout at already-slow elapsed time uses actual time unchanged', () => {
    const meta = { ...defaultDomainFile().meta, difficultyLevel: 3 as DifficultyLevel }

    // Actual elapsed = 15_000ms (already >= slowMs), Math.max(15_000, 8_000) = 15_000
    const forcedTime = Math.max(15_000, thresholds.slowMs)
    const { speedTier, scoreDelta } = applyAnswer(meta, false, forcedTime, thresholds)

    expect(speedTier).toBe('slow')
    expect(scoreDelta).toBe(-60) // basePts(30) * slow+incorrect(-2)
  })

  it('mixed session with timeout produces correct accumulated state', () => {
    let meta = { ...defaultDomainFile().meta, difficultyLevel: 2 as DifficultyLevel }

    // Q1: correct fast → +40
    meta = applyAnswer(meta, true, 1_500, thresholds).updatedMeta
    // Q2: correct fast → +40
    meta = applyAnswer(meta, true, 1_500, thresholds).updatedMeta
    // Q3: timeout (forced slow) → -40 (breaks correct streak at 2, starts incorrect)
    meta = applyAnswer(meta, false, Math.max(3_000, thresholds.slowMs), thresholds).updatedMeta

    expect(meta.score).toBe(40) // 40+40-40
    expect(meta.streakCount).toBe(1)
    expect(meta.streakType).toBe('incorrect')
    expect(meta.difficultyLevel).toBe(2) // no promotion (streak broken before 3)
  })
})

// ===========================================================================
// 3. Stats computation edge-case regression
// ===========================================================================
describe('stats computations — edge-case regression', () => {
  it('computeScoreTrend returns flat for empty history', () => {
    expect(computeScoreTrend([], FIXED_NOW)).toBe('flat')
  })

  it('computeScoreTrend returns declining when recent scores are net negative', () => {
    const history: QuestionRecord[] = [
      makeRecord({ scoreDelta: -30, answeredAt: '2026-03-14T10:00:00.000Z' }),
      makeRecord({ scoreDelta: -20, answeredAt: '2026-03-15T10:00:00.000Z' }),
      makeRecord({ scoreDelta: 10, answeredAt: '2026-03-15T11:00:00.000Z' }),
    ]
    expect(computeScoreTrend(history, FIXED_NOW)).toBe('declining')
  })

  it('computeScoreTrend ignores questions older than 30 days', () => {
    const history: QuestionRecord[] = [
      makeRecord({ scoreDelta: -200, answeredAt: '2026-02-01T10:00:00.000Z' }),
      makeRecord({ scoreDelta: 10, answeredAt: '2026-03-14T10:00:00.000Z' }),
    ]
    expect(computeScoreTrend(history, FIXED_NOW)).toBe('growing')
  })

  it('daysSinceFirstSession returns null for empty history', () => {
    expect(daysSinceFirstSession([], FIXED_NOW)).toBeNull()
  })

  it('daysSinceFirstSession returns 0 for same-day first question', () => {
    const history: QuestionRecord[] = [
      makeRecord({ answeredAt: '2026-03-15T10:00:00.000Z' }),
    ]
    expect(daysSinceFirstSession(history, FIXED_NOW)).toBe(0)
  })

  it('computeReturnStreak returns 0 for empty history', () => {
    expect(computeReturnStreak([], FIXED_NOW)).toBe(0)
  })

  it('computeReturnStreak returns 0 when last play was more than 1 day ago', () => {
    const history: QuestionRecord[] = [
      makeRecord({ answeredAt: '2026-03-12T10:00:00.000Z' }),
    ]
    expect(computeReturnStreak(history, FIXED_NOW)).toBe(0)
  })

  it('computeReturnStreak counts consecutive days correctly', () => {
    const history: QuestionRecord[] = [
      makeRecord({ answeredAt: '2026-03-13T10:00:00.000Z' }),
      makeRecord({ answeredAt: '2026-03-14T10:00:00.000Z' }),
      makeRecord({ answeredAt: '2026-03-15T08:00:00.000Z' }),
    ]
    expect(computeReturnStreak(history, FIXED_NOW)).toBe(3)
  })

  it('computeReturnStreak breaks on a gap day', () => {
    const history: QuestionRecord[] = [
      makeRecord({ answeredAt: '2026-03-11T10:00:00.000Z' }),
      // gap on 2026-03-12
      makeRecord({ answeredAt: '2026-03-13T10:00:00.000Z' }),
      makeRecord({ answeredAt: '2026-03-14T10:00:00.000Z' }),
      makeRecord({ answeredAt: '2026-03-15T08:00:00.000Z' }),
    ]
    expect(computeReturnStreak(history, FIXED_NOW)).toBe(3)
  })
})

// ===========================================================================
// 4. Stats screen — full console output snapshot
// ===========================================================================
describe('stats screen — full output snapshot', () => {
  beforeEach(() => {
    // Freeze time so computeScoreTrend / daysSinceFirstSession are deterministic
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the populated stats dashboard deterministically', async () => {
    mockReadDomain.mockResolvedValue({ ok: true, data: SNAPSHOT_DOMAIN })

    const logged: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logged.push(args.map(String).join(' '))
    })
    try {
      await showStats('test-domain', FIXED_NOW)
    } finally {
      spy.mockRestore()
    }

    expect(logged.map(stripAnsi)).toMatchSnapshot()
  })

  it('renders the empty-history placeholder lines deterministically', async () => {
    // defaultDomainFile() has history:[] and score:0
    const logged: string[] = []
    const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logged.push(args.map(String).join(' '))
    })
    try {
      await showStats('test-domain', FIXED_NOW)
    } finally {
      spy.mockRestore()
    }

    expect(logged.map(stripAnsi)).toMatchSnapshot()
  })
})
