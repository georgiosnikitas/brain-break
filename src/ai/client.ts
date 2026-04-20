import { randomInt } from 'node:crypto'
import { createProvider, AI_ERRORS, classifyProviderError } from './providers.js'
import type { AiProvider } from './providers.js'
import type { Result, SettingsFile, AnswerOption, QuestionRecord } from '../domain/schema.js'
import { defaultSettings } from '../domain/schema.js'
import { hashQuestion } from '../utils/hash.js'
import { buildQuestionPrompt, buildDeduplicationPrompt, buildMotivationalPrompt, buildExplanationPrompt, buildMicroLessonPrompt, buildVerificationPrompt, buildCoachReportPrompt, QuestionResponseSchema, VerificationResponseSchema, sanitizeInput } from './prompts.js'
import type { QuestionResponse, VerifiedQuestion, MotivationalTrigger } from './prompts.js'

// Re-export AI_ERRORS so downstream consumers keep working without import path changes
export { AI_ERRORS } from './providers.js'

export type Question = VerifiedQuestion

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function classifyError(err: unknown, settings?: SettingsFile): string {
  return classifyProviderError(err, settings?.provider ?? null, settings?.provider === 'openai-compatible' ? settings?.openaiCompatibleEndpoint : settings?.ollamaEndpoint)
}

export function isAuthErrorMessage(error: string): boolean {
  return error === AI_ERRORS.AUTH_COPILOT
    || error === AI_ERRORS.AUTH_OPENAI
    || error === AI_ERRORS.AUTH_ANTHROPIC
    || error === AI_ERRORS.AUTH_GEMINI
    || error === AI_ERRORS.AUTH_OLLAMA
    || error === AI_ERRORS.AUTH_OPENAI_COMPATIBLE
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

function parseAndValidate<T>(raw: string, schema: { safeParse(data: unknown): { success: true; data: T } | { success: false } }): Result<T> {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonFences(raw))
  } catch {
    return { ok: false, error: AI_ERRORS.PARSE }
  }
  const result = schema.safeParse(parsed)
  if (!result.success) {
    return { ok: false, error: AI_ERRORS.PARSE }
  }
  return { ok: true, data: result.data }
}

function shuffleOptions(question: QuestionResponse): QuestionResponse {
  const keys = ['A', 'B', 'C', 'D'] as const

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

  return { ...question, options: newOptions }
}

async function verifyAnswer(question: QuestionResponse, provider: AiProvider, settings?: SettingsFile): Promise<Result<Question>> {
  try {
    const prompt = buildVerificationPrompt(question, settings)
    const raw = await provider.generateCompletion(prompt)
    const parseResult = parseAndValidate(raw, VerificationResponseSchema)
    if (!parseResult.ok) return parseResult
    // Local proof: the letter must point to the same text the verifier chose
    if (sanitizeInput(question.options[parseResult.data.correctAnswer]) !== sanitizeInput(parseResult.data.correctOptionText)) {
      return { ok: false, error: AI_ERRORS.PARSE }
    }
    return { ok: true, data: { ...question, correctAnswer: parseResult.data.correctAnswer } }
  } catch (err) {
    return { ok: false, error: classifyError(err, settings) }
  }
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

  const MAX_ATTEMPTS = 3
  let lastError: string = AI_ERRORS.PARSE

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Build prompt — use dedup prompt if we have previous questions to avoid
      const collectedPrevious = [...previousQuestions]
      const prompt = collectedPrevious.length > 0
        ? buildDeduplicationPrompt(domain, difficultyLevel, collectedPrevious, effectiveSettings)
        : buildQuestionPrompt(domain, difficultyLevel, effectiveSettings)

      const raw = await provider.generateCompletion(prompt)
      const parseResult = parseAndValidate(raw, QuestionResponseSchema)
      if (!parseResult.ok) {
        lastError = parseResult.error
        continue
      }

      const candidate = parseResult.data

      // Check for duplicate
      const hash = hashQuestion(candidate.question)
      if (existingHashes.has(hash)) {
        // Duplicate — add to previousQuestions and retry with dedup prompt
        lastError = AI_ERRORS.DUPLICATE
        previousQuestions = [...previousQuestions, candidate.question]
        continue
      }

      // Shuffle options, then verify
      const shuffled = shuffleOptions(candidate)
      const verifyResult = await verifyAnswer(shuffled, provider, effectiveSettings)
      if (!verifyResult.ok) {
        lastError = verifyResult.error
        continue
      }

      return { ok: true, data: verifyResult.data }
    }

    return { ok: false, error: lastError }
  } catch (err) {
    return { ok: false, error: classifyError(err, effectiveSettings) }
  }
}

export async function preloadQuestions(
  count: number,
  domain: string,
  difficultyLevel: number,
  existingHashes: Set<string>,
  settings: SettingsFile,
  onProgress?: (generated: number, total: number) => void,
): Promise<Result<Question[]>> {
  const runningHashes = new Set(existingHashes)
  const questions: Question[] = []
  const previousQuestions: string[] = []

  for (let i = 0; i < count; i++) {
    const result = await generateQuestion(domain, difficultyLevel, runningHashes, previousQuestions, settings)
    if (!result.ok) {
      return { ok: false, error: result.error }
    }
    questions.push(result.data)
    runningHashes.add(hashQuestion(result.data.question))
    previousQuestions.push(result.data.question)
    onProgress?.(i + 1, count)
  }

  return { ok: true, data: questions }
}

async function callProvider(prompt: string, settings?: SettingsFile): Promise<Result<string>> {
  const effectiveSettings = settings ?? defaultSettings()
  const providerResult = createProvider(effectiveSettings)
  if (!providerResult.ok) {
    return { ok: false, error: providerResult.error }
  }
  try {
    const text = (await providerResult.data.generateCompletion(prompt)).trim()
    return { ok: true, data: text }
  } catch (err) {
    return { ok: false, error: classifyError(err, effectiveSettings) }
  }
}

export async function generateMotivationalMessage(
  trigger: MotivationalTrigger,
  settings?: SettingsFile,
): Promise<Result<string>> {
  return callProvider(buildMotivationalPrompt(trigger, settings), settings)
}

export async function generateExplanation(
  question: Question,
  userAnswer: AnswerOption,
  settings?: SettingsFile,
): Promise<Result<string>> {
  return callProvider(buildExplanationPrompt(question, userAnswer, settings), settings)
}

export async function generateMicroLesson(
  question: Question,
  explanation: string,
  settings?: SettingsFile,
): Promise<Result<string>> {
  return callProvider(buildMicroLessonPrompt(question, explanation, settings), settings)
}

export async function generateCoachReport(
  slug: string,
  scopedHistory: QuestionRecord[],
  settings?: SettingsFile,
): Promise<Result<string>> {
  return callProvider(buildCoachReportPrompt(slug, scopedHistory, settings), settings)
}
