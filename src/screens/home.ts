import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { listDomains, readDomain, readSettings, type DomainListEntry } from '../domain/store.js'
import { defaultSettings } from '../domain/schema.js'
import { dim, bold, error as errorFmt, menuTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'
import type { Result } from '../domain/schema.js'
import qrcode from 'qrcode-terminal'

const COFFEE_URL = 'https://www.buymeacoffee.com/georgiosnikitas'

export type HomeEntry = { slug: string; score: number; totalQuestions: number }

export type HomeAction =
  | { action: 'select'; slug: string }
  | { action: 'create' }
  | { action: 'archived' }
  | { action: 'settings' }
  | { action: 'coffee' }
  | { action: 'exit' }

export function filterActiveDomains(
  entries: DomainListEntry[],
): Extract<DomainListEntry, { corrupted: false }>[] {
  return entries.filter(
    (e): e is Extract<DomainListEntry, { corrupted: false }> => !e.corrupted && !e.meta.archived,
  )
}

export function buildHomeChoices(
  entries: HomeEntry[],
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
    { name: '🍵 Buy me a coffee', value: { action: 'coffee' } },
    { name: '🚪 Exit', value: { action: 'exit' } },
  )

  return choices
}

async function loadHomeEntries(
  listResult: Awaited<Result<DomainListEntry[]>>,
): Promise<HomeEntry[]> {
  if (listResult.ok) {
    const activeEntries = filterActiveDomains(listResult.data)
    return Promise.all(
      activeEntries.map(async (entry) => {
        const r = await readDomain(entry.slug)
        return {
          slug: entry.slug,
          score: r.ok ? r.data.meta.score : entry.meta.score,
          totalQuestions: r.ok ? r.data.history.length : 0,
        }
      }),
    )
  }
  console.error(errorFmt(`Failed to load domains: ${listResult.error}`))
  return []
}

async function handleHomeAction(answer: HomeAction, homeEntries: HomeEntry[], listResult: Awaited<Result<DomainListEntry[]>>): Promise<void> {
  if (answer.action === 'exit') {
    const settingsResult = await readSettings()
    const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
    if (settings.showWelcome) {
      let totalQuestions = homeEntries.reduce((sum, e) => sum + e.totalQuestions, 0)
      if (listResult.ok) {
        const archivedEntries = listResult.data.filter(
          (e): e is Extract<DomainListEntry, { corrupted: false }> => !e.corrupted && e.meta.archived,
        )
        const archivedCounts = await Promise.all(
          archivedEntries.map(async (e) => {
            const r = await readDomain(e.slug)
            return r.ok ? r.data.history.length : 0
          }),
        )
        totalQuestions += archivedCounts.reduce((sum, n) => sum + n, 0)
      }
      await router.showExit(totalQuestions)
    }
    process.exit(0)
  }
  if (answer.action === 'select') await router.showDomainMenu(answer.slug)
  if (answer.action === 'create') await router.showCreateDomain()
  if (answer.action === 'archived') await router.showArchived()
  if (answer.action === 'settings') await router.showSettings()
  if (answer.action === 'coffee') await showCoffeeScreen()
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

export async function showHomeScreen(): Promise<void> {
  while (true) {
    clearAndBanner()
    const listResult = await listDomains()
    const homeEntries = await loadHomeEntries(listResult)

    let answer: HomeAction
    try {
      answer = await select<HomeAction>({
        message: '👨‍💻 Choose a domain:',
        choices: buildHomeChoices(homeEntries),
        pageSize: 20,
        theme: menuTheme,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) process.exit(0)
      throw err
    }

    await handleHomeAction(answer, homeEntries, listResult)
  }
}
