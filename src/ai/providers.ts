import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { CopilotClient, approveAll } from '@github/copilot-sdk'
import type { AiProviderType, Result, SettingsFile } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// AiProvider interface — single method contract for all providers
// ---------------------------------------------------------------------------
export interface AiProvider {
  generateCompletion(prompt: string): Promise<string>
}

// ---------------------------------------------------------------------------
// User-facing error constants (per-provider)
// ---------------------------------------------------------------------------
export const AI_ERRORS = {
  NO_PROVIDER: 'AI provider not ready. Go to Settings to configure.',
  PARSE: 'Received an unexpected response from the AI provider. Please try again.',
  // Network errors
  NETWORK_COPILOT: 'Could not reach the Copilot API. Check your connection and try again.',
  NETWORK_OPENAI: 'Could not reach OpenAI API. Check your connection and try again.',
  NETWORK_ANTHROPIC: 'Could not reach Anthropic API. Check your connection and try again.',
  NETWORK_GEMINI: 'Could not reach Gemini API. Check your connection and try again.',
  NETWORK_OLLAMA: (endpoint: string) => `Could not reach Ollama at ${endpoint}. Ensure Ollama is running and try again.`,
  // Auth errors
  AUTH_COPILOT: 'Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in.',
  AUTH_OPENAI: 'OpenAI API key is invalid or missing. Set the OPENAI_API_KEY environment variable with a valid key and restart the app.',
  AUTH_ANTHROPIC: 'Anthropic API key is invalid or missing. Set the ANTHROPIC_API_KEY environment variable with a valid key and restart the app.',
  AUTH_GEMINI: 'Google API key is invalid or missing. Set the GOOGLE_GENERATIVE_AI_API_KEY environment variable with a valid key and restart the app.',
  AUTH_OLLAMA: 'Could not connect to Ollama. Check that the endpoint and model are correct in Settings.',
  // Quota errors
  QUOTA: 'API quota exceeded. Check your plan and billing details with your provider.',
} as const

// ---------------------------------------------------------------------------
// Copilot adapter — custom implementation (not supported by Vercel AI SDK)
// ---------------------------------------------------------------------------
let _copilotClient: CopilotClient | null = null

async function getCopilotClient(): Promise<CopilotClient> {
  if (_copilotClient) return _copilotClient
  const client = new CopilotClient()
  await client.start()
  _copilotClient = client
  return _copilotClient
}

// Exported for testing — allows tests to inject a mock client
export function _setCopilotClient(client: CopilotClient | null): void {
  _copilotClient = client
}

