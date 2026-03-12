import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { listDomains, readDomain, writeDomain, type DomainListEntry } from '../domain/store.js'
import { dim, bold, warn, error as errorFmt } from '../utils/format.js'
import type { HomeEntry } from './home.js'
import type { Result } from '../domain/schema.js'

export type ArchivedAction = { action: 'unarchive'; slug: string } | { action: 'back' }

export function filterArchivedDomains(
  entries: DomainListEntry[],
): Extract<DomainListEntry, { corrupted: false }>[] {
  return entries.filter(
    (e): e is Extract<DomainListEntry, { corrupted: false }> => !e.corrupted && e.meta.archived,
  )
}

export function buildArchivedChoices(
  entries: HomeEntry[],
): Array<{ name: string; value: ArchivedAction } | Separator> {
  const choices: Array<{ name: string; value: ArchivedAction } | Separator> = []

  for (const entry of entries) {
    const details = dim(`score: ${entry.score} · ${entry.totalQuestions} questions`)
    choices.push({
      name: `${bold(entry.slug)}  ${details}  → Unarchive`,
      value: { action: 'unarchive', slug: entry.slug },
    })
  }

  if (entries.length > 0) {
    choices.push(new Separator())
  }

  choices.push({ name: 'Back', value: { action: 'back' } })

  return choices
}

async function loadArchivedEntries(
  listResult: Awaited<Result<DomainListEntry[]>>,
): Promise<HomeEntry[]> {
  if (!listResult.ok) {
    console.error(errorFmt(`Failed to load archived domains: ${listResult.error}`))
    return []
  }
  const archived = filterArchivedDomains(listResult.data)
  return Promise.all(
    archived.map(async (entry) => {
      const r = await readDomain(entry.slug)
      return {
        slug: entry.slug,
        score: r.ok ? r.data.meta.score : entry.meta.score,
        totalQuestions: r.ok ? r.data.history.length : 0,
      }
    }),
  )
}

async function handleUnarchiveAction(slug: string): Promise<void> {
  const result = await readDomain(slug)
  if (!result.ok) {
    console.warn(warn(result.error))
    return
  }
  const updated = { ...result.data, meta: { ...result.data.meta, archived: false } }
  const writeResult = await writeDomain(slug, updated)
  if (!writeResult.ok) {
    console.error(errorFmt(`Failed to unarchive domain: ${writeResult.error}`))
  }
}

export async function showArchivedScreen(): Promise<void> {
  while (true) {
    const listResult = await listDomains()
    const archivedEntries = await loadArchivedEntries(listResult)

    let answer: ArchivedAction
    try {
      answer = await select<ArchivedAction>({
        message: '🗄  Archived domains',
        choices: buildArchivedChoices(archivedEntries),
        pageSize: 15,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) return
      throw err
    }

    if (answer.action === 'back') return
    if (answer.action === 'unarchive') await handleUnarchiveAction(answer.slug)
    // loop re-renders with refreshed list
  }
}
