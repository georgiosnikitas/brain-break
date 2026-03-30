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
  startingDifficulty: z.number().int().min(1).max(5).default(2),
  streakCount: z.number().int().min(0),
  streakType: z.enum(['correct', 'incorrect', 'none']),
  totalTimePlayedMs: z.number().min(0).finite(),
  createdAt: z.string().datetime(),
  lastSessionAt: z.string().datetime().nullable(),
  archived: z.boolean(),
})
export type DomainMeta = z.infer<typeof DomainMetaSchema>
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

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
  bookmarked: z.boolean().default(false),
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
// Session data — ephemeral quiz session results passed to domain menu
// ---------------------------------------------------------------------------
export interface SessionData {
  records: QuestionRecord[]
  startingDifficulty: number
}

// ---------------------------------------------------------------------------
// Factory — returns a clean new domain (used on ENOENT in store.ts)
// ---------------------------------------------------------------------------
export function defaultDomainFile(startingDifficulty: number = 2): DomainFile {
  return {
    meta: {
      score: 0,
      difficultyLevel: startingDifficulty,
      startingDifficulty,
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
export const ToneOfVoiceSchema = z.enum(['natural', 'expressive', 'calm', 'humorous', 'sarcastic', 'robot', 'pirate'])
export type ToneOfVoice = z.infer<typeof ToneOfVoiceSchema>

export const AiProviderTypeSchema = z.enum(['copilot', 'openai', 'anthropic', 'gemini', 'ollama'])
export type AiProviderType = z.infer<typeof AiProviderTypeSchema>

export const PROVIDER_CHOICES: Array<{ name: string; value: AiProviderType }> = [
  { name: 'GitHub Copilot', value: 'copilot' },
  { name: 'OpenAI', value: 'openai' },
  { name: 'Anthropic', value: 'anthropic' },
  { name: 'Google Gemini', value: 'gemini' },
  { name: 'Ollama', value: 'ollama' },
]

export const PROVIDER_LABELS: Record<AiProviderType, string> = Object.fromEntries(
  PROVIDER_CHOICES.map(c => [c.value, c.name]),
) as Record<AiProviderType, string>

export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'
export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434'
export const DEFAULT_OLLAMA_MODEL = 'llama3'

export const SettingsFileSchema = z.object({
  provider: AiProviderTypeSchema.nullable().default(null),
  language: z.string().min(1),
  tone: ToneOfVoiceSchema,
  openaiModel: z.string().min(1).default(DEFAULT_OPENAI_MODEL),
  anthropicModel: z.string().min(1).default(DEFAULT_ANTHROPIC_MODEL),
  geminiModel: z.string().min(1).default(DEFAULT_GEMINI_MODEL),
  ollamaEndpoint: z.string().min(1).default(DEFAULT_OLLAMA_ENDPOINT),
  ollamaModel: z.string().min(1).default(DEFAULT_OLLAMA_MODEL),
  showWelcome: z.boolean().default(true),
})
export type SettingsFile = z.infer<typeof SettingsFileSchema>

export function defaultSettings(): SettingsFile {
  return {
    provider: null,
    language: 'English',
    tone: 'natural',
    openaiModel: DEFAULT_OPENAI_MODEL,
    anthropicModel: DEFAULT_ANTHROPIC_MODEL,
    geminiModel: DEFAULT_GEMINI_MODEL,
    ollamaEndpoint: DEFAULT_OLLAMA_ENDPOINT,
    ollamaModel: DEFAULT_OLLAMA_MODEL,
    showWelcome: true,
  }
}
