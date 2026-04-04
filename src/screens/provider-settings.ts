import { input } from '@inquirer/prompts'
import ora from 'ora'
import { testProviderConnection } from '../ai/providers.js'
import {
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OPENAI_MODEL,
  PROVIDER_LABELS,
  type AiProviderType,
  type SettingsFile,
} from '../domain/schema.js'
import { success, warn } from '../utils/format.js'

type HostedProviderType = Exclude<AiProviderType, 'copilot' | 'ollama'>

const HOSTED_PROVIDER_MODEL_PROMPTS: Record<HostedProviderType, string> = {
  openai: 'OpenAI Model Name',
  anthropic: 'Anthropic Model Name',
  gemini: 'Google Gemini Model Name',
}

const HOSTED_PROVIDER_DEFAULT_MODELS: Record<HostedProviderType, string> = {
  openai: DEFAULT_OPENAI_MODEL,
  anthropic: DEFAULT_ANTHROPIC_MODEL,
  gemini: DEFAULT_GEMINI_MODEL,
}

function isHostedProvider(provider: AiProviderType): provider is HostedProviderType {
  return provider === 'openai' || provider === 'anthropic' || provider === 'gemini'
}

export async function promptForProviderSettings(provider: AiProviderType, settings: SettingsFile): Promise<SettingsFile> {
  const updatedSettings: SettingsFile = { ...settings, provider }

  if (provider === 'ollama') {
    updatedSettings.ollamaEndpoint = (await input({
      message: 'Ollama Endpoint URL',
      default: settings.ollamaEndpoint,
    })).trim() || settings.ollamaEndpoint

    updatedSettings.ollamaModel = (await input({
      message: 'Ollama Model Name',
      default: settings.ollamaModel,
    })).trim() || DEFAULT_OLLAMA_MODEL

    return updatedSettings
  }

  if (isHostedProvider(provider)) {
    const modelField = `${provider}Model` as const
    const enteredModel = await input({
      message: HOSTED_PROVIDER_MODEL_PROMPTS[provider],
      default: settings[modelField],
    })
    updatedSettings[modelField] = (enteredModel ?? '').trim() || HOSTED_PROVIDER_DEFAULT_MODELS[provider]
  }

  return updatedSettings
}

export async function testAndReport(
  provider: AiProviderType,
  settings: SettingsFile,
): Promise<string> {
  const spinner = ora('Testing connection...').start()
  const result = await testProviderConnection(provider, settings)
  spinner.stop()
  if (result.ok) {
    return success(`✓ ${PROVIDER_LABELS[provider]}: ${result.data}`)
  }
  return warn(result.error)
}
