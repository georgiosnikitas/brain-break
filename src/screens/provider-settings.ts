import { select, input, Separator } from '@inquirer/prompts'
import ora from 'ora'
import { testProviderConnection } from '../ai/providers.js'
import {
  DEFAULT_OLLAMA_MODEL,
  OPENAI_MODEL_CHOICES,
  ANTHROPIC_MODEL_CHOICES,
  GEMINI_MODEL_CHOICES,
  PROVIDER_LABELS,
  type AiProviderType,
  type ModelChoice,
  type SettingsFile,
} from '../domain/schema.js'
import { menuTheme, success, warn } from '../utils/format.js'

type HostedProviderType = Exclude<AiProviderType, 'copilot' | 'ollama'>

const HOSTED_PROVIDER_MODEL_CHOICES: Record<HostedProviderType, ModelChoice[]> = {
  openai: OPENAI_MODEL_CHOICES,
  anthropic: ANTHROPIC_MODEL_CHOICES,
  gemini: GEMINI_MODEL_CHOICES,
}

const HOSTED_PROVIDER_MODEL_PROMPTS: Record<HostedProviderType, string> = {
  openai: 'OpenAI Model',
  anthropic: 'Anthropic Model',
  gemini: 'Google Gemini Model',
}

function isHostedProvider(provider: AiProviderType): provider is HostedProviderType {
  return provider === 'openai' || provider === 'anthropic' || provider === 'gemini'
}

export async function promptForProviderSettings(provider: AiProviderType, settings: SettingsFile): Promise<SettingsFile | null> {
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
    const choices = HOSTED_PROVIDER_MODEL_CHOICES[provider]
    const currentModel = settings[modelField]
    const isCustom = !choices.some(c => c.value === currentModel)
    const selectedModel = await select<string>({
      message: HOSTED_PROVIDER_MODEL_PROMPTS[provider],
      choices: [
        ...choices,
        { name: '🧙 Custom model', value: 'custom', description: isCustom ? `Current: ${currentModel}` : 'Enter a model name manually' },
        new Separator(),
        { name: '↩️  Back', value: 'back' },
      ],
      default: isCustom ? 'custom' : currentModel,
      theme: menuTheme,
    })
    if (selectedModel === 'back') return null
    if (selectedModel === 'custom') {
      const customModel = (await input({
        message: `${HOSTED_PROVIDER_MODEL_PROMPTS[provider]} Name`,
        default: currentModel,
        validate: (value: string) => value.trim() ? true : 'Model name cannot be empty',
      })).trim()
      updatedSettings[modelField] = customModel
    } else {
      updatedSettings[modelField] = selectedModel
    }
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
