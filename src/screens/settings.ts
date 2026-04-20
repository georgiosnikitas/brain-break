import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { testProviderConnection } from '../ai/providers.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, PROVIDER_CHOICES, PROVIDER_LABELS, type AiProviderType, type AsciiArtMilestone, type MyCoachScope, type ToneOfVoice, type SettingsFile, type Theme } from '../domain/schema.js'
import { menuTheme, success, warn, header, setTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { promptForProviderSettings } from './provider-settings.js'
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

type SettingsAction = 'provider' | 'language' | 'tone' | 'myCoachScope' | 'asciiArtMilestone' | 'theme' | 'showWelcome' | 'save' | 'back'

const THEME_LABELS: Record<Theme, string> = { dark: 'Dark', light: 'Light' }

const MILESTONE_CHOICES: Array<{ name: string; value: AsciiArtMilestone }> = [
  { name: 'Instant (0 questions)', value: 0 },
  { name: 'Quick (10 questions)', value: 10 },
  { name: 'Classic (100 questions)', value: 100 },
]

const MILESTONE_LABELS: Record<number, string> = { 0: 'Instant', 10: 'Quick', 100: 'Classic' }

const MY_COACH_SCOPE_CHOICES: Array<{ name: string; value: MyCoachScope }> = [
  { name: 'Recent (25 questions)', value: '25' },
  { name: 'Extended (100 questions)', value: '100' },
  { name: 'Complete (all questions)', value: 'all' },
]

const MY_COACH_SCOPE_LABELS: Record<string, string> = { '25': 'Recent', '100': 'Extended', 'all': 'Complete' }
const SETTINGS_PAGE_SIZE = 10

export function getProviderLabel(provider: AiProviderType | null): string {
  return provider ? PROVIDER_LABELS[provider] : 'Not set'
}

async function handleProviderAction(
  provider: AiProviderType | null,
  localSettings: SettingsFile,
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
    return { ...localSettings, provider, message: '' }
  }

  const updatedSettings = await promptForProviderSettings(selectedProvider, {
    ...localSettings,
    provider: selectedProvider,
  })

  if (!updatedSettings) {
    return { ...localSettings, provider, message: '' }
  }

  const spinner = ora('Testing connection...').start()
  const validationResult = await testProviderConnection(selectedProvider, updatedSettings)
  spinner.stop()

  const message = validationResult.ok
    ? success(`✓ ${PROVIDER_LABELS[selectedProvider]}: ${validationResult.data}`)
    : warn(validationResult.error)

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

async function handleMyCoachScopeAction(current: MyCoachScope): Promise<{ value: MyCoachScope; banner: string }> {
  const selectedScope = await select<MyCoachScope | 'back'>({
    message: 'My Coach Scope',
    choices: [
      ...MY_COACH_SCOPE_CHOICES,
      new Separator(),
      { name: '↩️  Back', value: 'back' as const },
    ],
    default: current,
    theme: menuTheme,
    pageSize: SETTINGS_PAGE_SIZE,
  })
  if (selectedScope === 'back') {
    return { value: current, banner: '' }
  }
  return { value: selectedScope, banner: success(`My Coach Scope set to ${MY_COACH_SCOPE_LABELS[selectedScope]}`) }
}

async function selectSettingsAction(
  provider: AiProviderType | null,
  language: string,
  tone: ToneOfVoice,
  myCoachScope: MyCoachScope,
  asciiArtMilestone: AsciiArtMilestone,
  theme: Theme,
  showWelcome: boolean,
): Promise<SettingsAction> {
  return select<SettingsAction>({
    message: 'Choose a setting:',
    choices: [
      { name: `🤖 AI Provider:   ${getProviderLabel(provider)}`, value: 'provider' as const },
      { name: `🌍 Language:      ${language}`, value: 'language' as const },
      { name: `🎭 Tone of Voice: ${TONE_LABELS[tone]}`, value: 'tone' as const },
      { name: `🏋️  My Coach Scope: ${MY_COACH_SCOPE_LABELS[myCoachScope]}`, value: 'myCoachScope' as const },
      { name: `🎨 ASCII Art Milestone: ${MILESTONE_LABELS[asciiArtMilestone]}`, value: 'asciiArtMilestone' as const },
      { name: `🌓 Theme:         ${THEME_LABELS[theme]}`, value: 'theme' as const },
      { name: `🎬 Welcome & Exit screen: ${showWelcome ? 'ON' : 'OFF'}`, value: 'showWelcome' as const },
      new Separator(),
      { name: '💾 Save', value: 'save' as const },
      { name: '↩️  Back', value: 'back' as const },
    ],
    theme: menuTheme,
    pageSize: SETTINGS_PAGE_SIZE,
  })
}

function toggleTheme(current: Theme): { theme: Theme; banner: string } {
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  return { theme: next, banner: success(`Theme set to ${THEME_LABELS[next]}`) }
}

function toggleShowWelcome(current: boolean): { showWelcome: boolean; banner: string } {
  const next = !current
  return { showWelcome: next, banner: next ? success('Welcome & Exit screen enabled') : warn('Welcome & Exit screen disabled') }
}

async function handleAsciiArtMilestoneAction(current: AsciiArtMilestone): Promise<{ value: AsciiArtMilestone; banner: string }> {
  const selectedMilestone = await select<AsciiArtMilestone | 'back'>({
    message: 'ASCII Art Milestone',
    choices: [
      ...MILESTONE_CHOICES,
      new Separator(),
      { name: '↩️  Back', value: 'back' as const },
    ],
    default: current,
    theme: menuTheme,
    pageSize: SETTINGS_PAGE_SIZE,
  })
  if (selectedMilestone === 'back') {
    return { value: current, banner: '' }
  }
  return { value: selectedMilestone, banner: success(`ASCII Art Milestone set to ${MILESTONE_LABELS[selectedMilestone]}`) }
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
  let openaiCompatibleEndpoint = currentSettings.openaiCompatibleEndpoint
  let openaiCompatibleModel = currentSettings.openaiCompatibleModel
  let showWelcome = currentSettings.showWelcome
  let asciiArtMilestone = currentSettings.asciiArtMilestone
  let myCoachScope = currentSettings.myCoachScope
  let theme = currentSettings.theme
  let banner = ''

  try {
    while (true) {
      clearAndBanner()
      console.log(header('⚙️  Settings'))
      if (banner) console.log(banner + '\n')
      banner = ''
      
        const action = await selectSettingsAction(provider, language, tone, myCoachScope, asciiArtMilestone, theme, showWelcome)

      switch (action) {
        case 'provider': {
          const result = await handleProviderAction(
            provider,
            {
              ...currentSettings,
              openaiModel,
              anthropicModel,
              geminiModel,
              ollamaEndpoint,
              ollamaModel,
              openaiCompatibleEndpoint,
              openaiCompatibleModel,
            },
          )
          provider = result.provider
          openaiModel = result.openaiModel
          anthropicModel = result.anthropicModel
          geminiModel = result.geminiModel
          ollamaEndpoint = result.ollamaEndpoint
          ollamaModel = result.ollamaModel
          openaiCompatibleEndpoint = result.openaiCompatibleEndpoint
          openaiCompatibleModel = result.openaiCompatibleModel
          banner = result.message
          break
        }
        case 'language':
          language = await handleLanguageAction(language)
          break
        case 'tone':
          tone = await handleToneAction(tone)
          break
        case 'theme': {
          const themeResult = toggleTheme(theme)
          theme = themeResult.theme
          banner = themeResult.banner
          break
        }
        case 'showWelcome': {
          const welcomeResult = toggleShowWelcome(showWelcome)
          showWelcome = welcomeResult.showWelcome
          banner = welcomeResult.banner
          break
        }
        case 'myCoachScope': {
          const scopeResult = await handleMyCoachScopeAction(myCoachScope)
          myCoachScope = scopeResult.value
          if (scopeResult.banner) banner = scopeResult.banner
          break
        }
        case 'asciiArtMilestone': {
          const milestoneResult = await handleAsciiArtMilestoneAction(asciiArtMilestone)
          asciiArtMilestone = milestoneResult.value
          if (milestoneResult.banner) banner = milestoneResult.banner
          break
        }
        case 'save': {
          const settings: SettingsFile = {
            ...currentSettings,
            language,
            tone,
            provider,
            openaiModel,
            anthropicModel,
            geminiModel,
            ollamaEndpoint,
            ollamaModel,
            openaiCompatibleEndpoint,
            openaiCompatibleModel,
            asciiArtMilestone,
            myCoachScope,
            theme,
            showWelcome,
          }
          await handleSaveAction(settings)
          setTheme(theme)
          return await router.showHome()
        }
        case 'back':
          return await router.showHome()
      }
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }

  await router.showHome()
}
