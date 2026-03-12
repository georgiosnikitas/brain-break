import { CopilotClient, approveAll } from '@github/copilot-sdk'
import type { Result } from '../domain/schema.js'
import { hashQuestion } from '../utils/hash.js'
import { buildQuestionPrompt, buildDeduplicationPrompt, QuestionResponseSchema } from './prompts.js'
import type { QuestionResponse } from './prompts.js'

// ---------------------------------------------------------------------------
// User-facing error constants (referenced by screens)
// ---------------------------------------------------------------------------
export const AI_ERRORS = {
  NETWORK: 'Could not reach the Copilot API. Check your connection and try again.',
  AUTH: 'Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in.',
  PARSE: 'Received an unexpected response from Copilot. Please try again.',
} as const

export type Question = QuestionResponse

// ---------------------------------------------------------------------------
// Module-level singleton client (lazy-started, reused across calls)
// ---------------------------------------------------------------------------
let _client: CopilotClient | null = null

async function getClient(): Promise<CopilotClient> {
  if (_client) return _client
  const client = new CopilotClient()
  await client.start()
  _client = client
  return _client
}

// Exported for testing — allows tests to inject a mock client
export function _setClient(client: CopilotClient | null): void {
  _client = client
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isAuthError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return msg.includes('401') || msg.includes('unauthorized') || msg.includes('unauthenticated') || msg.includes('authentication')
}

function stripJsonFences(text: string): string {
  let result = text.trim()
  if (result.startsWith('```')) {
    const newlineIdx = result.indexOf('\n')
    result = newlineIdx !== -1 ? result.slice(newlineIdx + 1) : result.slice(3)
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function generateQuestion(
  domain: string,
  difficultyLevel: number,
  existingHashes: Set<string>,
): Promise<Result<Question>> {
  try {
    const client = await getClient()
    const session = await client.createSession({ onPermissionRequest: approveAll })

    try {
      // First attempt
      const prompt = buildQuestionPrompt(domain, difficultyLevel)
      const event = await session.sendAndWait({ prompt })
      const raw = event?.data.content ?? ''
      const firstResult = parseAndValidate(raw)

      if (!firstResult.ok) {
        return firstResult
      }

      const hash = hashQuestion(firstResult.data.question)
      if (!existingHashes.has(hash)) {
        return firstResult
      }

      // Duplicate — retry once
      const retryPrompt = buildDeduplicationPrompt(
        domain,
        difficultyLevel,
        firstResult.data.question,
      )
      const retryEvent = await session.sendAndWait({ prompt: retryPrompt })
      const retryRaw = retryEvent?.data.content ?? ''
      return parseAndValidate(retryRaw)
    } finally {
      await session.disconnect()
    }
  } catch (err) {
    if (isAuthError(err)) {
      return { ok: false, error: AI_ERRORS.AUTH }
    }
    return { ok: false, error: AI_ERRORS.NETWORK }
  }
}
