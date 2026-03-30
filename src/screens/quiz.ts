import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { generateQuestion, generateExplanation, generateMicroLesson, type Question } from '../ai/client.js'
import { readDomain, writeDomain, readSettings } from '../domain/store.js'
import { applyAnswer } from '../domain/scoring.js'
import { hashQuestion } from '../utils/hash.js'
import { defaultDomainFile, defaultSettings, type QuestionRecord, type DomainFile, type AnswerOption, type SettingsFile, type SessionData } from '../domain/schema.js'
import { colorIncorrect, warn, header, menuTheme, renderQuestionDetail } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { toggleBookmark } from './question-nav.js'

type NavResult = 'next' | 'exit' | null
type PostAnswerAction = 'explain' | 'bookmark' | NavResult

async function askQuestion(
  question: Question,
): Promise<{ userAnswer: AnswerOption; timeTakenMs: number } | null> {
  const startTime = Date.now()
  try {
    const userAnswer = await select<AnswerOption>({
      message: question.question,
      choices: [
        { name: `A) ${question.options.A}`, value: 'A' as const },
        { name: `B) ${question.options.B}`, value: 'B' as const },
        { name: `C) ${question.options.C}`, value: 'C' as const },
        { name: `D) ${question.options.D}`, value: 'D' as const },
      ],
      theme: menuTheme,
    })
    const timeTakenMs = Date.now() - startTime
    return { userAnswer, timeTakenMs }
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function askPostAnswerAction(bookmarked: boolean): Promise<'explain' | 'bookmark' | 'next' | 'exit' | null> {
  try {
    return await select<'explain' | 'bookmark' | 'next' | 'exit'>({
      message: 'Next action:',
      choices: [
        { name: '💡 Explain answer', value: 'explain' as const },
        { name: bookmarked ? '⭐ Remove bookmark' : '💫 Bookmark', value: 'bookmark' as const },
        { name: '▶️  Next question', value: 'next' as const },
        new Separator(),
        { name: '←  Back', value: 'exit' as const },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function askNextOrExit(): Promise<NavResult> {
  try {
    return await select<'next' | 'exit'>({
      message: 'Next action:',
      choices: [
        { name: '▶️  Next question', value: 'next' as const },
        new Separator(),
        { name: '←  Back', value: 'exit' as const },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function askPostExplainAction(bookmarked: boolean): Promise<'teach' | 'bookmark' | 'next' | 'exit' | null> {
  try {
    return await select<'teach' | 'bookmark' | 'next' | 'exit'>({
      message: 'Next action:',
      choices: [
        { name: '📚 Teach me more', value: 'teach' as const },
        { name: bookmarked ? '⭐ Remove bookmark' : '💫 Bookmark', value: 'bookmark' as const },
        { name: '▶️  Next question', value: 'next' as const },
        new Separator(),
        { name: '←  Back', value: 'exit' as const },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function askPostTeachAction(bookmarked: boolean): Promise<'bookmark' | NavResult> {
  try {
    return await select<'bookmark' | 'next' | 'exit'>({
      message: 'Next action:',
      choices: [
        { name: bookmarked ? '⭐ Remove bookmark' : '💫 Bookmark', value: 'bookmark' as const },
        { name: '▶️  Next question', value: 'next' as const },
        new Separator(),
        { name: '←  Back', value: 'exit' as const },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function handleBookmarkLoop<T extends string>(
  promptFn: (bookmarked: boolean) => Promise<T | null>,
  record: QuestionRecord,
  domainSlug: string,
  domain: DomainFile,
): Promise<Exclude<T, 'bookmark'> | null> {
  let action = await promptFn(record.bookmarked)
  while (action === 'bookmark') {
    await toggleBookmark(record, domainSlug, domain)
    action = await promptFn(record.bookmarked)
  }
  return action as Exclude<T, 'bookmark'> | null
}

async function showGenerationError(error: string): Promise<void> {
  console.error(colorIncorrect(error))
  try {
    await select({
      message: 'Something went wrong',
      choices: [new Separator(), { name: '←  Back', value: 'back' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}

async function handleTeachMeMore(
  question: Question,
  explanation: string,
  settings: SettingsFile,
  record: QuestionRecord,
  domainSlug: string,
  domain: DomainFile,
): Promise<NavResult> {
  const teachSpinner = ora('Generating micro-lesson...').start()
  const result = await generateMicroLesson(question, explanation, settings).finally(() => teachSpinner.stop())
  if (result.ok) {
    console.log(`\n${result.data}\n`)
  } else {
    console.warn(warn('Could not generate micro-lesson.'))
  }
  return handleBookmarkLoop(askPostTeachAction, record, domainSlug, domain)
}

async function handleExplain(
  question: Question,
  userAnswer: AnswerOption,
  settings: SettingsFile,
  record: QuestionRecord,
  domainSlug: string,
  domain: DomainFile,
): Promise<NavResult> {
  const explainSpinner = ora('Generating explanation...').start()
  const explainResult = await generateExplanation(question, userAnswer, settings).finally(() => explainSpinner.stop())
  if (explainResult.ok) {
    console.log(`\n${explainResult.data}\n`)
    if (!explainResult.data) {
      return askNextOrExit()
    }
    const postAction = await handleBookmarkLoop(askPostExplainAction, record, domainSlug, domain)
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
    const { updatedMeta, scoreDelta, speedTier } = applyAnswer(
      domain.meta,
      isCorrect,
      timeTakenMs,
      question.speedThresholds,
    )

    // Build record using difficultyLevel at the time the question was asked
    const hash = hashQuestion(question.question)
    const record: QuestionRecord = {
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      userAnswer,
      isCorrect,
      answeredAt: new Date().toISOString(),
      timeTakenMs,
      speedTier,
      scoreDelta,
      difficultyLevel: domain.meta.difficultyLevel,
      bookmarked: false,
    }

    // Accumulate domain state — update lastSessionAt
    domain = {
      meta: { ...updatedMeta, lastSessionAt: new Date().toISOString() },
      hashes: [...domain.hashes, hash],
      history: [...domain.history, record],
    }

    sessionRecords.push(record)

    // Atomic persist before showing feedback or the next question
    const writeResult = await writeDomain(domainSlug, domain)
    if (!writeResult.ok) {
      console.warn(warn(`Failed to save progress: ${writeResult.error}`))
    }

    renderQuestionDetail(record)

    // Post-answer action: explain, bookmark, next, or exit
    let nextAction: Exclude<PostAnswerAction, 'bookmark'> | null = await handleBookmarkLoop(askPostAnswerAction, record, domainSlug, domain)

    if (nextAction === 'explain') {
      nextAction = await handleExplain(question, userAnswer, settings, record, domainSlug, domain)
    }

    if (nextAction === null || nextAction === 'exit') {
      return buildSessionResult(sessionRecords, startingDifficulty)
    }
  }
}
