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

function updateStreak(
  meta: DomainMeta,
  isCorrect: boolean,
): { streakCount: number; streakType: DomainMeta['streakType'] } {
  const expectedStreakType = isCorrect ? 'correct' : 'incorrect'
  if (meta.streakType === expectedStreakType) {
    return { streakCount: meta.streakCount + 1, streakType: meta.streakType }
  }
  return { streakCount: 1, streakType: expectedStreakType }
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
  const correctMultipliers: Record<SpeedTier, number> = { fast: 2, normal: 1, slow: 0.5 }
  const incorrectMultipliers: Record<SpeedTier, number> = { fast: -1, normal: -1.5, slow: -2 }
  const multiplier = isCorrect ? correctMultipliers[speedTier] : incorrectMultipliers[speedTier]
  const scoreDelta = Math.round(basePts * multiplier)

  // Streak update
  let { streakCount, streakType } = updateStreak(meta, isCorrect)

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
