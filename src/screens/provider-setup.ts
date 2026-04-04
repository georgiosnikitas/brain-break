import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { writeSettings } from '../domain/store.js'
import { PROVIDER_CHOICES, type AiProviderType, type SettingsFile } from '../domain/schema.js'
import { menuTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { promptForProviderSettings, testAndReport } from './provider-settings.js'

const MESSAGE_DISPLAY_MS = 2000

export async function showProviderSetupScreen(settings: SettingsFile): Promise<void> {
  clearAndBanner()
  console.log('\n🔧 First-Time Setup\n')
  console.log('Select your preferred AI provider to get started.\n')

  try {
    const provider = await select<AiProviderType>({
      message: 'AI Provider',
      choices: PROVIDER_CHOICES,
      theme: menuTheme,
    })

    const updatedSettings = await promptForProviderSettings(provider, settings)

    const message = await testAndReport(provider, updatedSettings)
    console.log(`\n${message}`)

    await new Promise(resolve => setTimeout(resolve, MESSAGE_DISPLAY_MS))

    const writeResult = await writeSettings(updatedSettings)
    if (!writeResult.ok) {
      console.error(`Failed to save settings: ${writeResult.error}`)
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}
