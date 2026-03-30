import { select, confirm, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain } from '../domain/store.js'
import { defaultDomainFile, type SessionData } from '../domain/schema.js'
import { bold, dim, warn, colorCorrect, colorIncorrect, colorDifficultyLevel, formatAccuracy, formatDuration, menuTheme } from '../utils/format.js'
import { formatTotalTimePlayed } from './stats.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'

export type DomainMenuAction =
  | { action: 'play' }
  | { action: 'history' }
  | { action: 'bookmarks' }
  | { action: 'stats' }
  | { action: 'archive' }
  | { action: 'delete' }
  | { action: 'back' }

export function buildDomainMenuChoices(): Array<{ name: string; value: DomainMenuAction } | Separator> {
  return [
    { name: '▶  Play', value: { action: 'play' } },
    { name: '📜  View History', value: { action: 'history' } },
    { name: '⭐  View Bookmarks', value: { action: 'bookmarks' } },
    { name: '📊  View Stats', value: { action: 'stats' } },
    { name: '🗄  Archive', value: { action: 'archive' } },
    { name: '🗑  Delete', value: { action: 'delete' } },
    new Separator(),
    { name: '←  Back', value: { action: 'back' } },
  ]
}

function renderDomainHeader(slug: string, score: number, totalQuestions: number): void {
  const scoreLabel = dim(`score: ${score} · ${totalQuestions} questions`)
  console.log(`${bold(slug)}  ${scoreLabel}`)
}

function formatColoredDifficultyLabel(level: number): string {
  return `${level} — ${colorDifficultyLevel(level)}`
}

function computeSessionDuration(records: SessionData['records']): number {
  const firstRecord = records[0]
  const lastRecord = records.at(-1) ?? firstRecord
  const sessionStartMs = new Date(firstRecord.answeredAt).getTime() - firstRecord.timeTakenMs
  const sessionEndMs = new Date(lastRecord.answeredAt).getTime()
  return Math.max(0, sessionEndMs - sessionStartMs)
}

async function promptForDomainAction(
  slug: string,
  score: number,
  totalQuestions: number,
  sessionData: SessionData | null | undefined,
  endingDifficulty: number,
): Promise<DomainMenuAction | null> {
  renderDomainHeader(slug, score, totalQuestions)
  if (sessionData && sessionData.records.length > 0) {
    renderSessionSummary(sessionData, endingDifficulty)
  }

  try {
    return await select<DomainMenuAction>({
      message: 'Choose an action:',
      choices: buildDomainMenuChoices(),
      theme: menuTheme,
      pageSize: 10,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) {
      return null
    }
    throw err
  }
}

export function renderSessionSummary(sessionData: SessionData, endingDifficulty: number): void {
  const { records, startingDifficulty } = sessionData

  console.log(dim('── Last Session ──────'))

  // 1. Score delta
  const totalDelta = records.reduce((sum, r) => sum + r.scoreDelta, 0)
  const deltaStr = totalDelta >= 0 ? `+${totalDelta}` : `${totalDelta}`
  const colorDelta = totalDelta >= 0 ? colorCorrect : colorIncorrect
  console.log('🏆 ' + bold('Score delta:') + ` ${colorDelta(deltaStr)}`)

  // 2. Questions answered
  console.log('📝 ' + bold('Questions answered:') + ` ${records.length}`)

  // 3. Correct / Incorrect
  const correctCount = records.filter((r) => r.isCorrect).length
  const incorrectCount = records.length - correctCount
  console.log('✅ ' + bold('Correct / Incorrect:') + ` ${correctCount} / ${incorrectCount}`)

  // 4. Accuracy
  console.log('🎯 ' + bold('Accuracy:') + ` ${formatAccuracy(correctCount, records.length)}`)

  // 5. Fastest answer
  const fastest = Math.min(...records.map((r) => r.timeTakenMs))
  console.log('🐇 ' + bold('Fastest answer:') + ` ${colorCorrect(formatDuration(fastest))}`)

  // 6. Slowest answer
  const slowest = Math.max(...records.map((r) => r.timeTakenMs))
  console.log('🐢 ' + bold('Slowest answer:') + ` ${colorIncorrect(formatDuration(slowest))}`)

  // 7. Session duration
  const totalMs = computeSessionDuration(records)
  console.log('⏱️  ' + bold('Session duration:') + ` ${formatTotalTimePlayed(totalMs)}`)

  // 8. Difficulty
  let indicator = ''
  if (endingDifficulty > startingDifficulty) {
    indicator = colorCorrect('▲')
  } else if (endingDifficulty < startingDifficulty) {
    indicator = colorIncorrect('▼')
  }
  const difficultySuffix = indicator ? ` ${indicator}` : ''
  console.log(
    '📈 ' +
      bold('Difficulty:') +
      ` ${formatColoredDifficultyLabel(startingDifficulty)} → ${formatColoredDifficultyLabel(endingDifficulty)}${difficultySuffix}`,
  )

  console.log(dim('─────────────────────'))
}

export async function showDomainMenuScreen(slug: string, sessionData?: SessionData | null): Promise<void> {
  while (true) {
    clearAndBanner()
    const readResult = await readDomain(slug)
    if (!readResult.ok) {
      console.warn(warn(readResult.error))
    }
    const domain = readResult.ok ? readResult.data : defaultDomainFile()
    const score = domain.meta.score
    const totalQuestions = domain.history.length

    const answer = await promptForDomainAction(
      slug,
      score,
      totalQuestions,
      sessionData,
      domain.meta.difficultyLevel,
    )
    sessionData = undefined

    if (answer === null) {
      await router.showHome()
      return
    }

    const result = await handleDomainAction(slug, answer)
    if (result === false) {
      return
    }
    if (result !== null) {
      sessionData = result
    }
  }
}

async function handleDomainAction(slug: string, answer: DomainMenuAction): Promise<false | SessionData | null> {
  if (answer.action === 'play') {
    return await router.showQuiz(slug)
  } else if (answer.action === 'history') {
    await router.showHistory(slug)
  } else if (answer.action === 'bookmarks') {
    await router.showBookmarks(slug)
  } else if (answer.action === 'stats') {
    await router.showStats(slug)
  } else if (answer.action === 'archive') {
    await router.archiveDomain(slug)
    await router.showHome()
    return false
  } else if (answer.action === 'delete') {
    let confirmed: boolean
    try {
      confirmed = await confirm({
        message: `Delete "${slug}" permanently? This cannot be undone.`,
        default: false,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) {
        await router.showHome()
        return false
      }
      throw err
    }
    if (confirmed) {
      await router.deleteDomain(slug)
      await router.showHome()
      return false
    }
  } else {
    await router.showHome()
    return false
  }
  return null
}
