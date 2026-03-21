import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { validateProvider } from '../ai/providers.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, type AiProviderType, type ToneOfVoice } from '../domain/schema.js'
import { menuTheme, success, warn } from '../utils/format.js'
import { clearScreen } from '../utils/screen.js'
import * as router from '../router.js'

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

const TONE_CHOICES: Array<{ name: string; value: ToneOfVoice }> = [
  { name: 'Natural', value: 'natural' },
  { name: 'Expressive', value: 'expressive' },
  { name: 'Calm', value: 'calm' },
  { name: 'Humorous', value: 'humorous' },
  { name: 'Sarcastic', value: 'sarcastic' },
  { name: 'Robot', value: 'robot' },
  { name: 'Pirate', value: 'pirate' },
]

const TONE_LABELS: Record<string, string> = Object.fromEntries(
  TONE_CHOICES.map(c => [c.value, c.name])
)

type SettingsAction = 'provider' | 'language' | 'tone' | 'save' | 'back'

export async function showSettingsScreen(): Promise<void> {
  clearScreen()

  const settingsResult = await readSettings()
  const currentSettings = settingsResult.ok ? settingsResult.data : defaultSettings()
  let language = currentSettings.language
  let tone: ToneOfVoice = currentSettings.tone
  let provider = currentSettings.provider
  let ollamaEndpoint = currentSettings.ollamaEndpoint
  let ollamaModel = currentSettings.ollamaModel

  try {
    while (true) {
      const action = await select<SettingsAction>({
        message: 'Settings',
        choices: [
          { name: `AI Provider:   ${provider ? PROVIDER_LABELS[provider] : 'Not set'}`, value: 'provider' as const },
          { name: `Language:      ${language}`, value: 'language' as const },
          { name: `Tone of Voice: ${TONE_LABELS[tone]}`, value: 'tone' as const },
          new Separator(),
          { name: '💾  Save', value: 'save' as const },
          { name: '←  Back', value: 'back' as const },
        ],
        theme: menuTheme,
      })

      if (action === 'provider') {
        const selectedProvider = await select<AiProviderType>({
          message: 'AI Provider',
          choices: PROVIDER_CHOICES,
          default: provider ?? undefined,
          theme: menuTheme,
        })

        if (selectedProvider === 'ollama') {
          ollamaEndpoint = (await input({
            message: 'Ollama Endpoint URL',
            default: ollamaEndpoint,
          })).trim() || ollamaEndpoint

          ollamaModel = (await input({
            message: 'Ollama Model Name',
            default: ollamaModel,
          })).trim() || ollamaModel
        }

        const validationResult = await validateProvider(selectedProvider, { ...currentSettings, provider: selectedProvider, ollamaEndpoint, ollamaModel })

        if (validationResult.ok) {
          console.log(success(`\n✓ ${PROVIDER_LABELS[selectedProvider]} is ready to go!`))
        } else {
          console.log(warn(`\n${validationResult.error}`))
        }

        provider = selectedProvider
      } else if (action === 'language') {
        language = (await input({
          message: 'Question Language',
          default: language,
        })).trim()
      } else if (action === 'tone') {
        tone = await select<ToneOfVoice>({
          message: 'Tone of Voice',
          choices: TONE_CHOICES,
          default: tone,
          theme: menuTheme,
        })
      } else if (action === 'save') {
        const result = await writeSettings({ ...currentSettings, language, tone, provider, ollamaEndpoint, ollamaModel })
        if (!result.ok) {
          console.error(`Failed to save settings: ${result.error}`)
        }
        break
      } else {
        break
      }
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }

  await router.showHome()
}
