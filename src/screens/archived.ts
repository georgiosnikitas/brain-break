import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { listDomains, readDomain, writeDomain, type DomainListEntry } from '../domain/store.js'
import { dim, bold, warn, error as errorFmt, header, menuTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { filterDomains, loadDomainEntries, type HomeEntry } from './home.js'

export type ArchivedAction = { action: 'unarchive'; slug: string } | { action: 'back' }

/** @deprecated Use filterDomains({ archived: true }) */
export const filterArchivedDomains = (entries: DomainListEntry[]) => filterDomains(entries, { archived: true })

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
  } else {
    choices.push(new Separator(dim('No archived domains.')), new Separator())
  }

  choices.push({ name: '↩️  Back', value: { action: 'back' } })

  return choices
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

async function promptArchivedSelection(entries: HomeEntry[]): Promise<ArchivedAction | null> {
  try {
    return await select<ArchivedAction>({
      message: 'Choose a domain:',
      choices: buildArchivedChoices(entries),
      pageSize: 15,
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

export async function showArchivedScreen(): Promise<void> {
  let browsing = true
  while (browsing) {
    clearAndBanner()
    console.log(header('🗄  Archived domains'))
    const listResult = await listDomains()
    const archivedEntries = await loadDomainEntries(listResult, { archived: true })

    if (archivedEntries.length === 0) {
      const answer = await promptArchivedSelection(archivedEntries)
      if (answer === null || answer.action === 'back') {
        browsing = false
      }
      continue
    }

    const answer = await promptArchivedSelection(archivedEntries)
    if (answer === null || answer.action === 'back') {
      browsing = false
    } else if (answer.action === 'unarchive') {
      await handleUnarchiveAction(answer.slug)
    }
    // loop re-renders with refreshed list
  }
}
