import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import qrcode from 'qrcode-terminal'
import { deactivateLicense, type LicenseErrorKind } from '../domain/license-client.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, type LicenseRecord, type SettingsFile } from '../domain/schema.js'
import { clearAndBanner } from '../utils/screen.js'
import { bold, header, menuTheme, success, error as errorFmt, dim } from '../utils/format.js'
import * as router from '../router.js'

const ORDERS_URL = 'https://app.lemonsqueezy.com/my-orders'

const DEACTIVATION_ERROR_MESSAGES: Record<LicenseErrorKind, string> = {
  network: 'Could not reach the licensing server. Deactivation failed — try again when online.',
  unknown_api_error: 'Could not reach the licensing server. Deactivation failed — try again when online.',
  invalid_key: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
  revoked: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
  limit_reached: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
  product_mismatch: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
}

type Action = 'deactivate' | 'reactivate' | 'orders' | 'back'

export function maskKey(key: string): string {
  if (key.length < 8) return '****'
  return key.slice(0, 4) + '…' + key.slice(-4)
}

export function formatActivatedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function renderUrlScreen(title: string, url: string): Promise<void> {
  clearAndBanner()
  console.log(header(title))
  console.log('')
  await new Promise<void>((resolve) => {
    qrcode.generate(url, { small: true }, (code) => {
      const indented = code.split('\n').map((line) => `  ${line}`).join('\n')
      console.log(indented)
      resolve()
    })
  })
  console.log(`\n  ${url}\n`)
  await awaitBackPrompt('↩️  Back')
}

async function awaitBackPrompt(label: string): Promise<void> {
  try {
    await select({
      message: 'Navigation',
      choices: [new Separator(), { name: label, value: 'back' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}

function renderFields(license: LicenseRecord): void {
  const statusLabel = license.status === 'active' ? success('Active') : errorFmt('Inactive')
  console.log('  📛 ' + bold('Status:') + ' ' + statusLabel)
  console.log('  🔑 ' + bold('License key:') + ' ' + maskKey(license.key))
  console.log('  📅 ' + bold('Activated:') + ' ' + formatActivatedAt(license.activatedAt))
  console.log('  💻 ' + bold('Instance:') + ' ' + license.instanceName)
  console.log('  📦 ' + bold('Product:') + ' ' + license.productName)
  console.log('  🏬 ' + bold('Store:') + ' ' + license.storeName)
  if (license.status === 'inactive') {
    console.log('\n  ' + dim('This license was deactivated or could not be validated. Activate again to unlock unlimited domains.'))
  }
  console.log('')
}

function buildChoices(license: LicenseRecord): ReadonlyArray<{ name: string; value: Action } | Separator> {
  const primary = license.status === 'active'
    ? { name: '🔌 Deactivate', value: 'deactivate' as Action }
    : { name: '🔑 Re-activate', value: 'reactivate' as Action }
  return [
    primary,
    { name: '🔛 Manage your keys', value: 'orders' as Action },
    new Separator(),
    { name: '↩️  Back', value: 'back' as Action },
  ]
}

async function promptAction(license: LicenseRecord): Promise<Action | null> {
  try {
    return await select<Action>({
      message: 'Choose an action',
      choices: buildChoices(license),
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function promptConfirmDeactivate(): Promise<'cancel' | 'confirm' | null> {
  try {
    return await select<'cancel' | 'confirm'>({
      message: "Deactivate this license? You'll be limited to 1 domain again. Existing domains beyond the cap remain readable but you won't be able to create new ones until you re-activate.",
      choices: [
        { name: 'Yes, deactivate', value: 'confirm' },
        new Separator(),
        { name: '↩️  Back', value: 'cancel' },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function removeLicenseFromSettings(): Promise<boolean> {
  const cur = await readSettings()
  const s = cur.ok ? cur.data : defaultSettings()
  const { license: _omit, ...rest } = s
  const updated: SettingsFile = rest
  const w = await writeSettings(updated)
  return w.ok
}

type DeactivateOutcome =
  | { type: 'cancelled' }
  | { type: 'done' }
  | { type: 'error'; message: string }

async function runDeactivateFlow(license: LicenseRecord): Promise<DeactivateOutcome> {
  const confirm = await promptConfirmDeactivate()
  if (confirm === null || confirm === 'cancel') return { type: 'cancelled' }

  const spinner = ora('Deactivating license…').start()
  let result: Awaited<ReturnType<typeof deactivateLicense>>
  try {
    result = await deactivateLicense(license.key, license.instanceId)
  } finally {
    spinner.stop()
  }

  if (!result.ok) {
    return { type: 'error', message: DEACTIVATION_ERROR_MESSAGES[result.error.kind] }
  }

  const saved = await removeLicenseFromSettings()
  if (!saved) {
    return { type: 'error', message: 'Could not save settings after deactivation. Local state may be inconsistent.' }
  }
  console.log('\n  ' + success('License deactivated.') + '\n')
  await awaitBackPrompt('↩️  Back')
  return { type: 'done' }
}

type IterationResult = { type: 'continue'; inlineError: string | null } | { type: 'done' }

async function runLicenseAction(action: Action, license: LicenseRecord): Promise<IterationResult> {
  if (action === 'back') return { type: 'done' }
  if (action === 'orders') {
    await renderUrlScreen('🔛 Manage your keys', ORDERS_URL)
    return { type: 'continue', inlineError: null }
  }
  if (action === 'reactivate') {
    await router.showActivateLicense()
    return { type: 'continue', inlineError: null }
  }
  const outcome = await runDeactivateFlow(license)
  if (outcome.type === 'done') return { type: 'done' }
  return { type: 'continue', inlineError: outcome.type === 'error' ? outcome.message : null }
}

export async function showLicenseInfoScreen(): Promise<void> {
  let inlineError: string | null = null

  while (true) {
    clearAndBanner()
    console.log(header('🔑 License Info'))
    console.log('')

    const cur = await readSettings()
    const settings = cur.ok ? cur.data : defaultSettings()
    const license = settings.license

    if (!license) {
      console.log('  No license on this machine. Use Activate License from the home menu.\n')
      await awaitBackPrompt('↩️  Back')
      return
    }

    renderFields(license)

    if (inlineError) {
      console.log('  ' + errorFmt(inlineError) + '\n')
      inlineError = null
    }

    const action = await promptAction(license)
    if (action === null) return

    const next = await runLicenseAction(action, license)
    if (next.type === 'done') return
    inlineError = next.inlineError
  }
}
