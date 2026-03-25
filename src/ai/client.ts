import { randomInt } from 'node:crypto'
import { createProvider, AI_ERRORS } from './providers.js'
import type { Result, SettingsFile, AnswerOption } from '../domain/schema.js'
import { defaultSettings } from '../domain/schema.js'
import { hashQuestion } from '../utils/hash.js'
import { buildQuestionPrompt, buildDeduplicationPrompt, buildMotivationalPrompt, buildExplanationPrompt, QuestionResponseSchema } from './prompts.js'
import type { QuestionResponse, MotivationalTrigger } from './prompts.js'

// Re-export AI_ERRORS so downstream consumers keep working without import path changes
export { AI_ERRORS } from './providers.js'

export type Question = QuestionResponse

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function classifyError(err: unknown, settings?: SettingsFile): string {
  const provider = settings?.provider ?? null
  const isAuth = err instanceof Error
    && /401|unauthorized|unauthenticated|authentication|api key|invalid key/i.test(err.message)

  if (isAuth) {
    switch (provider) {
      case 'copilot': return AI_ERRORS.AUTH_COPILOT
      case 'openai': return AI_ERRORS.AUTH_OPENAI
      case 'anthropic': return AI_ERRORS.AUTH_ANTHROPIC
      case 'gemini': return AI_ERRORS.AUTH_GEMINI
      case 'ollama': return AI_ERRORS.AUTH_OLLAMA
      default: return AI_ERRORS.NO_PROVIDER
    }
  }

  switch (provider) {
    case 'copilot': return AI_ERRORS.NETWORK_COPILOT
    case 'openai': return AI_ERRORS.NETWORK_OPENAI
    case 'anthropic': return AI_ERRORS.NETWORK_ANTHROPIC
    case 'gemini': return AI_ERRORS.NETWORK_GEMINI
    case 'ollama': return AI_ERRORS.NETWORK_OLLAMA(settings?.ollamaEndpoint ?? 'http://localhost:11434')
    default: return AI_ERRORS.NO_PROVIDER
  }
}

export function isAuthErrorMessage(error: string): boolean {
  return error === AI_ERRORS.AUTH_COPILOT
    || error === AI_ERRORS.AUTH_OPENAI
    || error === AI_ERRORS.AUTH_ANTHROPIC
    || error === AI_ERRORS.AUTH_GEMINI
    || error === AI_ERRORS.AUTH_OLLAMA
}

function stripJsonFences(text: string): string {
  let result = text.trim()
  if (result.startsWith('```')) {
    const newlineIdx = result.indexOf('\n')
    result = newlineIdx === -1 ? result.slice(3) : result.slice(newlineIdx + 1)
  }
  if (result.endsWith('```')) {
    result = result.slice(0, -3)
  }
  return result.trim()
}

function parseAndValidate(raw: string): Result<Question> {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFences(raw))
  } catch {
    return { ok: false, error: AI_ERRORS.PARSE }
  }
  const result = QuestionResponseSchema.safeParse(parsed)
  if (!result.success) {
    return { ok: false, error: AI_ERRORS.PARSE }
  }
  return { ok: true, data: result.data }
}

function shuffleOptions(question: Question): Question {
  const keys = ['A', 'B', 'C', 'D'] as const
  const correctText = question.options[question.correctAnswer]

  // Fisher-Yates shuffle
  const indices = [0, 1, 2, 3]
  for (let i = indices.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  const newOptions = {
    A: question.options[keys[indices[0]]],
    B: question.options[keys[indices[1]]],
    C: question.options[keys[indices[2]]],
    D: question.options[keys[indices[3]]],
  }

  const newCorrectAnswer = keys.find((k) => newOptions[k] === correctText) ?? question.correctAnswer
  return { ...question, options: newOptions, correctAnswer: newCorrectAnswer }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function generateQuestion(
  domain: string,
  difficultyLevel: number,
  existingHashes: Set<string>,
  previousQuestions: string[] = [],
  settings?: SettingsFile,
): Promise<Result<Question>> {
  const effectiveSettings = settings ?? defaultSettings()
  const providerResult = createProvider(effectiveSettings)
  if (!providerResult.ok) {
    return { ok: false, error: providerResult.error }
  }
  const provider = providerResult.data

  try {
    // First attempt
    const prompt = buildQuestionPrompt(domain, difficultyLevel, settings)
    const raw = await provider.generateCompletion(prompt)
    const firstResult = parseAndValidate(raw)

    if (!firstResult.ok) {
      return firstResult
    }

    const hash = hashQuestion(firstResult.data.question)
    if (!existingHashes.has(hash)) {
      return { ok: true, data: shuffleOptions(firstResult.data) }
    }

    // Duplicate — retry once
    const retryPrompt = buildDeduplicationPrompt(
      domain,
      difficultyLevel,
      [...previousQuestions, firstResult.data.question],
      settings,
    )
    const retryRaw = await provider.generateCompletion(retryPrompt)
    const retryResult = parseAndValidate(retryRaw)
    if (!retryResult.ok) return retryResult
    return { ok: true, data: shuffleOptions(retryResult.data) }
  } catch (err) {
    return { ok: false, error: classifyError(err, effectiveSettings) }
  }
}

export async function generateMotivationalMessage(
  trigger: MotivationalTrigger,
  settings?: SettingsFile,
): Promise<Result<string>> {
  const effectiveSettings = settings ?? defaultSettings()
  const providerResult = createProvider(effectiveSettings)
  if (!providerResult.ok) {
    return { ok: false, error: providerResult.error }
  }
  const provider = providerResult.data

  try {
    const prompt = buildMotivationalPrompt(trigger, settings)
    const message = (await provider.generateCompletion(prompt)).trim()
    return { ok: true, data: message }
  } catch (err) {
    return { ok: false, error: classifyError(err, effectiveSettings) }
  }
}

export async function generateExplanation(
  question: Question,
  userAnswer: AnswerOption,
  settings?: SettingsFile,
): Promise<Result<string>> {
  const effectiveSettings = settings ?? defaultSettings()
  const providerResult = createProvider(effectiveSettings)
  if (!providerResult.ok) {
    return { ok: false, error: providerResult.error }
  }
  const provider = providerResult.data

  try {
    const prompt = buildExplanationPrompt(question, userAnswer, settings)
    const explanation = (await provider.generateCompletion(prompt)).trim()
    return { ok: true, data: explanation }
  } catch (err) {
    return { ok: false, error: classifyError(err, effectiveSettings) }
  }
}
