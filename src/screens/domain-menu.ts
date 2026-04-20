import { select, confirm, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain, readSettings } from '../domain/store.js'
import { defaultDomainFile, defaultSettings, type SessionData } from '../domain/schema.js'
import { bold, dim, warn, header, colorCorrect, colorIncorrect, colorDifficultyLevel, formatAccuracy, formatDuration, menuTheme } from '../utils/format.js'
import { formatTotalTimePlayed } from './stats.js'
import { clearAndBanner } from '../utils/screen.js'
import { renderCompactProgressLabel } from './ascii-art.js'
import * as router from '../router.js'

export type DomainMenuAction =
  | { action: 'play' }
  | { action: 'challenge' }
  | { action: 'history' }
  | { action: 'bookmarks' }
  | { action: 'stats' }
  | { action: 'my-coach' }
  | { action: 'ascii-art' }
  | { action: 'archive' }
  | { action: 'delete' }
  | { action: 'back' }

export function buildDomainMenuChoices(correctCount: number, threshold: number): Array<{ name: string; value: DomainMenuAction } | Separator> {
  const asciiArtLabel = threshold === 0 || correctCount >= threshold
    ? '🎨 ASCII Art ✨'
    : renderCompactProgressLabel(correctCount, threshold)
  return [
    { name: '▶ Play', value: { action: 'play' } },
    { name: '⏱️  Challenge', value: { action: 'challenge' } },
    { name: '📜 History', value: { action: 'history' } },
    { name: '⭐ Bookmarks', value: { action: 'bookmarks' } },
    { name: '📊 Statistics', value: { action: 'stats' } },
    { name: '🏋️  My Coach', value: { action: 'my-coach' } },
    { name: asciiArtLabel, value: { action: 'ascii-art' } },
    { name: '🗄  Archive', value: { action: 'archive' } },
    { name: '🗑  Delete', value: { action: 'delete' } },
    new Separator(),
    { name: '↩️  Back', value: { action: 'back' } },
  ]
}

function renderDomainHeader(slug: string, score: number, totalQuestions: number): void {
  const scoreLabel = dim('score: ' + score + ' · ' + totalQuestions + ' questions')
  const title = header('Domain — ' + slug)
  console.log(title + '  ' + scoreLabel)
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
  correctCount: number,
  threshold: number,
): Promise<DomainMenuAction | null> {
  renderDomainHeader(slug, score, totalQuestions)
  if (sessionData && sessionData.records.length > 0) {
    renderSessionSummary(sessionData, endingDifficulty)
  }

  try {
    return await select<DomainMenuAction>({
      message: 'Choose an action:',
      choices: buildDomainMenuChoices(correctCount, threshold),
      theme: menuTheme,
      pageSize: 12,
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
  const answeredLabel = sessionData.sprintResult
    ? records.length + ' / ' + sessionData.sprintResult.totalQuestions
    : String(records.length)
  console.log('📝 ' + bold('Questions answered:') + ' ' + answeredLabel)

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

  // 9. Sprint result (challenge sessions only)
  if (sessionData.sprintResult) {
    const { questionsAnswered, totalQuestions, timedOut } = sessionData.sprintResult
    if (timedOut) {
      const label = 'Time expired — ' + questionsAnswered + ' / ' + totalQuestions + ' questions answered'
      console.log('⚡ ' + bold('Sprint result:') + ' ' + colorIncorrect(label))
    }
  }

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
    const correctCount = domain.history.filter((r) => r.isCorrect).length

    const settingsResult = await readSettings()
    const threshold = (settingsResult.ok ? settingsResult.data : defaultSettings()).asciiArtMilestone

    const answer = await promptForDomainAction(
      slug,
      score,
      totalQuestions,
      sessionData,
      domain.meta.difficultyLevel,
      correctCount,
      threshold,
    )
    sessionData = undefined

    if (answer === null) {
      await router.showHome()
      return
    }

    const result = await handleDomainAction(slug, answer, correctCount, threshold)
    if (result === false) {
      return
    }
    if (result !== null) {
      sessionData = result
    }
  }
}

async function confirmAndDeleteDomain(slug: string): Promise<false | null> {
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
  return null
}

async function handleDomainAction(slug: string, answer: DomainMenuAction, correctCount: number, threshold: number): Promise<false | SessionData | null> {
  if (answer.action === 'play') {
    return await router.showQuiz(slug)
  } else if (answer.action === 'challenge') {
    return await router.showChallenge(slug)
  } else if (answer.action === 'history') {
    await router.showHistory(slug)
  } else if (answer.action === 'bookmarks') {
    await router.showBookmarks(slug)
  } else if (answer.action === 'stats') {
    await router.showStats(slug)
  } else if (answer.action === 'my-coach') {
    await router.showMyCoach(slug)
  } else if (answer.action === 'ascii-art') {
    await router.showAsciiArt(slug, correctCount, threshold)
  } else if (answer.action === 'archive') {
    await router.archiveDomain(slug)
    await router.showHome()
    return false
  } else if (answer.action === 'delete') {
    return await confirmAndDeleteDomain(slug)
  } else {
    await router.showHome()
    return false
  }
  return null
}
