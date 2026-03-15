import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readSettings, writeSettings } from '../domain/store.js'
import type { ToneOfVoice } from '../domain/schema.js'
import { clearScreen } from '../utils/screen.js'
import * as router from '../router.js'

const TONE_CHOICES: Array<{ name: string; value: ToneOfVoice }> = [
  { name: 'Normal', value: 'normal' },
  { name: 'Enthusiastic', value: 'enthusiastic' },
  { name: 'Robot', value: 'robot' },
  { name: 'Pirate', value: 'pirate' },
]

export async function showSettingsScreen(): Promise<void> {
  clearScreen()

  const settingsResult = await readSettings()
  const current = settingsResult.ok ? settingsResult.data : { language: 'English', tone: 'normal' as ToneOfVoice }

  try {
    const language = await input({
      message: 'Question Language',
      default: current.language,
    })

    const tone = await select<ToneOfVoice>({
      message: 'Tone of Voice',
      choices: TONE_CHOICES,
      default: current.tone,
    })

    const nav = await select<'save' | 'back'>({
      message: 'Navigation',
      choices: [
        new Separator(),
        { name: '💾  Save', value: 'save' as const },
        { name: '←  Back', value: 'back' as const },
      ],
    })

    if (nav === 'save') {
      const result = await writeSettings({ language, tone })
      if (!result.ok) {
        console.error(`Failed to save settings: ${result.error}`)
      }
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }

  await router.showHome()
}
