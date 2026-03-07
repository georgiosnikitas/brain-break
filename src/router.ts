import { showHomeScreen } from './screens/home.js'

export async function showHome(): Promise<void> {
  await showHomeScreen()
}

export async function showQuiz(_slug: string): Promise<void> {
  // stub — implemented in Story 2.3
}

export async function showCreateDomain(): Promise<void> {
  // stub — implemented in Story 2.2
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
