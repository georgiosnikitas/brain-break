import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { listDomains, readDomain, readSettings, type DomainListEntry } from '../domain/store.js'
import { defaultSettings } from '../domain/schema.js'
import type { LaunchNotice } from '../domain/license-launch.js'
import { dim, bold, error, menuTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'
import type { Result } from '../domain/schema.js'
import qrcode from 'qrcode-terminal'

const COFFEE_URL = 'https://www.buymeacoffee.com/georgiosnikitas'

export type HomeEntry = { slug: string; score: number; totalQuestions: number }

export function filterDomains(
  entries: DomainListEntry[],
  opts: { archived: boolean },
): Extract<DomainListEntry, { corrupted: false }>[] {
  return entries.filter(
    (e): e is Extract<DomainListEntry, { corrupted: false }> => !e.corrupted && e.meta.archived === opts.archived,
  )
}

/** @deprecated Use filterDomains({ archived: false }) */
export const filterActiveDomains = (entries: DomainListEntry[]) => filterDomains(entries, { archived: false })

export async function loadDomainEntries(
  listResult: Awaited<Result<DomainListEntry[]>>,
  opts: { archived: boolean; logErrors?: boolean },
): Promise<HomeEntry[]> {
  if (!listResult.ok) {
    if (opts.logErrors ?? true) {
      console.error(error(`Failed to load domains: ${listResult.error}`))
    }
    return []
  }
  const filtered = filterDomains(listResult.data, opts)
  return Promise.all(
    filtered.map(async (entry) => {
      const r = await readDomain(entry.slug)
      return {
        slug: entry.slug,
        score: r.ok ? r.data.meta.score : entry.meta.score,
        totalQuestions: r.ok ? r.data.history.length : 0,
      }
    }),
  )
}

export type HomeAction =
  | { action: 'select'; slug: string }
  | { action: 'create' }
  | { action: 'archived' }
  | { action: 'settings' }
  | { action: 'coffee' }
  | { action: 'activateLicense' }
  | { action: 'licenseInfo' }
  | { action: 'exit' }

export function buildHomeChoices(
  entries: HomeEntry[],
  opts: { hasActiveLicense: boolean },
): Array<{ name: string; value: HomeAction } | Separator> {
  const choices: Array<{ name: string; value: HomeAction } | Separator> = []

  for (const entry of entries) {
    const details = dim(`score: ${entry.score} · ${entry.totalQuestions} questions`)
    choices.push({
      name: `${bold(entry.slug)}  ${details}`,
      value: { action: 'select', slug: entry.slug },
    })
  }

  if (entries.length > 0) {
    choices.push(new Separator())
  } else {
    choices.push(new Separator(dim('No domains yet.')), new Separator())
  }

  choices.push(
    { name: '➕ Create new domain', value: { action: 'create' } },
    { name: '🗄  Archived domains', value: { action: 'archived' } },
    { name: '⚙️  Settings', value: { action: 'settings' } },
    new Separator(),
  )

  if (opts.hasActiveLicense) {
    choices.push({ name: '🔑 License Info', value: { action: 'licenseInfo' } })
  } else {
    choices.push(
      { name: '🔑 Activate License', value: { action: 'activateLicense' } },
      { name: '🍵 Buy me a coffee', value: { action: 'coffee' } },
    )
  }

  choices.push({ name: '🚪 Exit', value: { action: 'exit' } })

  return choices
}

async function handleHomeAction(answer: HomeAction, homeEntries: HomeEntry[], listResult: Awaited<Result<DomainListEntry[]>>): Promise<void> {
  if (answer.action === 'exit') {
    const settingsResult = await readSettings()
    const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
    if (settings.showWelcome) {
      let totalQuestions = homeEntries.reduce((sum, e) => sum + e.totalQuestions, 0)
      const archivedEntries = await loadDomainEntries(listResult, { archived: true, logErrors: false })
      totalQuestions += archivedEntries.reduce((sum, e) => sum + e.totalQuestions, 0)
      await router.showExit(totalQuestions)
    }
    process.exit(0)
  }
  if (answer.action === 'select') await router.showDomainMenu(answer.slug)
  if (answer.action === 'create') await router.showCreateDomain()
  if (answer.action === 'archived') await router.showArchived()
  if (answer.action === 'settings') await router.showSettings()
  if (answer.action === 'coffee') await showCoffeeScreen()
  if (answer.action === 'activateLicense') await router.showActivateLicense()
  if (answer.action === 'licenseInfo') await router.showLicenseInfo()
}

export async function showCoffeeScreen(): Promise<void> {
  clearAndBanner()
  console.log('\n  🍵 Enjoying brain-break? Buy me a coffee!\n')
  console.log('  Scan the QR code with your phone:\n')
  await new Promise<void>((resolve) => {
    qrcode.generate(COFFEE_URL, { small: true }, (code) => {
      const indented = code.split('\n').map((line) => `  ${line}`).join('\n')
      console.log(indented)
      resolve()
    })
  })
  console.log(`\n  ${COFFEE_URL}\n`)
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

export function renderLaunchNotice(notice: LaunchNotice | null): string | null {
  if (notice === 'revoked') return error("Your license is no longer active. You've been returned to the free tier.")
  if (notice === 'offline') return dim('License could not be validated — offline mode')
  return null
}

export async function showHomeScreen(launchNotice: LaunchNotice | null = null): Promise<void> {
  let noticeShown = false

  while (true) {
    clearAndBanner()
    if (launchNotice && !noticeShown) {
      const notice = renderLaunchNotice(launchNotice)
      if (notice) {
        console.log(notice)
        console.log('')
      }
      noticeShown = true
    }

    const settingsResult = await readSettings()
    const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
    const hasActiveLicense = settings.license?.status === 'active'

    const listResult = await listDomains()
    const homeEntries = await loadDomainEntries(listResult, { archived: false })

    let answer: HomeAction
    try {
      answer = await select<HomeAction>({
        message: '👨‍💻 Choose a domain:',
        choices: buildHomeChoices(homeEntries, { hasActiveLicense }),
        pageSize: Math.max(10, homeEntries.length) + 8,
        theme: menuTheme,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) process.exit(0)
      throw err
    }

    await handleHomeAction(answer, homeEntries, listResult)
  }
}
