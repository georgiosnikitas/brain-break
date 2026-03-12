import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { listDomains, readDomain, type DomainListEntry } from '../domain/store.js'
import { dim, bold, error as errorFmt } from '../utils/format.js'
import * as router from '../router.js'

export type HomeEntry = { slug: string; score: number; totalQuestions: number }

export type HomeAction =
  | { action: 'select'; slug: string }
  | { action: 'archive'; slug: string }
  | { action: 'history'; slug: string }
  | { action: 'stats'; slug: string }
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
    choices.push({
      name: `${bold(entry.slug)}  ${dim(`score: ${entry.score} · ${entry.totalQuestions} questions`)}`,
      value: { action: 'select', slug: entry.slug },
    })
    choices.push({
      name: `  Archive ${entry.slug}`,
      value: { action: 'archive', slug: entry.slug },
    })
    choices.push({
      name: `  View History ${entry.slug}`,
      value: { action: 'history', slug: entry.slug },
    })
    choices.push({
      name: `  View Stats ${entry.slug}`,
      value: { action: 'stats', slug: entry.slug },
    })
  }

  if (entries.length > 0) {
    choices.push(new Separator())
  }

  choices.push({ name: 'Create new domain', value: { action: 'create' } })
  choices.push({ name: 'View archived domains', value: { action: 'archived' } })
  choices.push(new Separator())
  choices.push({ name: 'Exit', value: { action: 'exit' } })

  return choices
}

export async function showHomeScreen(): Promise<void> {
  while (true) {
    const listResult = await listDomains()

    let homeEntries: HomeEntry[] = []

    if (!listResult.ok) {
      console.error(errorFmt(`Failed to load domains: ${listResult.error}`))
    } else {
      const activeEntries = filterActiveDomains(listResult.data)

      homeEntries = await Promise.all(
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

    if (answer.action === 'exit') process.exit(0)
    if (answer.action === 'select') await router.showQuiz(answer.slug)
    if (answer.action === 'archive') await router.archiveDomain(answer.slug)
    if (answer.action === 'history') await router.showHistory(answer.slug)
    if (answer.action === 'stats') await router.showStats(answer.slug)
    if (answer.action === 'create') await router.showCreateDomain()
    if (answer.action === 'archived') await router.showArchived()
  }
}
