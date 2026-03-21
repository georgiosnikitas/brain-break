import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { generateQuestion, isAuthErrorMessage, type Question } from '../ai/client.js'
import { readDomain, writeDomain, readSettings } from '../domain/store.js'
import { applyAnswer } from '../domain/scoring.js'
import { hashQuestion } from '../utils/hash.js'
import { defaultDomainFile, defaultSettings, type QuestionRecord, type DomainFile, type AnswerOption, type SpeedTier, type SettingsFile } from '../domain/schema.js'
import { formatDuration, colorCorrect, colorIncorrect, colorSpeedTier, colorScoreDelta, colorDifficultyLevel, warn, bold, menuTheme } from '../utils/format.js'
import { clearScreen } from '../utils/screen.js'
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
      theme: menuTheme,
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
  difficultyLevel: number,
): void {
  if (isCorrect) {
    console.log(colorCorrect('✓ Correct!'))
  } else {
    console.log(colorIncorrect('✗ Incorrect'))
    const correctText = `${question.correctAnswer}) ${question.options[question.correctAnswer]}`
    console.log(`Correct answer: ${colorCorrect(bold(correctText))}`)
  }
  console.log(`Time: ${formatDuration(timeTakenMs)} | Speed: ${colorSpeedTier(speedTier)} | Difficulty: ${colorDifficultyLevel(difficultyLevel)}`)
  console.log(`Score: ${colorScoreDelta(scoreDelta)}`)
}

async function askNextAction(): Promise<'next' | 'exit' | null> {
  try {
    return await select<'next' | 'exit'>({
      message: 'Next action:',
      choices: [
        { name: '▶️  Next question', value: 'next' as const },
        { name: '🚪 Exit quiz', value: 'exit' as const },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

export async function showQuiz(domainSlug: string): Promise<void> {
  const settingsResult = await readSettings()
  const settings: SettingsFile = settingsResult.ok ? settingsResult.data : defaultSettings()

  const readResult = await readDomain(domainSlug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
  }
  let domain: DomainFile = readResult.ok ? readResult.data : defaultDomainFile()

  while (true) {
    const hashes = new Set(domain.hashes)
    const recentQuestions = domain.history.slice(-5).map((r) => r.question)
    const spinner = ora('Generating question...').start()
    const questionResult = await generateQuestion(domainSlug, domain.meta.difficultyLevel, hashes, recentQuestions, settings).finally(() => spinner.stop())

    if (!questionResult.ok) {
      if (isAuthErrorMessage(questionResult.error)) {
        console.error(colorIncorrect(questionResult.error))
        process.exit(1)
      }
      console.error(colorIncorrect(questionResult.error))
      await router.showDomainMenu(domainSlug)
      return
    }

    const question = questionResult.data

    clearScreen()
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
      console.warn(warn(`Failed to save progress: ${writeResult.error}`))
    }

    clearScreen()
    showFeedback(isCorrect, question, timeTakenMs, speedTier, scoreDelta, record.difficultyLevel)

    // Exit option available after every answer
    const nextAction = await askNextAction()
    if (nextAction === null || nextAction === 'exit') {
      await router.showDomainMenu(domainSlug)
      return
    }
  }
}
