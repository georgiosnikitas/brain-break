import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, PROVIDER_CHOICES, PROVIDER_LABELS, type AiProviderType, type ToneOfVoice, type SettingsFile } from '../domain/schema.js'
import { menuTheme, success, warn, header } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { promptForProviderSettings, testAndReport } from './provider-settings.js'
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

type SettingsAction = 'provider' | 'language' | 'tone' | 'asciiArtMilestone' | 'showWelcome' | 'save' | 'back'

const MILESTONE_CHOICES: Array<{ name: string; value: 0 | 10 | 100 }> = [
  { name: 'Instant (0 questions)', value: 0 },
  { name: 'Quick (10 questions)', value: 10 },
  { name: 'Classic (100 questions)', value: 100 },
]

const MILESTONE_LABELS: Record<number, string> = { 0: 'Instant', 10: 'Quick', 100: 'Classic' }
const SETTINGS_PAGE_SIZE = 10

export function getProviderLabel(provider: AiProviderType | null, settings?: SettingsFile): string {
  if (!provider) return 'Not set'
  const label = PROVIDER_LABELS[provider]
  if (!settings) return label
  const modelMap: Record<AiProviderType, string> = {
    copilot: '',
    openai: settings.openaiModel,
    anthropic: settings.anthropicModel,
    gemini: settings.geminiModel,
    ollama: settings.ollamaModel,
  }
  const model = modelMap[provider]
  return model ? `${label} (${model})` : label
}

async function handleProviderAction(
  provider: AiProviderType | null,
  settings: SettingsFile,
  openaiModel: string,
  anthropicModel: string,
  geminiModel: string,
  ollamaEndpoint: string,
  ollamaModel: string,
) {
  const selectedProvider = await select<AiProviderType | 'back'>({
    message: 'AI Provider',
    choices: [
      ...PROVIDER_CHOICES,
      new Separator(),
      { name: '↩️  Back', value: 'back' as const },
    ],
    default: provider ?? undefined,
    theme: menuTheme,
    pageSize: SETTINGS_PAGE_SIZE,
  })

  if (selectedProvider === 'back') {
    return { ...settings, provider, openaiModel, anthropicModel, geminiModel, ollamaEndpoint, ollamaModel, message: '' }
  }

  const updatedSettings = await promptForProviderSettings(selectedProvider, {
    ...settings,
    provider: selectedProvider,
    openaiModel,
    anthropicModel,
    geminiModel,
    ollamaEndpoint,
    ollamaModel,
  })

  const message = await testAndReport(selectedProvider, updatedSettings)

  return { ...updatedSettings, message }
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
    pageSize: SETTINGS_PAGE_SIZE,
  })
}

async function handleSaveAction(settings: SettingsFile): Promise<void> {
  const result = await writeSettings(settings)
  if (!result.ok) {
    console.error(`Failed to save settings: ${result.error}`)
  }
}

async function selectSettingsAction(
  provider: AiProviderType | null,
  language: string,
  tone: ToneOfVoice,
  asciiArtMilestone: 0 | 10 | 100,
  showWelcome: boolean,
  settings: SettingsFile,
): Promise<SettingsAction> {
  return select<SettingsAction>({
    message: 'Choose a setting:',
    choices: [
      { name: `🤖 AI Provider:   ${getProviderLabel(provider, settings)}`, value: 'provider' as const },
      { name: `🌍 Language:      ${language}`, value: 'language' as const },
      { name: `🎭 Tone of Voice: ${TONE_LABELS[tone]}`, value: 'tone' as const },
      { name: `🎨 ASCII Art Milestone: ${MILESTONE_LABELS[asciiArtMilestone]}`, value: 'asciiArtMilestone' as const },
      { name: `🎬 Welcome & Exit screen: ${showWelcome ? 'ON' : 'OFF'}`, value: 'showWelcome' as const },
      new Separator(),
      { name: '💾 Save', value: 'save' as const },
      { name: '↩️  Back', value: 'back' as const },
    ],
    theme: menuTheme,
    pageSize: SETTINGS_PAGE_SIZE,
  })
}

export async function showSettingsScreen(): Promise<void> {
  const settingsResult = await readSettings()
  const currentSettings = settingsResult.ok ? settingsResult.data : defaultSettings()
  
  let language = currentSettings.language
  let tone = currentSettings.tone
  let provider = currentSettings.provider
  let openaiModel = currentSettings.openaiModel
  let anthropicModel = currentSettings.anthropicModel
  let geminiModel = currentSettings.geminiModel
  let ollamaEndpoint = currentSettings.ollamaEndpoint
  let ollamaModel = currentSettings.ollamaModel
  let showWelcome = currentSettings.showWelcome
  let asciiArtMilestone = currentSettings.asciiArtMilestone
  let banner = ''

  try {
    while (true) {
      clearAndBanner()
      console.log(header('⚙️  Settings'))
      if (banner) {
        console.log(banner + '\n')
        banner = ''
      }
      
        const liveSettings: SettingsFile = { ...currentSettings, provider, language, tone, openaiModel, anthropicModel, geminiModel, ollamaEndpoint, ollamaModel, showWelcome, asciiArtMilestone }
        const action = await selectSettingsAction(provider, language, tone, asciiArtMilestone, showWelcome, liveSettings)

      switch (action) {
        case 'provider': {
          const result = await handleProviderAction(
            provider,
            currentSettings,
            openaiModel,
            anthropicModel,
            geminiModel,
            ollamaEndpoint,
            ollamaModel,
          )
          provider = result.provider
          openaiModel = result.openaiModel
          anthropicModel = result.anthropicModel
          geminiModel = result.geminiModel
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
        case 'showWelcome':
          showWelcome = !showWelcome
          banner = showWelcome ? success('Welcome & Exit screen enabled') : warn('Welcome & Exit screen disabled')
          break
        case 'asciiArtMilestone': {
          const selectedMilestone = await select<0 | 10 | 100 | 'back'>({
            message: 'ASCII Art Milestone',
            choices: [
              ...MILESTONE_CHOICES,
              new Separator(),
              { name: '↩️  Back', value: 'back' as const },
            ],
            default: asciiArtMilestone,
            theme: menuTheme,
            pageSize: SETTINGS_PAGE_SIZE,
          })
          if (selectedMilestone === 'back') {
            break
          }
          asciiArtMilestone = selectedMilestone
          banner = success(`ASCII Art Milestone set to ${MILESTONE_LABELS[asciiArtMilestone]}`)
          break
        }
        case 'save':
          await handleSaveAction({
            ...currentSettings,
            language,
            tone,
            provider,
            openaiModel,
            anthropicModel,
            geminiModel,
            ollamaEndpoint,
            ollamaModel,
            asciiArtMilestone,
            showWelcome,
          })
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
