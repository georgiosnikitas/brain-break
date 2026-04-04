import { describe, expect, it } from 'vitest'
import { applyAnswer, getSpeedTier } from './scoring.js'
import { makeMeta as _makeMeta } from '../__test-helpers__/factories.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeMeta = (overrides: Partial<import('./schema.js').DomainMeta> = {}) =>
  _makeMeta({ difficultyLevel: 3, ...overrides })

const thresholds = { fastMs: 10_000, slowMs: 30_000 }

// ---------------------------------------------------------------------------
// getSpeedTier
// ---------------------------------------------------------------------------
describe('getSpeedTier', () => {
  it('returns fast when timeTakenMs < fastMs', () => {
    expect(getSpeedTier(5_000, thresholds)).toBe('fast')
  })

  it('returns slow when timeTakenMs >= slowMs', () => {
    expect(getSpeedTier(30_000, thresholds)).toBe('slow')
    expect(getSpeedTier(45_000, thresholds)).toBe('slow')
  })

  it('returns normal when timeTakenMs is between fastMs and slowMs', () => {
    expect(getSpeedTier(15_000, thresholds)).toBe('normal')
    expect(getSpeedTier(9_999 + 1, thresholds)).toBe('normal')
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — all 6 speed × outcome combinations (AC2, AC3)
// ---------------------------------------------------------------------------
describe('applyAnswer — score delta by speed×outcome', () => {
  it('correct + fast at L3 → scoreDelta = 60', () => {
    const { scoreDelta, updatedMeta } = applyAnswer(makeMeta(), true, 5_000, thresholds)
    expect(scoreDelta).toBe(60) // 30 × 2
    expect(updatedMeta.score).toBe(60)
  })

  it('correct + normal at L3 → scoreDelta = 30', () => {
    const { scoreDelta } = applyAnswer(makeMeta(), true, 15_000, thresholds)
    expect(scoreDelta).toBe(30) // 30 × 1
  })

  it('correct + slow at L3 → scoreDelta = 15', () => {
    const { scoreDelta } = applyAnswer(makeMeta(), true, 35_000, thresholds)
    expect(scoreDelta).toBe(15) // 30 × 0.5
  })

  it('incorrect + fast at L3 → scoreDelta = -30', () => {
    const { scoreDelta } = applyAnswer(makeMeta(), false, 5_000, thresholds)
    expect(scoreDelta).toBe(-30) // 30 × -1
  })

  it('incorrect + normal at L3 → scoreDelta = -45', () => {
    const { scoreDelta } = applyAnswer(makeMeta(), false, 15_000, thresholds)
    expect(scoreDelta).toBe(-45) // 30 × -1.5
  })

  it('incorrect + slow at L3 → scoreDelta = -60', () => {
    const { scoreDelta, updatedMeta } = applyAnswer(makeMeta(), false, 35_000, thresholds)
    expect(scoreDelta).toBe(-60) // 30 × -2 (AC3)
    expect(updatedMeta.score).toBe(-60)
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — score delta at other difficulty levels
// ---------------------------------------------------------------------------
describe('applyAnswer — base points by difficulty', () => {
  it.each([
    [1, 10],
    [2, 20],
    [3, 30],
    [4, 40],
    [5, 50],
  ])('correct + fast at L%i → scoreDelta = %i', (level, expected) => {
    const meta = makeMeta({ difficultyLevel: level })
    const { scoreDelta } = applyAnswer(meta, true, 5_000, thresholds)
    expect(scoreDelta).toBe(expected * 2)
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — speedTier returned
// ---------------------------------------------------------------------------
describe('applyAnswer — speedTier in result', () => {
  it('returns fast tier', () => {
    const { speedTier } = applyAnswer(makeMeta(), true, 5_000, thresholds)
    expect(speedTier).toBe('fast')
  })

  it('returns normal tier', () => {
    const { speedTier } = applyAnswer(makeMeta(), true, 15_000, thresholds)
    expect(speedTier).toBe('normal')
  })

  it('returns slow tier', () => {
    const { speedTier } = applyAnswer(makeMeta(), true, 35_000, thresholds)
    expect(speedTier).toBe('slow')
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — streak transitions (AC6)
// ---------------------------------------------------------------------------
describe('applyAnswer — streak transitions', () => {
  it('starts a correct streak from none', () => {
    const { updatedMeta } = applyAnswer(makeMeta(), true, 5_000, thresholds)
    expect(updatedMeta.streakCount).toBe(1)
    expect(updatedMeta.streakType).toBe('correct')
  })

  it('increments an existing correct streak', () => {
    const meta = makeMeta({ streakCount: 1, streakType: 'correct' })
    const { updatedMeta } = applyAnswer(meta, true, 5_000, thresholds)
    expect(updatedMeta.streakCount).toBe(2)
    expect(updatedMeta.streakType).toBe('correct')
  })

  it('resets correct streak to 1 on incorrect answer', () => {
    const meta = makeMeta({ streakCount: 2, streakType: 'correct' })
    const { updatedMeta } = applyAnswer(meta, false, 5_000, thresholds)
    expect(updatedMeta.streakCount).toBe(1)
    expect(updatedMeta.streakType).toBe('incorrect')
  })

  it('starts an incorrect streak from none', () => {
    const { updatedMeta } = applyAnswer(makeMeta(), false, 5_000, thresholds)
    expect(updatedMeta.streakCount).toBe(1)
    expect(updatedMeta.streakType).toBe('incorrect')
  })

  it('increments an existing incorrect streak', () => {
    const meta = makeMeta({ streakCount: 1, streakType: 'incorrect' })
    const { updatedMeta } = applyAnswer(meta, false, 5_000, thresholds)
    expect(updatedMeta.streakCount).toBe(2)
    expect(updatedMeta.streakType).toBe('incorrect')
  })

  it('resets incorrect streak to 1 on correct answer', () => {
    const meta = makeMeta({ streakCount: 2, streakType: 'incorrect' })
    const { updatedMeta } = applyAnswer(meta, true, 5_000, thresholds)
    expect(updatedMeta.streakCount).toBe(1)
    expect(updatedMeta.streakType).toBe('correct')
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — difficulty progression (AC4, AC5)
// ---------------------------------------------------------------------------
describe('applyAnswer — difficulty progression', () => {
  it('increases difficulty after 3rd consecutive correct (AC4)', () => {
    const meta = makeMeta({ difficultyLevel: 3, streakCount: 2, streakType: 'correct' })
    const { updatedMeta } = applyAnswer(meta, true, 5_000, thresholds)
    expect(updatedMeta.difficultyLevel).toBe(4)
    expect(updatedMeta.streakCount).toBe(0)
  })

  it('decreases difficulty after 3rd consecutive incorrect at L2 → L1 (AC5)', () => {
    const meta = makeMeta({ difficultyLevel: 2, streakCount: 2, streakType: 'incorrect' })
    const { updatedMeta } = applyAnswer(meta, false, 35_000, thresholds)
    expect(updatedMeta.difficultyLevel).toBe(1)
    expect(updatedMeta.streakCount).toBe(0)
  })

  it('clamps difficulty at max 5 on correct streak', () => {
    const meta = makeMeta({ difficultyLevel: 5, streakCount: 2, streakType: 'correct' })
    const { updatedMeta } = applyAnswer(meta, true, 5_000, thresholds)
    expect(updatedMeta.difficultyLevel).toBe(5)
    expect(updatedMeta.streakCount).toBe(0)
  })

  it('clamps difficulty at min 1 on incorrect streak', () => {
    const meta = makeMeta({ difficultyLevel: 1, streakCount: 2, streakType: 'incorrect' })
    const { updatedMeta } = applyAnswer(meta, false, 35_000, thresholds)
    expect(updatedMeta.difficultyLevel).toBe(1)
    expect(updatedMeta.streakCount).toBe(0)
  })

  it('does not change difficulty until streak reaches 3', () => {
    const meta = makeMeta({ difficultyLevel: 3, streakCount: 1, streakType: 'correct' })
    const { updatedMeta } = applyAnswer(meta, true, 5_000, thresholds)
    expect(updatedMeta.difficultyLevel).toBe(3)
    expect(updatedMeta.streakCount).toBe(2)
  })

  // L2: streakType resets to 'none' after difficulty change
  it('resets streakType to none after difficulty-triggered streak reset (correct)', () => {
    const meta = makeMeta({ difficultyLevel: 3, streakCount: 2, streakType: 'correct' })
    const { updatedMeta } = applyAnswer(meta, true, 5_000, thresholds)
    expect(updatedMeta.streakType).toBe('none')
  })

  it('resets streakType to none after difficulty-triggered streak reset (incorrect)', () => {
    const meta = makeMeta({ difficultyLevel: 2, streakCount: 2, streakType: 'incorrect' })
    const { updatedMeta } = applyAnswer(meta, false, 35_000, thresholds)
    expect(updatedMeta.streakType).toBe('none')
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — fallback base points
// ---------------------------------------------------------------------------
describe('applyAnswer — fallback base points', () => {
  it('uses 30 base points when difficultyLevel is out of range (e.g. 0)', () => {
    // difficultyLevel: 0 is not in BASE_POINTS (keys 1-5), so basePts ?? 30 = 30
    const meta = makeMeta({ difficultyLevel: 0 as unknown as 1 })
    const { scoreDelta } = applyAnswer(meta, true, 5_000, thresholds)
    // correct + fast → 30 * 2 = 60
    expect(scoreDelta).toBe(60)
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — non-zero starting score (L3)
// ---------------------------------------------------------------------------
describe('applyAnswer — non-zero starting score', () => {
  it('accumulates onto existing score', () => {
    const meta = makeMeta({ score: 100 })
    const { updatedMeta, scoreDelta } = applyAnswer(meta, true, 5_000, thresholds)
    expect(scoreDelta).toBe(60)
    expect(updatedMeta.score).toBe(160)
  })

  it('reduces a non-zero score on incorrect answer', () => {
    const meta = makeMeta({ score: 100 })
    const { updatedMeta, scoreDelta } = applyAnswer(meta, false, 35_000, thresholds)
    expect(scoreDelta).toBe(-60)
    expect(updatedMeta.score).toBe(40)
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — totalTimePlayedMs accumulates
// ---------------------------------------------------------------------------
describe('applyAnswer — totalTimePlayedMs', () => {
  it('adds timeTakenMs to totalTimePlayedMs', () => {
    const meta = makeMeta({ totalTimePlayedMs: 5_000 })
    const { updatedMeta } = applyAnswer(meta, true, 10_000, thresholds)
    expect(updatedMeta.totalTimePlayedMs).toBe(15_000)
  })
})

// ---------------------------------------------------------------------------
// applyAnswer — immutability (AC1)
// ---------------------------------------------------------------------------
describe('applyAnswer — immutability', () => {
  it('does not mutate the input meta', () => {
    const meta = makeMeta({ score: 100, difficultyLevel: 3 })
    const before = { ...meta }
    applyAnswer(meta, true, 5_000, thresholds)
    expect(meta).toEqual(before)
  })
})
