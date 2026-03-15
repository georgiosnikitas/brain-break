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
import { defaultDomainFile, type DomainFile } from './domain/schema.js'
import { applyAnswer } from './domain/scoring.js'

// ---------------------------------------------------------------------------
// Module mocks (hoisted — must appear before the imports they affect)
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', () => ({ select: vi.fn() }))
vi.mock('./domain/store.js', () => ({ readDomain: vi.fn() }))
vi.mock('./router.js', () => ({ showDomainMenu: vi.fn(), showHome: vi.fn() }))
vi.mock('./utils/screen.js', () => ({ clearScreen: vi.fn() }))

import { select } from '@inquirer/prompts'
import { readDomain } from './domain/store.js'
import { showStats } from './screens/stats.js'

const mockSelect = vi.mocked(select)
const mockReadDomain = vi.mocked(readDomain)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fixed timestamp so all date-dependent fields are deterministic forever. */
const FIXED_NOW = new Date('2026-03-15T12:00:00.000Z').getTime()

/** Remove ANSI escape codes so snapshots are readable plain text. */
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*[mGKHF]/g, '')

// ---------------------------------------------------------------------------
// Fixed domain data for the stats output snapshot
// ---------------------------------------------------------------------------
const SNAPSHOT_DOMAIN: DomainFile = {
  meta: {
    score: 10,
    difficultyLevel: 2,
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
// 2. Stats screen — full console output snapshot
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
