import { select, input } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { validateProvider } from '../ai/providers.js'
import { writeSettings } from '../domain/store.js'
import type { AiProviderType, SettingsFile } from '../domain/schema.js'
import { menuTheme, success, warn } from '../utils/format.js'
import { clearScreen } from '../utils/screen.js'

const PROVIDER_CHOICES: Array<{ name: string; value: AiProviderType }> = [
  { name: 'GitHub Copilot', value: 'copilot' },
  { name: 'OpenAI', value: 'openai' },
  { name: 'Anthropic', value: 'anthropic' },
  { name: 'Google Gemini', value: 'gemini' },
  { name: 'Ollama', value: 'ollama' },
]

const PROVIDER_LABELS: Record<AiProviderType, string> = Object.fromEntries(
  PROVIDER_CHOICES.map(c => [c.value, c.name]),
) as Record<AiProviderType, string>

export async function showProviderSetupScreen(settings: SettingsFile): Promise<void> {
  clearScreen()
  console.log('\n🔧 First-Time Setup\n')
  console.log('Select your preferred AI provider to get started.\n')

  try {
    const provider = await select<AiProviderType>({
      message: 'AI Provider',
      choices: PROVIDER_CHOICES,
      theme: menuTheme,
    })

    const updatedSettings: SettingsFile = { ...settings, provider }

    if (provider === 'ollama') {
      const ollamaEndpoint = (await input({
        message: 'Ollama Endpoint URL',
        default: settings.ollamaEndpoint,
      })).trim() || settings.ollamaEndpoint

      const ollamaModel = (await input({
        message: 'Ollama Model Name',
        default: settings.ollamaModel,
      })).trim() || settings.ollamaModel

      updatedSettings.ollamaEndpoint = ollamaEndpoint
      updatedSettings.ollamaModel = ollamaModel
    }

    const validationResult = await validateProvider(provider, updatedSettings)

    if (validationResult.ok) {
      console.log(success(`\n✓ ${PROVIDER_LABELS[provider]} is ready to go!`))
    } else {
      console.log(warn(`\n${validationResult.error}`))
    }

    const writeResult = await writeSettings(updatedSettings)
    if (!writeResult.ok) {
      console.error(`Failed to save settings: ${writeResult.error}`)
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}
