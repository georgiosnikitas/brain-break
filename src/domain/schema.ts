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
  score: z.number().refine(v => Number.isFinite(v)),
  difficultyLevel: z.number().int().min(1).max(5),
  startingDifficulty: z.number().int().min(1).max(5).default(2),
  streakCount: z.number().int().min(0),
  streakType: z.enum(['correct', 'incorrect', 'none']),
  totalTimePlayedMs: z.number().min(0).refine(v => Number.isFinite(v)),
  createdAt: z.iso.datetime(),
  lastSessionAt: z.iso.datetime().nullable(),
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
  userAnswer: z.enum(['A', 'B', 'C', 'D', 'TIMEOUT']),
  isCorrect: z.boolean(),
  answeredAt: z.iso.datetime(),
  timeTakenMs: z.number().min(0).refine(v => Number.isFinite(v)),
  speedTier: SpeedTierSchema,
  scoreDelta: z.number().refine(v => Number.isFinite(v)),
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
  sprintResult?: { questionsAnswered: number; totalQuestions: number; timedOut: boolean }
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
  { name: 'OpenAI', value: 'openai' },
  { name: 'Anthropic', value: 'anthropic' },
  { name: 'Google Gemini', value: 'gemini' },
  { name: 'GitHub Copilot', value: 'copilot' },
  { name: 'Ollama', value: 'ollama' },
]

export const PROVIDER_LABELS: Record<AiProviderType, string> = Object.fromEntries(
  PROVIDER_CHOICES.map(c => [c.value, c.name]),
) as Record<AiProviderType, string>

export const DEFAULT_OPENAI_MODEL = 'gpt-5.4'
export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-4-6'
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro'
export const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434'
export const DEFAULT_OLLAMA_MODEL = 'llama4'

export type ModelChoice = { name: string; value: string; description: string }

export const OPENAI_MODEL_CHOICES: ModelChoice[] = [
  { name: 'GPT-5.4', value: 'gpt-5.4', description: 'Complex — best intelligence, 1M context' },
  { name: 'GPT-5.4 Mini', value: 'gpt-5.4-mini', description: 'Normal — balanced speed & quality, 400K context' },
  { name: 'GPT-5.4 Nano', value: 'gpt-5.4-nano', description: 'Fast — cheapest, high-volume tasks, 400K context' },
]

export const ANTHROPIC_MODEL_CHOICES: ModelChoice[] = [
  { name: 'Claude Opus 4.6', value: 'claude-opus-4-6', description: 'Complex — most intelligent, agents & coding' },
  { name: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6', description: 'Normal — best speed & intelligence balance' },
  { name: 'Claude Haiku 4.5', value: 'claude-haiku-4-5', description: 'Fast — fastest, near-frontier intelligence' },
]

export const GEMINI_MODEL_CHOICES: ModelChoice[] = [
  { name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro', description: 'Complex — deep reasoning & coding' },
  { name: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash', description: 'Normal — best price-performance, reasoning' },
  { name: 'Gemini 2.5 Flash-Lite', value: 'gemini-2.5-flash-lite', description: 'Fast — fastest, most budget-friendly' },
]

export const ThemeSchema = z.enum(['dark', 'light'])
export type Theme = z.infer<typeof ThemeSchema>

export const SettingsFileSchema = z.object({
  provider: AiProviderTypeSchema.nullable().default(null),
  language: z.string().min(1),
  tone: ToneOfVoiceSchema,
  openaiModel: z.string().min(1).default(DEFAULT_OPENAI_MODEL),
  anthropicModel: z.string().min(1).default(DEFAULT_ANTHROPIC_MODEL),
  geminiModel: z.string().min(1).default(DEFAULT_GEMINI_MODEL),
  ollamaEndpoint: z.string().min(1).default(DEFAULT_OLLAMA_ENDPOINT),
  ollamaModel: z.string().min(1).default(DEFAULT_OLLAMA_MODEL),
  asciiArtMilestone: z.union([z.literal(0), z.literal(10), z.literal(100)]).default(100),
  theme: ThemeSchema.default('dark'),
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
    asciiArtMilestone: 100,
    theme: 'dark' as const,
    showWelcome: true,
  }
}
