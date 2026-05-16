import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import qrcode from 'qrcode-terminal'
import { activateLicense, type LicenseErrorKind } from '../domain/license-client.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, type LicenseRecord } from '../domain/schema.js'
import { menuTheme, success, error as errorFmt } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'

const ORDERS_URL = 'https://app.lemonsqueezy.com/my-orders'
const CHECKOUT_URL = 'https://georgiosnikitas.lemonsqueezy.com/checkout/buy/8581b2a9-5a89-45af-9367-d93acb044147'

const LICENSE_ERROR_MESSAGES: Record<LicenseErrorKind, string> = {
  invalid_key: 'License key not recognized. Check the key and try again.',
  product_mismatch: 'This license key is not valid for brain-break.',
  revoked: 'This license has been revoked or refunded and can no longer be used.',
  limit_reached: 'This license has reached its activation limit. Deactivate it on another device or buy an additional seat.',
  network: 'Could not reach the licensing server. Check your connection and try again.',
  unknown_api_error: 'Could not reach the licensing server. Check your connection and try again.',
}

type Action = 'paste' | 'orders' | 'checkout' | 'back'
type PasteOutcome =
  | { type: 'continue'; inlineError?: string; inlineNotice?: string }
  | { type: 'done' }

function renderHeader(inlineError: string | null, inlineNotice: string | null): void {
  clearAndBanner()
  console.log('\n  🔑 Activate License\n')
  console.log('  Activate your license to unlock unlimited domains. Free tier is limited to 1 domain.\n')
  if (inlineError) console.log(`  ${errorFmt(inlineError)}\n`)
  if (inlineNotice) console.log(`  ${inlineNotice}\n`)
}

async function activateWithSpinner(key: string): Promise<Awaited<ReturnType<typeof activateLicense>>> {
  const spinner = ora('Activating license…').start()
  try {
    return await activateLicense(key)
  } finally {
    spinner.stop()
  }
}

async function promptAction(): Promise<Action | null> {
  try {
    return await select<Action>({
      message: 'Choose an action',
      choices: [
        { name: '📋 Paste license key', value: 'paste' },
        { name: '🔛 Manage your keys', value: 'orders' },
        { name: '💳 Buy a license', value: 'checkout' },
        new Separator(),
        { name: '↩️  Back', value: 'back' },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function promptLicenseKey(): Promise<string | null> {
  try {
    return (await input({ message: 'License key:', theme: menuTheme })).trim()
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function persistLicense(license: LicenseRecord): Promise<boolean> {
  const currentSettings = await readSettings()
  const settings = currentSettings.ok ? currentSettings.data : defaultSettings()
  settings.license = license
  const writeResult = await writeSettings(settings)
  return writeResult.ok
}

async function handlePasteAction(): Promise<PasteOutcome> {
  const key = await promptLicenseKey()
  if (key === null) return { type: 'continue' }
  if (key === '') return { type: 'continue', inlineNotice: 'No key entered.' }

  const result = await activateWithSpinner(key)
  if (!result.ok) {
    return { type: 'continue', inlineError: LICENSE_ERROR_MESSAGES[result.error.kind] }
  }

  const didPersist = await persistLicense(result.data)
  if (!didPersist) {
    return { type: 'continue', inlineError: 'Activation succeeded but could not save settings. Please try again.' }
  }

  console.log(`\n  ${success('License activated successfully. Unlimited domains unlocked.')}\n`)
  await confirmSuccess()
  return { type: 'done' }
}

async function renderUrlScreen(title: string, url: string): Promise<void> {
  clearAndBanner()
  console.log(`\n  ${title}\n`)
  await new Promise<void>((resolve) => {
    qrcode.generate(url, { small: true }, (code) => {
      const indented = code.split('\n').map((line) => `  ${line}`).join('\n')
      console.log(indented)
      resolve()
    })
  })
  console.log(`\n  ${url}\n`)
  try {
    await select({
      message: 'Navigation',
      choices: [new Separator(), { name: '↩️  Back', value: 'back' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}

async function confirmSuccess(): Promise<void> {
  try {
    await select({
      message: 'Navigation',
      choices: [new Separator(), { name: '↩️  Back to home', value: 'home' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}

export async function showActivateLicenseScreen(): Promise<void> {
  let inlineError: string | null = null
  let inlineNotice: string | null = null

  while (true) {
    renderHeader(inlineError, inlineNotice)
    inlineError = null
    inlineNotice = null

    const action = await promptAction()
    if (action === null || action === 'back') return
    if (action === 'orders') {
      await renderUrlScreen('🔛 Manage your keys', ORDERS_URL)
      continue
    }
    if (action === 'checkout') {
      await renderUrlScreen('💳 Buy a license', CHECKOUT_URL)
      continue
    }

    const outcome = await handlePasteAction()
    if (outcome.type === 'done') return
    inlineError = outcome.inlineError ?? null
    inlineNotice = outcome.inlineNotice ?? null
  }
}
