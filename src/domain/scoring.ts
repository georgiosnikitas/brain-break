import type { DomainMeta, SpeedTier } from './schema.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SpeedThresholds {
  fastMs: number
  slowMs: number
}

export interface ApplyAnswerResult {
  updatedMeta: DomainMeta
  scoreDelta: number
  speedTier: SpeedTier
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BASE_POINTS: Record<number, number> = {
  1: 10,
  2: 20,
  3: 30,
  4: 40,
  5: 50,
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------
export function getSpeedTier(timeTakenMs: number, speedThresholds: SpeedThresholds): SpeedTier {
  if (timeTakenMs < speedThresholds.fastMs) return 'fast'
  if (timeTakenMs >= speedThresholds.slowMs) return 'slow'
  return 'normal'
}

// ---------------------------------------------------------------------------
// applyAnswer — pure, side-effect-free
// ---------------------------------------------------------------------------
export function applyAnswer(
  meta: DomainMeta,
  isCorrect: boolean,
  timeTakenMs: number,
  speedThresholds: SpeedThresholds,
): ApplyAnswerResult {
  const speedTier = getSpeedTier(timeTakenMs, speedThresholds)

  // Score delta
  const basePts = BASE_POINTS[meta.difficultyLevel] ?? 30
  let multiplier: number
  if (isCorrect) {
    multiplier = speedTier === 'fast' ? 2 : speedTier === 'normal' ? 1 : 0.5
  } else {
    multiplier = speedTier === 'fast' ? -1 : speedTier === 'normal' ? -1.5 : -2
  }
  const scoreDelta = Math.round(basePts * multiplier)

  // Streak update
  const expectedStreakType = isCorrect ? 'correct' : 'incorrect'
  let streakCount: number
  let streakType: DomainMeta['streakType']

  if (meta.streakType === expectedStreakType) {
    streakCount = meta.streakCount + 1
    streakType = meta.streakType
  } else {
    streakCount = 1
    streakType = expectedStreakType
  }

  // Difficulty update on streak of 3
  let difficultyLevel = meta.difficultyLevel
  if (streakCount >= 3) {
    difficultyLevel = isCorrect
      ? Math.min(difficultyLevel + 1, 5)
      : Math.max(difficultyLevel - 1, 1)
    streakCount = 0
    streakType = 'none'
  }

  const updatedMeta: DomainMeta = {
    ...meta,
    score: meta.score + scoreDelta,
    difficultyLevel,
    streakCount,
    streakType,
    totalTimePlayedMs: meta.totalTimePlayedMs + timeTakenMs,
  }

  return { updatedMeta, scoreDelta, speedTier }
}
