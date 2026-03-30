import ora from 'ora'
import { type QuestionRecord, type SettingsFile, type DomainFile } from '../domain/schema.js'
import { writeDomain } from '../domain/store.js'
import { warn } from '../utils/format.js'
import { generateExplanation, generateMicroLesson, type Question } from '../ai/client.js'

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
  const result = await generateExplanation(question, record.userAnswer, settings)
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
