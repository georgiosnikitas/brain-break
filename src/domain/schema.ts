import { z } from 'zod'

// ---------------------------------------------------------------------------
// Result<T> — universal return type for all I/O and AI operations
// ---------------------------------------------------------------------------
export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

// ---------------------------------------------------------------------------
// Speed tier
// ---------------------------------------------------------------------------
export const SpeedTierSchema = z.enum(['fast', 'normal', 'slow'])
export type SpeedTier = z.infer<typeof SpeedTierSchema>

// ---------------------------------------------------------------------------
// Answer option
// ---------------------------------------------------------------------------
export const AnswerOptionSchema = z.enum(['A', 'B', 'C', 'D'])
export type AnswerOption = z.infer<typeof AnswerOptionSchema>

// ---------------------------------------------------------------------------
// Domain meta
// ---------------------------------------------------------------------------
export const DomainMetaSchema = z.object({
  score: z.number().finite(),
  difficultyLevel: z.number().int().min(1).max(5),
  streakCount: z.number().int().min(0),
  streakType: z.enum(['correct', 'incorrect', 'none']),
  totalTimePlayedMs: z.number().min(0).finite(),
  createdAt: z.string().datetime(),
  lastSessionAt: z.string().datetime().nullable(),
  archived: z.boolean(),
})
export type DomainMeta = z.infer<typeof DomainMetaSchema>

// ---------------------------------------------------------------------------
// Question record (history entry)
// ---------------------------------------------------------------------------
export const QuestionRecordSchema = z.object({
  question: z.string().min(1),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  correctAnswer: AnswerOptionSchema,
  userAnswer: AnswerOptionSchema,
  isCorrect: z.boolean(),
  answeredAt: z.string().datetime(),
  timeTakenMs: z.number().min(0).finite(),
  speedTier: SpeedTierSchema,
  scoreDelta: z.number().finite(),
  difficultyLevel: z.number().int().min(1).max(5),
})
export type QuestionRecord = z.infer<typeof QuestionRecordSchema>

// ---------------------------------------------------------------------------
// Full domain file
// ---------------------------------------------------------------------------
export const DomainFileSchema = z.object({
  meta: DomainMetaSchema,
  hashes: z.array(z.string()),
  history: z.array(QuestionRecordSchema),
})
export type DomainFile = z.infer<typeof DomainFileSchema>

// ---------------------------------------------------------------------------
// Factory — returns a clean new domain (used on ENOENT in store.ts)
// ---------------------------------------------------------------------------
export function defaultDomainFile(): DomainFile {
  return {
    meta: {
      score: 0,
      difficultyLevel: 2,
      streakCount: 0,
      streakType: 'none',
      totalTimePlayedMs: 0,
      createdAt: new Date().toISOString(),
      lastSessionAt: null,
      archived: false,
    },
    hashes: [],
    history: [],
  }
}

// ---------------------------------------------------------------------------
// Settings file
// ---------------------------------------------------------------------------
export const ToneOfVoiceSchema = z.enum(['normal', 'enthusiastic', 'robot', 'pirate'])
export type ToneOfVoice = z.infer<typeof ToneOfVoiceSchema>

export const SettingsFileSchema = z.object({
  language: z.string().min(1),
  tone: ToneOfVoiceSchema,
})
export type SettingsFile = z.infer<typeof SettingsFileSchema>

export function defaultSettings(): SettingsFile {
  return { language: 'English', tone: 'normal' }
}
