import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, type ToneOfVoice } from '../domain/schema.js'
import { menuTheme } from '../utils/format.js'
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

type SettingsAction = 'language' | 'tone' | 'save' | 'back'

export async function showSettingsScreen(): Promise<void> {
  clearScreen()

  const settingsResult = await readSettings()
  const currentSettings = settingsResult.ok ? settingsResult.data : defaultSettings()
  let language = currentSettings.language
  let tone: ToneOfVoice = currentSettings.tone

  try {
    while (true) {
      const action = await select<SettingsAction>({
        message: 'Settings',
        choices: [
          { name: `Language:      ${language}`, value: 'language' as const },
          { name: `Tone of Voice: ${TONE_LABELS[tone]}`, value: 'tone' as const },
          new Separator(),
          { name: '💾  Save', value: 'save' as const },
          { name: '←  Back', value: 'back' as const },
        ],
        theme: menuTheme,
      })

      if (action === 'language') {
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
        const result = await writeSettings({ ...currentSettings, language, tone })
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
