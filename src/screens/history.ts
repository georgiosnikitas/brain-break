import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { readDomain, readSettings } from '../domain/store.js'
import { defaultDomainFile, defaultSettings, type QuestionRecord, type SettingsFile } from '../domain/schema.js'
import {
  warn,
  dim,
  header,
  menuTheme,
  renderQuestionDetail,
} from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { generateExplanation, type Question } from '../ai/client.js'
import * as router from '../router.js'

type NavAction = 'next' | 'prev' | 'back' | 'explain'

export function buildPageChoices(
  currentIndex: number,
  totalItems: number,
  explainVisible?: boolean,
): Array<{ name: string; value: NavAction } | Separator> {
  const choices: Array<{ name: string; value: NavAction } | Separator> = []
  if (!explainVisible) choices.push({ name: '💡 Explain answer', value: 'explain' })
  if (currentIndex < totalItems - 1) choices.push({ name: '➡️  Next question', value: 'next' })
  if (currentIndex > 0) choices.push({ name: '⬅️  Previous question', value: 'prev' })
  if (choices.length > 0) choices.push(new Separator())
  choices.push({ name: '←  Back', value: 'back' })
  return choices
}

function displayEntry(record: QuestionRecord): void {
  console.log(record.question)
  renderQuestionDetail(record, { showTimestamp: true })
}

async function handleExplain(
  record: QuestionRecord,
  settings: SettingsFile,
): Promise<{ visible: boolean; skipClear: boolean }> {
  const question: Question = {
    question: record.question,
    options: record.options,
    correctAnswer: record.correctAnswer,
    difficultyLevel: record.difficultyLevel,
    speedThresholds: { fastMs: 10000, slowMs: 30000 },
  }
  const spinner = ora('Generating explanation...').start()
  const result = await generateExplanation(question, record.userAnswer, settings)
    .finally(() => spinner.stop())
  if (result.ok) {
    console.log(`\n${result.data}\n`)
    return { visible: true, skipClear: false }
  }
  console.warn(warn('Could not generate explanation.'))
  return { visible: false, skipClear: true }
}

async function navigateHistory(history: QuestionRecord[], domainSlug: string): Promise<void> {
  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
  const totalItems = history.length
  let index = 0
  let explainVisible = false
  let skipClear = false

  while (true) {
    if (!explainVisible && !skipClear) {
      clearAndBanner()
      console.log(header(`📜 Question History — ${domainSlug}`))
      displayEntry(history[index])
    }
    skipClear = false

    const choices = buildPageChoices(index, totalItems, explainVisible)
    let nav: NavAction
    try {
      nav = await select<NavAction>({
        message: `Question ${index + 1} of ${totalItems}`,
        choices,
        theme: menuTheme,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) {
        await router.showDomainMenu(domainSlug)
        return
      }
      throw err
    }

    if (nav === 'explain') {
      const explainResult = await handleExplain(history[index], settings)
      explainVisible = explainResult.visible
      skipClear = explainResult.skipClear
    } else if (nav === 'next') {
      index++
      explainVisible = false
    } else if (nav === 'prev') {
      index--
      explainVisible = false
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
    clearAndBanner()
    console.log(header(`📜 Question History — ${domainSlug}`))
    console.log(dim('No questions answered yet'))
    try {
      await select<NavAction>({
        message: 'Navigation',
        choices: [{ name: '←  Back', value: 'back' }],
        theme: menuTheme,
      })
    } catch (err) {
      if (!(err instanceof ExitPromptError)) throw err
    }
    await router.showDomainMenu(domainSlug)
    return
  }

  await navigateHistory(history, domainSlug)
}
