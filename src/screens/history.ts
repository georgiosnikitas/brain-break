import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain } from '../domain/store.js'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'
import {
  warn,
  bold,
  dim,
  header,
  success,
  error as errorFmt,
  formatSpeedTier,
  formatScoreDelta,
  formatDuration,
} from '../utils/format.js'
import * as router from '../router.js'

type NavAction = 'next' | 'prev' | 'back'

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function buildPageChoices(
  currentIndex: number,
  totalItems: number,
): Array<{ name: string; value: NavAction } | Separator> {
  const choices: Array<{ name: string; value: NavAction } | Separator> = []
  if (currentIndex > 0) choices.push({ name: 'Previous', value: 'prev' })
  if (currentIndex < totalItems - 1) choices.push({ name: 'Next', value: 'next' })
  if (choices.length > 0) choices.push(new Separator())
  choices.push({ name: '←  Back', value: 'back' })
  return choices
}

function displayEntry(record: QuestionRecord, globalIndex: number): void {
  console.log(bold(`\n#${globalIndex + 1} — ${record.question}`))
  console.log(dim(`  A) ${record.options.A}`))
  console.log(dim(`  B) ${record.options.B}`))
  console.log(dim(`  C) ${record.options.C}`))
  console.log(dim(`  D) ${record.options.D}`))
  console.log(`  Your answer: ${bold(record.userAnswer)}  |  Correct: ${bold(record.correctAnswer)}  |  ${record.isCorrect ? success('✓ Correct') : errorFmt('✗ Wrong')}`)
  console.log(`  Time: ${formatDuration(record.timeTakenMs)}  |  Speed: ${formatSpeedTier(record.speedTier)}  |  Score: ${formatScoreDelta(record.scoreDelta)}  |  Difficulty: ${record.difficultyLevel}`)
  console.log(dim(`  Answered: ${formatTimestamp(record.answeredAt)}`))
}

async function navigateHistory(history: QuestionRecord[], domainSlug: string): Promise<void> {
  const totalItems = history.length
  let index = 0

  while (true) {
    console.log(header(`\nQuestion History — Question ${index + 1} of ${totalItems}`))
    displayEntry(history[index], index)

    const choices = buildPageChoices(index, totalItems)
    let nav: NavAction
    try {
      nav = await select<NavAction>({
        message: `Question ${index + 1} of ${totalItems}`,
        choices,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) {
        await router.showDomainMenu(domainSlug)
        return
      }
      throw err
    }

    if (nav === 'next') {
      index++
    } else if (nav === 'prev') {
      index--
    } else {
      await router.showDomainMenu(domainSlug)
      return
    }
  }
}

export async function showHistory(domainSlug: string): Promise<void> {
  const readResult = await readDomain(domainSlug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
  }
  const domain = readResult.ok ? readResult.data : defaultDomainFile()
  const history = [...domain.history].reverse()

  if (history.length === 0) {
    console.log(header('Question History'))
    console.log(dim('No questions answered yet'))
    try {
      await select<NavAction>({
        message: 'Navigation',
        choices: [{ name: '←  Back', value: 'back' }],
      })
    } catch (err) {
      if (!(err instanceof ExitPromptError)) throw err
    }
    await router.showDomainMenu(domainSlug)
    return
  }

  await navigateHistory(history, domainSlug)
}
