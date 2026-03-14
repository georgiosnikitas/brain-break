import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { listDomains, readDomain, type DomainListEntry } from '../domain/store.js'
import { dim, bold, error as errorFmt } from '../utils/format.js'
import * as router from '../router.js'
import type { Result } from '../domain/schema.js'

export type HomeEntry = { slug: string; score: number; totalQuestions: number }

export type HomeAction =
  | { action: 'select'; slug: string }
  | { action: 'create' }
  | { action: 'archived' }
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
  }

  choices.push(
    { name: '➕  Create new domain', value: { action: 'create' } },
    { name: '🗄  View archived domains', value: { action: 'archived' } },
    new Separator(),
    { name: '🚪  Exit', value: { action: 'exit' } },
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

async function handleHomeAction(answer: HomeAction): Promise<void> {
  if (answer.action === 'exit') process.exit(0)
  if (answer.action === 'select') await router.showDomainMenu(answer.slug)
  if (answer.action === 'create') await router.showCreateDomain()
  if (answer.action === 'archived') await router.showArchived()
}

export async function showHomeScreen(): Promise<void> {
  while (true) {
    const listResult = await listDomains()
    const homeEntries = await loadHomeEntries(listResult)

    let answer: HomeAction
    try {
      answer = await select<HomeAction>({
        message: '🧠 brain-break',
        choices: buildHomeChoices(homeEntries),
        pageSize: 20,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) process.exit(0)
      throw err
    }

    await handleHomeAction(answer)
  }
}
