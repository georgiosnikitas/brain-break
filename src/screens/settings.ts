import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { testProviderConnection } from '../ai/providers.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, PROVIDER_CHOICES, PROVIDER_LABELS, type AiProviderType, type ToneOfVoice, type SettingsFile } from '../domain/schema.js'
import { menuTheme, success, warn } from '../utils/format.js'
import { clearScreen } from '../utils/screen.js'
import * as router from '../router.js'

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

export function getProviderLabel(provider: AiProviderType | null): string {
  return provider ? PROVIDER_LABELS[provider] : 'Not set'
}

async function handleProviderAction(
  provider: AiProviderType | null,
  settings: SettingsFile,
  ollamaEndpoint: string,
  ollamaModel: string,
) {
  const selectedProvider = await select<AiProviderType>({
    message: 'AI Provider',
    choices: PROVIDER_CHOICES,
    default: provider ?? undefined,
    theme: menuTheme,
  })

  if (selectedProvider === 'ollama') {
    ollamaEndpoint = (await input({ message: 'Ollama Endpoint URL', default: ollamaEndpoint })).trim() || ollamaEndpoint
    ollamaModel = (await input({ message: 'Ollama Model Name', default: ollamaModel })).trim() || ollamaModel
  }

  const spinner = ora('Testing connection...').start()
  const validationResult = await testProviderConnection(selectedProvider, { ...settings, provider: selectedProvider, ollamaEndpoint, ollamaModel })
  spinner.stop()

  const message = validationResult.ok
    ? success(`✓ ${PROVIDER_LABELS[selectedProvider]}: ${validationResult.data}`)
    : warn(validationResult.error)

  return { provider: selectedProvider, ollamaEndpoint, ollamaModel, message }
}

async function handleLanguageAction(currentLanguage: string): Promise<string> {
  return (await input({ message: 'Question Language', default: currentLanguage })).trim()
}

async function handleToneAction(currentTone: ToneOfVoice): Promise<ToneOfVoice> {
  return await select<ToneOfVoice>({
    message: 'Tone of Voice',
    choices: TONE_CHOICES,
    default: currentTone,
    theme: menuTheme,
  })
}

async function handleSaveAction(settings: SettingsFile): Promise<void> {
  const result = await writeSettings(settings)
  if (!result.ok) {
    console.error(`Failed to save settings: ${result.error}`)
  }
}

export async function showSettingsScreen(): Promise<void> {
  const settingsResult = await readSettings()
  const currentSettings = settingsResult.ok ? settingsResult.data : defaultSettings()
  
  let language = currentSettings.language
  let tone = currentSettings.tone
  let provider = currentSettings.provider
  let ollamaEndpoint = currentSettings.ollamaEndpoint
  let ollamaModel = currentSettings.ollamaModel
  let banner = ''

  try {
    while (true) {
      clearScreen()
      if (banner) {
        console.log(banner + '\n')
        banner = ''
      }
      
      const action = await select<SettingsAction>({
        message: 'Settings',
        choices: [
          { name: `AI Provider:   ${getProviderLabel(provider)}`, value: 'provider' as const },
          { name: `Language:      ${language}`, value: 'language' as const },
          { name: `Tone of Voice: ${TONE_LABELS[tone]}`, value: 'tone' as const },
          new Separator(),
          { name: '💾  Save', value: 'save' as const },
          { name: '←  Back', value: 'back' as const },
        ],
        theme: menuTheme,
      })

      switch (action) {
        case 'provider': {
          const result = await handleProviderAction(provider, currentSettings, ollamaEndpoint, ollamaModel)
          provider = result.provider
          ollamaEndpoint = result.ollamaEndpoint
          ollamaModel = result.ollamaModel
          banner = result.message
          break
        }
        case 'language':
          language = await handleLanguageAction(language)
          break
        case 'tone':
          tone = await handleToneAction(tone)
          break
        case 'save':
          await handleSaveAction({ ...currentSettings, language, tone, provider, ollamaEndpoint, ollamaModel })
          return await router.showHome()
        case 'back':
          return await router.showHome()
      }
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }

  await router.showHome()
}
