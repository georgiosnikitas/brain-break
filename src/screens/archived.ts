import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { listDomains, readDomain, writeDomain, type DomainListEntry } from '../domain/store.js'
import { dim, bold, warn, error as errorFmt } from '../utils/format.js'
import type { HomeEntry } from './home.js'

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
    choices.push({
      name: `${bold(entry.slug)}  ${dim(`score: ${entry.score} · ${entry.totalQuestions} questions`)}  → Unarchive`,
      value: { action: 'unarchive', slug: entry.slug },
    })
  }

  if (entries.length > 0) {
    choices.push(new Separator())
  }

  choices.push({ name: 'Back', value: { action: 'back' } })

  return choices
}

export async function showArchivedScreen(): Promise<void> {
  while (true) {
    const listResult = await listDomains()

    let archivedEntries: HomeEntry[] = []

    if (listResult.ok) {
      const archived = filterArchivedDomains(listResult.data)
      archivedEntries = await Promise.all(
        archived.map(async (entry) => {
          const r = await readDomain(entry.slug)
          return {
            slug: entry.slug,
            score: r.ok ? r.data.meta.score : entry.meta.score,
            totalQuestions: r.ok ? r.data.history.length : 0,
          }
        }),
      )
    } else {
      console.error(errorFmt(`Failed to load archived domains: ${listResult.error}`))
    }

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

    if (answer.action === 'unarchive') {
      const result = await readDomain(answer.slug)
      if (!result.ok) {
        console.warn(warn(result.error))
        continue
      }
      const updated = { ...result.data, meta: { ...result.data.meta, archived: false } }
      const writeResult = await writeDomain(answer.slug, updated)
      if (!writeResult.ok) {
        console.error(errorFmt(`Failed to unarchive domain: ${writeResult.error}`))
      }
      // loop re-renders with refreshed list
    }
  }
}