function createCopilotAdapter(): AiProvider {
  return {
    async generateCompletion(prompt: string): Promise<string> {
      const client = await getCopilotClient()
      const session = await client.createSession({ onPermissionRequest: approveAll })
      try {
        const event = await session.sendAndWait({ prompt })
        return (event?.data.content ?? '').trim()
      } finally {
        await session.disconnect()
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Vercel AI SDK adapters — thin wrappers around generateText()
// ---------------------------------------------------------------------------
function createOpenAIAdapter(): AiProvider {
  return {
    async generateCompletion(prompt: string): Promise<string> {
      const { text } = await generateText({ model: openai('gpt-4o-mini'), prompt })
      return text
    },
  }
}

function createAnthropicAdapter(): AiProvider {
  return {
    async generateCompletion(prompt: string): Promise<string> {
      const { text } = await generateText({ model: anthropic('claude-sonnet-4-20250514'), prompt })
      return text
    },
  }
}

function createGeminiAdapter(): AiProvider {
  const google = createGoogleGenerativeAI({ apiKey: process.env['GOOGLE_GENERATIVE_AI_API_KEY'] })
  return {
    async generateCompletion(prompt: string): Promise<string> {
      const { text } = await generateText({ model: google('gemini-2.0-flash'), prompt })
      return text
    },
  }
}

function getOllamaApiUrl(endpoint: string, path: string): string {
  let normalizedEndpoint = endpoint
  while (normalizedEndpoint.endsWith('/')) {
    normalizedEndpoint = normalizedEndpoint.slice(0, -1)
  }
  return `${normalizedEndpoint}/api/${path}`
}

async function parseOllamaError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: { message?: string } | string }
    if (typeof body.error === 'string') return body.error
    if (typeof body.error?.message === 'string') return body.error.message
  } catch {
    // Fall back to raw text when Ollama returns a non-JSON error payload.
  }

  try {
    const text = await response.text()
    if (text.trim().length > 0) return text.trim()
  } catch {
    // Ignore read failures and use the status line fallback below.
  }

  return `Ollama request failed with status ${response.status}`
}

function createOllamaAdapter(settings: SettingsFile): AiProvider {
  return {
    async generateCompletion(prompt: string): Promise<string> {
      const response = await fetch(getOllamaApiUrl(settings.ollamaEndpoint, 'generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(await parseOllamaError(response))
      }

      const data = await response.json() as { response?: string }
      return (data.response ?? '').trim()
    },
  }
}

// ---------------------------------------------------------------------------
// Factory — returns the active provider adapter based on settings
// ---------------------------------------------------------------------------
export function createProvider(settings: SettingsFile): Result<AiProvider> {
  if (settings.provider === null) {
    return { ok: false, error: AI_ERRORS.NO_PROVIDER }
  }

  const adapters: Record<AiProviderType, () => AiProvider> = {
    copilot: createCopilotAdapter,
    openai: createOpenAIAdapter,
    anthropic: createAnthropicAdapter,
    gemini: createGeminiAdapter,
    ollama: () => createOllamaAdapter(settings),
  }

  return { ok: true, data: adapters[settings.provider]() }
}

// ---------------------------------------------------------------------------
// Test connection — validates provider AND makes a real API call
// ---------------------------------------------------------------------------
export async function testProviderConnection(
  providerType: AiProviderType,
  settings: SettingsFile,
): Promise<Result<string>> {
  const validation = await validateProvider(providerType, settings)
  if (!validation.ok) return validation

  const providerResult = createProvider({ ...settings, provider: providerType })
  if (!providerResult.ok) return providerResult

  try {
    const response = await providerResult.data.generateCompletion('Say a short, one-sentence greeting to confirm you are working.')
    return { ok: true, data: response }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''

    const isQuota = /quota|rate.?limit|too many requests|429/i.test(msg)
    if (isQuota) {
      return { ok: false, error: AI_ERRORS.QUOTA }
    }

    const isAuth = /401|403|unauthorized|unauthenticated|authentication|api key|invalid key/i.test(msg)

    if (isAuth) {
      const authErrors: Record<AiProviderType, string> = {
        copilot: AI_ERRORS.AUTH_COPILOT,
        openai: AI_ERRORS.AUTH_OPENAI,
        anthropic: AI_ERRORS.AUTH_ANTHROPIC,
        gemini: AI_ERRORS.AUTH_GEMINI,
        ollama: AI_ERRORS.AUTH_OLLAMA,
      }
      return { ok: false, error: authErrors[providerType] }
    }

    const networkErrors: Record<AiProviderType, string> = {
      copilot: AI_ERRORS.NETWORK_COPILOT,
      openai: AI_ERRORS.NETWORK_OPENAI,
      anthropic: AI_ERRORS.NETWORK_ANTHROPIC,
      gemini: AI_ERRORS.NETWORK_GEMINI,
      ollama: AI_ERRORS.NETWORK_OLLAMA(settings.ollamaEndpoint),
    }
    return { ok: false, error: networkErrors[providerType] }
  }
}

// ---------------------------------------------------------------------------
// Validation — checks provider readiness without generating a question
// ---------------------------------------------------------------------------
export async function validateProvider(
  providerType: AiProviderType,
  settings: SettingsFile,
): Promise<Result<void>> {
  switch (providerType) {
    case 'openai':
      return process.env['OPENAI_API_KEY']
        ? { ok: true, data: undefined }
        : { ok: false, error: AI_ERRORS.AUTH_OPENAI }

    case 'anthropic':
      return process.env['ANTHROPIC_API_KEY']
        ? { ok: true, data: undefined }
        : { ok: false, error: AI_ERRORS.AUTH_ANTHROPIC }

    case 'gemini':
      return process.env['GOOGLE_GENERATIVE_AI_API_KEY']
        ? { ok: true, data: undefined }
        : { ok: false, error: AI_ERRORS.AUTH_GEMINI }

    case 'ollama':
      try {
        const response = await fetch(getOllamaApiUrl(settings.ollamaEndpoint, 'tags'))
        if (response.ok) {
          return { ok: true, data: undefined }
        }
        return { ok: false, error: AI_ERRORS.AUTH_OLLAMA }
      } catch {
        return { ok: false, error: AI_ERRORS.AUTH_OLLAMA }
      }

    case 'copilot':
      try {
        const client = await getCopilotClient()
        const session = await client.createSession({ onPermissionRequest: approveAll })
        await session.disconnect()
        return { ok: true, data: undefined }
      } catch {
        return { ok: false, error: AI_ERRORS.AUTH_COPILOT }
      }
  }
}
