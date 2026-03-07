import { showHomeScreen } from './screens/home.js'
import { showCreateDomainScreen } from './screens/create-domain.js'
import { showSelectDomainScreen } from './screens/select-domain.js'
import { showArchivedScreen } from './screens/archived.js'
import { readDomain, writeDomain } from './domain/store.js'
import { warn, error as errorFmt } from './utils/format.js'

export async function showHome(): Promise<void> {
  await showHomeScreen()
}

export async function showQuiz(slug: string): Promise<void> {
  await showSelectDomainScreen(slug)
}

export async function showCreateDomain(): Promise<void> {
  await showCreateDomainScreen()
}

export async function showArchived(): Promise<void> {
  await showArchivedScreen()
}

export async function archiveDomain(slug: string): Promise<void> {
  const result = await readDomain(slug)
  if (!result.ok) {
    console.warn(warn(result.error))
    return
  }
  const updated = { ...result.data, meta: { ...result.data.meta, archived: true } }
  const writeResult = await writeDomain(slug, updated)
  if (!writeResult.ok) {
    console.error(errorFmt(`Failed to archive domain: ${writeResult.error}`))
  }
}

export async function showHistory(_slug: string): Promise<void> {
  // stub — implemented in Story 4.1
}

export async function showStats(_slug: string): Promise<void> {
  // stub — implemented in Story 4.2
}
