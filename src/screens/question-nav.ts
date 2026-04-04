import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { type AnswerOption, type QuestionRecord, type SettingsFile, type DomainFile, defaultSettings } from '../domain/schema.js'
import { writeDomain, readSettings } from '../domain/store.js'
import { warn, header, menuTheme, renderQuestionDetail } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { generateExplanation, generateMicroLesson, type Question } from '../ai/client.js'

export type NavAction = 'next' | 'prev' | 'back' | 'explain' | 'teach' | 'bookmark'

export function buildAnswerChoices(question: Question): Array<{ name: string; value: AnswerOption }> {
  return [
    { name: `A) ${question.options.A}`, value: 'A' as const },
    { name: `B) ${question.options.B}`, value: 'B' as const },
    { name: `C) ${question.options.C}`, value: 'C' as const },
    { name: `D) ${question.options.D}`, value: 'D' as const },
  ]
}

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

// ---------------------------------------------------------------------------
// Shared record navigation loop (used by history and bookmarks)
// ---------------------------------------------------------------------------

export interface NavigateRecordsConfig {
  headerText: string
  itemLabel: string
  onNavigate?: (
    currentIndex: number,
    direction: 'next' | 'prev',
    currentRecord: QuestionRecord,
    domain: DomainFile,
  ) => { records: QuestionRecord[]; newIndex: number } | null
}

interface RecordNavState {
  index: number
  explainVisible: boolean
  teachVisible: boolean
  explanationText: string | null
  skipClear: boolean
  records: QuestionRecord[]
}

function resetRecordNavState(index: number, records: QuestionRecord[]): RecordNavState {
  return { index, explainVisible: false, teachVisible: false, explanationText: null, skipClear: false, records }
}

async function processRecordNavAction(
  nav: NavAction,
  state: RecordNavState,
  domain: DomainFile,
  domainSlug: string,
  settings: SettingsFile,
  onNavigate?: NavigateRecordsConfig['onNavigate'],
): Promise<RecordNavState | null> {
  if (nav === 'explain') {
    const result = await handleExplainAnswer(state.records[state.index], settings)
    return { ...state, explainVisible: result.visible, skipClear: result.skipClear, explanationText: result.explanationText, teachVisible: false }
  }
  if (nav === 'teach') {
    if (!state.explanationText) return state
    const result = await handleTeachMeMoreAnswer(state.records[state.index], state.explanationText, settings)
    return { ...state, teachVisible: result.teachShown, skipClear: result.skipClear }
  }
  if (nav === 'bookmark') {
    await toggleBookmark(state.records[state.index], domainSlug, domain)
    return { ...state, skipClear: true }
  }
  if (nav === 'back') return state

  // next | prev
  if (onNavigate) {
    const result = onNavigate(state.index, nav, state.records[state.index], domain)
    if (result === null) return null
    return resetRecordNavState(result.newIndex, result.records)
  }
  const newIndex = nav === 'next' ? state.index + 1 : state.index - 1
  return resetRecordNavState(newIndex, state.records)
}

export async function navigateRecords(
  initialRecords: QuestionRecord[],
  domain: DomainFile,
  domainSlug: string,
  config: NavigateRecordsConfig,
): Promise<'back' | 'exhausted'> {
  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
  let state = resetRecordNavState(0, initialRecords)

  while (true) {
    if (!state.explainVisible && !state.skipClear) {
      clearAndBanner()
      console.log(header(config.headerText))
      displayEntry(state.records[state.index])
    }
    state.skipClear = false

    const choices = buildNavChoices(state.index, state.records.length, state.explainVisible, state.teachVisible, state.records[state.index].bookmarked)
    const nav = await selectNavAction(`${config.itemLabel} ${state.index + 1} of ${state.records.length}`, choices)
    if (nav === null || nav === 'back') return 'back'

    const newState = await processRecordNavAction(nav, state, domain, domainSlug, settings, config.onNavigate)
    if (newState === null) return 'exhausted'
    state = newState
  }
}
