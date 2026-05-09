import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { generateQuestion, generateExplanation, generateMicroLesson, type Question } from '../ai/client.js'
import { readDomain, writeDomain, readSettings } from '../domain/store.js'
import { applyAnswer, buildQuestionRecord, accumulateDomain } from '../domain/scoring.js'
import { hashQuestion } from '../utils/hash.js'
import { defaultDomainFile, defaultSettings, type QuestionRecord, type DomainFile, type AnswerOption, type SettingsFile, type SessionData } from '../domain/schema.js'
import { colorIncorrect, warn, header, menuTheme, renderQuestionDetail } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { toggleBookmark, buildAnswerChoices } from './question-nav.js'

type PostAction = 'explain' | 'teach' | 'bookmark' | 'next' | 'exit'
type ResolvedAction = Exclude<PostAction, 'bookmark'> | null

async function promptOrNull<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function askQuestion(
  question: Question,
): Promise<{ userAnswer: AnswerOption; timeTakenMs: number } | null> {
  const startTime = Date.now()
  const userAnswer = await promptOrNull(() => select<AnswerOption>({
    message: question.question,
    choices: buildAnswerChoices(question),
    theme: menuTheme,
  }))
  if (userAnswer === null) return null
  return { userAnswer, timeTakenMs: Date.now() - startTime }
}

async function askActionMenu(
  bookmarked: boolean,
  ...extras: Array<{ name: string; value: PostAction }>
): Promise<PostAction | null> {
  return promptOrNull(() => select<PostAction>({
    message: 'Next action:',
    choices: [
      ...extras,
      { name: bookmarked ? '⭐ Remove bookmark' : '💫 Bookmark', value: 'bookmark' },
      { name: '▶️  Next question', value: 'next' },
      new Separator(),
      { name: '↩️  Back', value: 'exit' },
    ],
    theme: menuTheme,
  }))
}

async function askNextOrExit(): Promise<'next' | 'exit' | null> {
  return promptOrNull(() => select<'next' | 'exit'>({
    message: 'Next action:',
    choices: [
      { name: '▶️  Next question', value: 'next' },
      new Separator(),
      { name: '↩️  Back', value: 'exit' },
    ],
    theme: menuTheme,
  }))
}

async function handleBookmarkLoop(
  promptFn: (bookmarked: boolean) => Promise<PostAction | null>,
  record: QuestionRecord,
  domainSlug: string,
  domain: DomainFile,
): Promise<ResolvedAction> {
  let action = await promptFn(record.bookmarked)
  while (action === 'bookmark') {
    await toggleBookmark(record, domainSlug, domain)
    action = await promptFn(record.bookmarked)
  }
  return action as ResolvedAction
}

async function showGenerationError(error: string): Promise<void> {
  console.error(colorIncorrect(error))
  await promptOrNull(() => select({
    message: 'Something went wrong',
    choices: [new Separator(), { name: '↩️  Back', value: 'back' as const }],
    theme: menuTheme,
  }))
}

async function handleTeachMeMore(
  question: Question,
  explanation: string,
  settings: SettingsFile,
  record: QuestionRecord,
  domainSlug: string,
  domain: DomainFile,
): Promise<ResolvedAction> {
  const teachSpinner = ora('Generating micro-lesson...').start()
  const result = await generateMicroLesson(question, explanation, settings).finally(() => teachSpinner.stop())
  if (result.ok) {
    console.log(`\n${result.data}\n`)
  } else {
    console.warn(warn('Could not generate micro-lesson.'))
  }
  return handleBookmarkLoop((b) => askActionMenu(b), record, domainSlug, domain)
}

async function handleExplain(
  question: Question,
  userAnswer: AnswerOption,
  settings: SettingsFile,
  record: QuestionRecord,
  domainSlug: string,
  domain: DomainFile,
): Promise<ResolvedAction> {
  const explainSpinner = ora('Generating explanation...').start()
  const explainResult = await generateExplanation(question, userAnswer, settings).finally(() => explainSpinner.stop())
  if (explainResult.ok) {
    console.log(`\n${explainResult.data}\n`)
    if (!explainResult.data) {
      return askNextOrExit()
    }
    const postAction = await handleBookmarkLoop(
      (b) => askActionMenu(b, { name: '📚 Teach me more', value: 'teach' }),
      record, domainSlug, domain,
    )
    if (postAction === 'teach') {
      return handleTeachMeMore(question, explainResult.data, settings, record, domainSlug, domain)
    }
    return postAction
  }
  console.warn(warn('Could not generate explanation.'))
  return askNextOrExit()
}

function buildSessionResult(sessionRecords: QuestionRecord[], startingDifficulty: number): SessionData | null {
  return sessionRecords.length > 0 ? { records: sessionRecords, startingDifficulty } : null
}

export async function showQuiz(domainSlug: string): Promise<SessionData | null> {
  const settingsResult = await readSettings()
  const settings: SettingsFile = settingsResult.ok ? settingsResult.data : defaultSettings()

  const readResult = await readDomain(domainSlug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
  }
  let domain: DomainFile = readResult.ok ? readResult.data : defaultDomainFile()
  const startingDifficulty = domain.meta.difficultyLevel
  const sessionRecords: QuestionRecord[] = []

  while (true) {
    const hashes = new Set(domain.hashes)
    const recentQuestions = domain.history.slice(-5).map((r) => r.question)
    const spinner = ora('Generating question...').start()
    const questionResult = await generateQuestion(domainSlug, domain.meta.difficultyLevel, hashes, recentQuestions, settings).finally(() => spinner.stop())

    if (!questionResult.ok) {
      await showGenerationError(questionResult.error)
      return null
    }

    const question = questionResult.data

    clearAndBanner()
    console.log(header(`📝 Quiz — ${domainSlug}`))
    const answered = await askQuestion(question)
    if (answered === null) {
      return buildSessionResult(sessionRecords, startingDifficulty)
    }
    const { userAnswer, timeTakenMs } = answered

    const isCorrect = userAnswer === question.correctAnswer
    const applyResult = applyAnswer(
      domain.meta,
      isCorrect,
      timeTakenMs,
      question.speedThresholds,
    )

    const hash = hashQuestion(question.question)
    const record = buildQuestionRecord(question, userAnswer, isCorrect, timeTakenMs, applyResult, domain.meta.difficultyLevel)
    domain = accumulateDomain(domain, applyResult.updatedMeta, hash, record)

    sessionRecords.push(record)

    // Atomic persist before showing feedback or the next question
    const writeResult = await writeDomain(domainSlug, domain)
    if (!writeResult.ok) {
      console.warn(warn(`Failed to save progress: ${writeResult.error}`))
    }

    renderQuestionDetail(record)

    // Post-answer action: explain, bookmark, next, or exit
    let nextAction = await handleBookmarkLoop(
      (b) => askActionMenu(b, { name: '💡 Explain answer', value: 'explain' }),
      record, domainSlug, domain,
    )

    if (nextAction === 'explain') {
      nextAction = await handleExplain(question, userAnswer, settings, record, domainSlug, domain)
    }

    if (nextAction === null || nextAction === 'exit') {
      return buildSessionResult(sessionRecords, startingDifficulty)
    }
  }
}
