import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain } from '../domain/store.js'
import { defaultDomainFile } from '../domain/schema.js'
import { bold, dim, warn } from '../utils/format.js'
import * as router from '../router.js'

export type DomainMenuAction =
  | { action: 'play' }
  | { action: 'history' }
  | { action: 'stats' }
  | { action: 'archive' }
  | { action: 'back' }

export function buildDomainMenuChoices(): Array<{ name: string; value: DomainMenuAction } | Separator> {
  return [
    { name: '▶  Play', value: { action: 'play' } },
    { name: '📜  View History', value: { action: 'history' } },
    { name: '📊  View Stats', value: { action: 'stats' } },
    { name: '🗄  Archive', value: { action: 'archive' } },
    new Separator(),
    { name: '←  Back', value: { action: 'back' } },
  ]
}

export async function showDomainMenuScreen(slug: string): Promise<void> {
  while (true) {
    const readResult = await readDomain(slug)
    if (!readResult.ok) {
      console.warn(warn(readResult.error))
    }
    const domain = readResult.ok ? readResult.data : defaultDomainFile()
    const score = domain.meta.score
    const totalQuestions = domain.history.length

    const scoreLabel = dim(`score: ${score} · ${totalQuestions} questions`)
    let answer: DomainMenuAction
    try {
      answer = await select<DomainMenuAction>({
        message: `\n  🧠 ${bold(slug)}  ${scoreLabel}`,
        choices: buildDomainMenuChoices(),
      })
    } catch (err) {
      if (err instanceof ExitPromptError) {
        await router.showHome()
        return
      }
      throw err
    }

    const shouldContinue = await handleDomainAction(slug, answer)
    if (!shouldContinue) return
  }
}

async function handleDomainAction(slug: string, answer: DomainMenuAction): Promise<boolean> {
  if (answer.action === 'play') {
    await router.showQuiz(slug)
  } else if (answer.action === 'history') {
    await router.showHistory(slug)
  } else if (answer.action === 'stats') {
    await router.showStats(slug)
  } else if (answer.action === 'archive') {
    await router.archiveDomain(slug)
    await router.showHome()
    return false
  } else {
    await router.showHome()
    return false
  }
  return true
}
