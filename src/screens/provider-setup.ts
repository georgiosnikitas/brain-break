import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { testProviderConnection } from '../ai/providers.js'
import { writeSettings } from '../domain/store.js'
import { PROVIDER_CHOICES, PROVIDER_LABELS, type AiProviderType, type SettingsFile } from '../domain/schema.js'
import { menuTheme, success, warn } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { promptForProviderSettings } from './provider-settings.js'

const MESSAGE_DISPLAY_MS = 2000

async function saveSettings(settingsToSave: SettingsFile) {
  const writeResult = await writeSettings(settingsToSave)
  if (!writeResult.ok) {
    console.error(`Failed to save settings: ${writeResult.error}`)
  }
}

export async function showProviderSetupScreen(settings: SettingsFile): Promise<boolean> {
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      clearAndBanner()
      console.log('\n🔧 First-Time Setup\n')
      console.log('Select your preferred AI provider to get started.\n')

      const provider = await select<AiProviderType | 'skip'>({
        message: 'AI Provider',
        choices: [
          ...PROVIDER_CHOICES,
          new Separator(),
          { name: '⏭️  Skip — set up later in ⚙️  Settings', value: 'skip' as const },
        ],
        theme: menuTheme,
      })

      if (provider === 'skip') {
        await saveSettings({ ...settings })
        return true
      }

      const updatedSettings = await promptForProviderSettings(provider, settings)
      const result = await runConnectionTest(provider, updatedSettings)

      if (!result.ok) {
        console.log(`\n${warn(result.error)}`)

        const action = await select<'retry' | 'skip'>({
          message: 'What would you like to do?',
          choices: [
            { name: '🔄 Retry', value: 'retry' as const },
            new Separator(),
            { name: '⏭️  Skip — set up later in ⚙️  Settings', value: 'skip' as const },
          ],
          theme: menuTheme,
        })

        if (action === 'skip') {
          await saveSettings({ ...updatedSettings, provider: null })
          return true
        }

        continue
      }

      const providerLabel = PROVIDER_LABELS[provider]
      const successTextParts = ['✓', providerLabel + ':', result.data]
      const successMessage = success(successTextParts.join(' '))
      console.log(`\n${successMessage}`)
      await new Promise(resolve => setTimeout(resolve, MESSAGE_DISPLAY_MS))

      await saveSettings(updatedSettings)
      return false
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
    return false
  }
}

async function runConnectionTest(
  provider: AiProviderType,
  settings: SettingsFile,
) {
  const spinner = ora('Testing connection...').start()
  const result = await testProviderConnection(provider, settings)
  spinner.stop()
  return result
}
