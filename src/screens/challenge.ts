import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import type { Question } from '../ai/client.js'
import { readDomain, writeDomain } from '../domain/store.js'
import { applyAnswer, buildQuestionRecord, accumulateDomain } from '../domain/scoring.js'
import { hashQuestion } from '../utils/hash.js'
import { defaultDomainFile, type QuestionRecord, type DomainFile, type AnswerOption, type SessionData } from '../domain/schema.js'
import { header, dim, menuTheme, renderQuestionDetail, warn } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { buildAnswerChoices } from './question-nav.js'
import type { SprintConfig } from './sprint-setup.js'

type AnswerPromptResult =
  | { kind: 'answered'; userAnswer: AnswerOption; timeTakenMs: number }
  | { kind: 'exit' }
  | { kind: 'timeout' }

type PostAnswerPromptResult =
  | { kind: 'next' }
  | { kind: 'back' }
  | { kind: 'exit' }
  | { kind: 'timeout' }

type ProcessAnsweredQuestionResult = {
  domain: DomainFile
  outcome: 'continue' | 'break' | 'return'
  timedOut?: boolean
}

type ProcessAnsweredQuestionArgs = {
  slug: string
  config: SprintConfig
  sprintStartMs: number
  startingDifficulty: number
  domain: DomainFile
  sessionRecords: QuestionRecord[]
  question: Question
  answered: Extract<AnswerPromptResult, { kind: 'answered' }>
}

function isAbortPromptError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortPromptError'
}

function getRemainingMs(config: SprintConfig, sprintStartMs: number): number {
  return config.timeBudgetMs - (Date.now() - sprintStartMs)
}

function formatTimer(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function createTimedPrompt(remainingMs: number): { controller: AbortController; timeout: NodeJS.Timeout } {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Math.max(0, remainingMs))
  return { controller, timeout }
}

function renderSprintScreen(slug: string, remainingMs: number): void {
  clearAndBanner()
  console.log(header(`⚡ Challenge — ${slug}`))
  console.log(dim(`Time remaining: ${formatTimer(remainingMs)}`))
}

async function askTimedQuestion(question: Question, remainingMs: number): Promise<AnswerPromptResult> {
  const questionStartMs = Date.now()
  const { controller, timeout } = createTimedPrompt(remainingMs)

  try {
    const userAnswer = await select<AnswerOption>({
      message: question.question,
      choices: buildAnswerChoices(question),
      theme: menuTheme,
    }, { signal: controller.signal })
    return { kind: 'answered', userAnswer, timeTakenMs: Date.now() - questionStartMs }
  } catch (err) {
    if (err instanceof ExitPromptError) return { kind: 'exit' }
    if (isAbortPromptError(err)) return { kind: 'timeout' }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

async function askTimedPostAnswerAction(remainingMs: number): Promise<PostAnswerPromptResult> {
  const { controller, timeout } = createTimedPrompt(remainingMs)

  try {
    const action = await select<'next' | 'back'>({
      message: 'Next action:',
      choices: [
        { name: '▶️  Next question', value: 'next' as const },
        new Separator(),
        { name: '↩️  Back', value: 'back' as const },
      ],
      theme: menuTheme,
    }, { signal: controller.signal })

    return action === 'next' ? { kind: 'next' } : { kind: 'back' }
  } catch (err) {
    if (err instanceof ExitPromptError) return { kind: 'exit' }
    if (isAbortPromptError(err)) return { kind: 'timeout' }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

async function processAnsweredQuestion({
  slug,
  config,
  sprintStartMs,
  startingDifficulty,
  domain,
  sessionRecords,
  question,
  answered,
}: ProcessAnsweredQuestionArgs): Promise<ProcessAnsweredQuestionResult> {
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
  const nextDomain = accumulateDomain(domain, applyResult.updatedMeta, hash, record)

  sessionRecords.push(record)

  const writeResult = await writeDomain(slug, nextDomain)
  if (!writeResult.ok) {
    console.warn(warn(`Failed to save progress: ${writeResult.error}`))
  }

  renderQuestionDetail(record)

  const remainingAfterAnswer = getRemainingMs(config, sprintStartMs)
  console.log(dim(`Time remaining: ${formatTimer(remainingAfterAnswer)}`))
  if (remainingAfterAnswer <= 0) {
    return { domain: nextDomain, outcome: 'break', timedOut: true }
  }

  const nextAction = await askTimedPostAnswerAction(remainingAfterAnswer)
  if (nextAction.kind === 'next') {
    return { domain: nextDomain, outcome: 'continue' }
  }
  if (nextAction.kind === 'exit') {
    return { domain: nextDomain, outcome: 'return' }
  }
  if (nextAction.kind === 'timeout') {
    return { domain: nextDomain, outcome: 'break', timedOut: true }
  }

  return { domain: nextDomain, outcome: 'break' }
}

type AutoSubmitResult = { domain: DomainFile; record: QuestionRecord }

async function autoSubmitTimeoutQuestion(
  slug: string,
  domain: DomainFile,
  question: Question,
  timeTakenMs: number,
  sessionRecords: QuestionRecord[],
): Promise<AutoSubmitResult> {
  const applyResult = applyAnswer(
    domain.meta,
    false,
    Math.max(timeTakenMs, question.speedThresholds.slowMs),
    question.speedThresholds,
  )
  const hash = hashQuestion(question.question)
  const record = buildQuestionRecord(question, 'TIMEOUT', false, timeTakenMs, applyResult, domain.meta.difficultyLevel)
  const nextDomain = accumulateDomain(domain, applyResult.updatedMeta, hash, record)
  sessionRecords.push(record)

  const writeResult = await writeDomain(slug, nextDomain)
  if (!writeResult.ok) {
    console.warn(warn(`Failed to save progress: ${writeResult.error}`))
  }

  console.log(warn('Time expired. Auto-submitting current question.'))
  renderQuestionDetail(record)

  return { domain: nextDomain, record }
}

export async function showChallengeExecution(
  slug: string,
  config: SprintConfig,
  questions: Question[],
): Promise<SessionData | null> {
  const readResult = await readDomain(slug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
  }
  let domain: DomainFile = readResult.ok ? readResult.data : defaultDomainFile()
  const startingDifficulty = domain.meta.difficultyLevel
  const sessionRecords: QuestionRecord[] = []
  const sprintStartMs = Date.now()
  let timedOut = false

  for (const question of questions) {
    const remainingMs = getRemainingMs(config, sprintStartMs)
    if (remainingMs <= 0) {
      timedOut = true
      break
    }

    renderSprintScreen(slug, remainingMs)

    const questionStartMs = Date.now()
    const answered = await askTimedQuestion(question, remainingMs)
    if (answered.kind === 'exit') {
      break
    }
    if (answered.kind === 'timeout') {
      const timeTakenMs = Date.now() - questionStartMs
      await autoSubmitTimeoutQuestion(slug, domain, question, timeTakenMs, sessionRecords)
      timedOut = true
      break
    }

    const processed = await processAnsweredQuestion({
      slug,
      config,
      sprintStartMs,
      startingDifficulty,
      domain,
      sessionRecords,
      question,
      answered,
    })
    domain = processed.domain

    if (processed.outcome === 'return' || processed.outcome === 'break') {
      if (processed.timedOut) timedOut = true
      break
    }
  }

  if (sessionRecords.length === 0) return null
  const sprintResult = {
    questionsAnswered: sessionRecords.length,
    totalQuestions: questions.length,
    timedOut,
  }
  return { records: sessionRecords, startingDifficulty, sprintResult }
}