import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { header, menuTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'

export type SprintConfig = {
  timeBudgetMs: number
  questionCount: number
}

export const TIME_BUDGET_CHOICES: Array<{ name: string; value: number }> = [
  { name: '2 min', value: 120_000 },
  { name: '5 min', value: 300_000 },
  { name: '10 min', value: 600_000 },
]

export const QUESTION_COUNT_CHOICES: Array<{ name: string; value: number }> = [
  { name: '5 questions', value: 5 },
  { name: '10 questions', value: 10 },
  { name: '20 questions', value: 20 },
]

type SprintSetupAction = 'confirm' | 'back'

function renderSprintSetupHeader(slug: string): void {
  console.log(header(`⏱️  Challenge Setup — ${slug}`))
}

export async function showSprintSetup(slug: string): Promise<SprintConfig | null> {
  clearAndBanner()
  renderSprintSetupHeader(slug)

  try {
    const timeBudgetMs = await select<number | 'back'>({
      message: 'Sprint duration:',
      choices: [
        ...TIME_BUDGET_CHOICES,
        new Separator(),
        { name: '←  Back', value: 'back' as const },
      ],
      theme: menuTheme,
    })

    if (timeBudgetMs === 'back') {
      return null
    }

    const questionCount = await select<number | 'back'>({
      message: 'Sprint size:',
      choices: [
        ...QUESTION_COUNT_CHOICES,
        new Separator(),
        { name: '←  Back', value: 'back' as const },
      ],
      theme: menuTheme,
    })

    if (questionCount === 'back') {
      return null
    }

    const action = await select<SprintSetupAction>({
      message: 'Ready to start?',
      choices: [
        { name: '🏁  Confirm', value: 'confirm' },
        new Separator(),
        { name: '←  Back', value: 'back' },
      ],
      theme: menuTheme,
    })

    if (action === 'back') {
      return null
    }

    return { timeBudgetMs, questionCount }
  } catch (err) {
    if (err instanceof ExitPromptError) {
      return null
    }
    throw err
  }
}