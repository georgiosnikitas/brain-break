import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { testProviderConnection } from '../ai/providers.js'
import { writeSettings } from '../domain/store.js'
import { PROVIDER_CHOICES, PROVIDER_LABELS, type AiProviderType, type SettingsFile } from '../domain/schema.js'
import { menuTheme, success, warn } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { promptForProviderSettings } from './provider-settings.js'

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

    const spinner = ora('Testing connection...').start()
    const validationResult = await testProviderConnection(provider, updatedSettings)
    spinner.stop()

    if (validationResult.ok) {
      console.log(success(`\n✓ ${PROVIDER_LABELS[provider]}: ${validationResult.data}`))
    } else {
      console.log(warn(`\n${validationResult.error}`))
    }

    await new Promise(resolve => setTimeout(resolve, MESSAGE_DISPLAY_MS))

    const writeResult = await writeSettings(updatedSettings)
    if (!writeResult.ok) {
      console.error(`Failed to save settings: ${writeResult.error}`)
    }
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}
