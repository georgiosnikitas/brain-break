import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { generateQuestion, AI_ERRORS, type Question } from '../ai/client.js'
import { readDomain, writeDomain } from '../domain/store.js'
import { applyAnswer } from '../domain/scoring.js'
import { hashQuestion } from '../utils/hash.js'
import { defaultDomainFile, type QuestionRecord, type DomainFile, type AnswerOption, type SpeedTier } from '../domain/schema.js'
import { formatSpeedTier, formatScoreDelta, formatDuration, success, error as errorFmt, warn, bold } from '../utils/format.js'
import * as router from '../router.js'

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
    })
    const timeTakenMs = Date.now() - startTime
    return { userAnswer, timeTakenMs }
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

function showFeedback(
  isCorrect: boolean,
  question: Question,
  timeTakenMs: number,
  speedTier: SpeedTier,
  scoreDelta: number,
): void {
  if (isCorrect) {
    console.log(success('✓ Correct!'))
  } else {
    console.log(errorFmt('✗ Incorrect'))
    const correctText = `${question.correctAnswer}) ${question.options[question.correctAnswer]}`
    console.log(`Correct answer: ${bold(correctText)}`)
  }
  console.log(`Time: ${formatDuration(timeTakenMs)} | Speed: ${formatSpeedTier(speedTier)}`)
  console.log(`Score: ${formatScoreDelta(scoreDelta)}`)
}

async function askNextAction(): Promise<'next' | 'exit' | null> {
  try {
    return await select<'next' | 'exit'>({
      message: 'Next action:',
      choices: [
        { name: 'Next question', value: 'next' as const },
        { name: 'Exit quiz', value: 'exit' as const },
      ],
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

export async function showQuiz(domainSlug: string): Promise<void> {
  const readResult = await readDomain(domainSlug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
  }
  let domain: DomainFile = readResult.ok ? readResult.data : defaultDomainFile()

  while (true) {
    const hashes = new Set(domain.hashes)
    const spinner = ora('Generating question...').start()
    const questionResult = await generateQuestion(domainSlug, domain.meta.difficultyLevel, hashes).finally(() => spinner.stop())

    if (!questionResult.ok) {
      if (questionResult.error === AI_ERRORS.AUTH) {
        console.error(errorFmt(questionResult.error))
        process.exit(1)
      }
      console.error(errorFmt(questionResult.error))
      await router.showDomainMenu(domainSlug)
      return
    }

    const question = questionResult.data

    const answered = await askQuestion(question)
    if (answered === null) {
      await router.showDomainMenu(domainSlug)
      return
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
    }

    // Accumulate domain state — update lastSessionAt
    domain = {
      meta: { ...updatedMeta, lastSessionAt: new Date().toISOString() },
      hashes: [...domain.hashes, hash],
      history: [...domain.history, record],
    }

    // Atomic persist before showing feedback or the next question
    const writeResult = await writeDomain(domainSlug, domain)
    if (!writeResult.ok) {
      console.error(errorFmt(`Failed to save progress: ${writeResult.error}`))
    }

    showFeedback(isCorrect, question, timeTakenMs, speedTier, scoreDelta)

    // Exit option available after every answer
    const nextAction = await askNextAction()
    if (nextAction === null || nextAction === 'exit') {
      await router.showDomainMenu(domainSlug)
      return
    }
  }
}
