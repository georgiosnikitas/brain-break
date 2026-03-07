import { showHomeScreen } from './screens/home.js'
import { showCreateDomainScreen } from './screens/create-domain.js'
import { showSelectDomainScreen } from './screens/select-domain.js'

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
  // stub — implemented in Story 2.4
}

export async function showHistory(_slug: string): Promise<void> {
  // stub — implemented in Story 4.1
}

export async function showStats(_slug: string): Promise<void> {
  // stub — implemented in Story 4.2
}
