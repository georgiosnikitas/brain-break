import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { type AnswerOption, type QuestionRecord, type SettingsFile, type DomainFile } from '../domain/schema.js'
import { writeDomain } from '../domain/store.js'
import { warn, menuTheme, renderQuestionDetail } from '../utils/format.js'
import { generateExplanation, generateMicroLesson, type Question } from '../ai/client.js'

export type NavAction = 'next' | 'prev' | 'back' | 'explain' | 'teach' | 'bookmark'

export function buildNavChoices(
  currentIndex: number,
  totalItems: number,
  explainVisible?: boolean,
  teachVisible?: boolean,
  bookmarked?: boolean,
): Array<{ name: string; value: NavAction } | Separator> {
  const choices: Array<{ name: string; value: NavAction } | Separator> = []
  if (!explainVisible) choices.push({ name: '💡 Explain answer', value: 'explain' })
  if (explainVisible && !teachVisible) choices.push({ name: '📚 Teach me more', value: 'teach' })
  choices.push({ name: bookmarked ? '⭐ Remove bookmark' : '💫 Bookmark', value: 'bookmark' })
  if (currentIndex < totalItems - 1) choices.push({ name: '➡️  Next question', value: 'next' })
  if (currentIndex > 0) choices.push({ name: '⬅️  Previous question', value: 'prev' })
  if (choices.length > 0) choices.push(new Separator())
  choices.push({ name: '↩️  Back', value: 'back' })
  return choices
}

export function displayEntry(record: QuestionRecord): void {
  console.log(record.question)
  renderQuestionDetail(record, { showTimestamp: true })
}

export async function selectNavAction(
  message: string,
  choices: Array<{ name: string; value: NavAction } | Separator>,
): Promise<NavAction | null> {
  try {
    return await select<NavAction>({ message, choices, theme: menuTheme })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

export function toQuestion(record: QuestionRecord): Question {
  return {
    question: record.question,
    options: record.options,
    correctAnswer: record.correctAnswer,
    difficultyLevel: record.difficultyLevel,
    speedThresholds: { fastMs: 10000, slowMs: 30000 },
  }
}

export async function handleExplainAnswer(
  record: QuestionRecord,
  settings: SettingsFile,
): Promise<{ visible: boolean; skipClear: boolean; explanationText: string | null }> {
  const question = toQuestion(record)
  const spinner = ora('Generating explanation...').start()
  const result = await generateExplanation(question, record.userAnswer as AnswerOption, settings)
    .finally(() => spinner.stop())
  if (result.ok) {
    console.log(`\n${result.data}\n`)
    return { visible: true, skipClear: false, explanationText: result.data }
  }
  console.warn(warn('Could not generate explanation.'))
  return { visible: false, skipClear: true, explanationText: null }
}

export async function handleTeachMeMoreAnswer(
  record: QuestionRecord,
  explanationText: string,
  settings: SettingsFile,
): Promise<{ teachShown: boolean; skipClear: boolean }> {
  const question = toQuestion(record)
  const spinner = ora('Generating micro-lesson...').start()
  const result = await generateMicroLesson(question, explanationText, settings)
    .finally(() => spinner.stop())
  if (result.ok) {
    console.log(`\n${result.data}\n`)
    return { teachShown: true, skipClear: false }
  }
  console.warn(warn('Could not generate micro-lesson.'))
  return { teachShown: false, skipClear: true }
}

export async function toggleBookmark(
  record: QuestionRecord,
  domainSlug: string,
  domain: DomainFile,
): Promise<void> {
  record.bookmarked = !record.bookmarked
  const writeResult = await writeDomain(domainSlug, domain)
  if (!writeResult.ok) console.warn(warn(`Failed to save bookmark: ${writeResult.error}`))
}
