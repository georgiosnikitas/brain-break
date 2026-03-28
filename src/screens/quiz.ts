import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { generateQuestion, generateExplanation, type Question } from '../ai/client.js'
import { readDomain, writeDomain, readSettings } from '../domain/store.js'
import { applyAnswer } from '../domain/scoring.js'
import { hashQuestion } from '../utils/hash.js'
import { defaultDomainFile, defaultSettings, type QuestionRecord, type DomainFile, type AnswerOption, type SettingsFile } from '../domain/schema.js'
import { colorIncorrect, warn, header, menuTheme, renderQuestionDetail } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
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

async function askPostAnswerAction(): Promise<'explain' | 'next' | 'exit' | null> {
  try {
    return await select<'explain' | 'next' | 'exit'>({
      message: 'Next action:',
      choices: [
        { name: '💡 Explain answer', value: 'explain' as const },
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

async function askNextOrExit(): Promise<'next' | 'exit' | null> {
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

async function showGenerationError(domainSlug: string, error: string): Promise<void> {
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
  await router.showDomainMenu(domainSlug)
}

async function handleExplain(
  question: Question,
  userAnswer: AnswerOption,
  settings: SettingsFile,
): Promise<'next' | 'exit' | null> {
  const explainSpinner = ora('Generating explanation...').start()
  const explainResult = await generateExplanation(question, userAnswer, settings).finally(() => explainSpinner.stop())
  if (explainResult.ok) {
    console.log(`\n${explainResult.data}\n`)
  } else {
    console.warn(warn('Could not generate explanation.'))
  }
  return askNextOrExit()
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
      await showGenerationError(domainSlug, questionResult.error)
      return
    }

    const question = questionResult.data

    clearAndBanner()
    console.log(header(`📝 Quiz — ${domainSlug}`))
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

    renderQuestionDetail(record)

    // Post-answer action: explain, next, or exit
    let nextAction: 'explain' | 'next' | 'exit' | null = await askPostAnswerAction()

    if (nextAction === 'explain') {
      nextAction = await handleExplain(question, userAnswer, settings)
    }

    if (nextAction === null || nextAction === 'exit') {
      await router.showDomainMenu(domainSlug)
      return
    }
  }
}
