import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain } from '../domain/store.js'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'
import { warn, bold, header, formatAccuracy, menuTheme } from '../utils/format.js'
import { clearScreen } from '../utils/screen.js'
import * as router from '../router.js'

export function formatTotalTimePlayed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || h > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

export function difficultyLabel(level: number): string {
  const labels: Record<number, string> = {
    1: '1 — Beginner',
    2: '2 — Easy',
    3: '3 — Intermediate',
    4: '4 — Advanced',
    5: '5 — Expert',
  }
  return labels[level] ?? `${level}`
}

export function computeScoreTrend(
  history: QuestionRecord[],
  nowMs: number = Date.now(),
): 'growing' | 'flat' | 'declining' {
  const thirtyDaysAgo = nowMs - 30 * 24 * 60 * 60 * 1000
  const recent = history.filter((r) => new Date(r.answeredAt).getTime() >= thirtyDaysAgo)
  if (recent.length === 0) return 'flat'
  const sum = recent.reduce((acc, r) => acc + r.scoreDelta, 0)
  if (sum > 0) return 'growing'
  if (sum < 0) return 'declining'
  return 'flat'
}

export function daysSinceFirstSession(
  history: QuestionRecord[],
  nowMs: number = Date.now(),
): number | null {
  if (history.length === 0) return null
  const earliest = history.reduce(
    (min, r) => Math.min(min, new Date(r.answeredAt).getTime()),
    Infinity,
  )
  return Math.floor((nowMs - earliest) / (24 * 60 * 60 * 1000))
}

export function computeReturnStreak(history: QuestionRecord[], nowMs: number = Date.now()): number {
  if (history.length === 0) return 0
  const dateSet = new Set(history.map((r) => r.answeredAt.slice(0, 10)))
  const dates = [...dateSet].sort((a, b) => a.localeCompare(b)).reverse()
  const mostRecentDayMs = new Date(dates[0] + 'T00:00:00.000Z').getTime()
  const daysSinceMostRecent = Math.floor((nowMs - mostRecentDayMs) / (24 * 60 * 60 * 1000))
  if (daysSinceMostRecent > 1) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const diffDays = Math.round(
      (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) /
        (24 * 60 * 60 * 1000),
    )
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export async function showStats(domainSlug: string, nowMs: number = Date.now()): Promise<void> {
  const readResult = await readDomain(domainSlug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
  }
  const domain = readResult.ok ? readResult.data : defaultDomainFile()
  const { meta, history } = domain

  const total = history.length
  const correct = history.filter((r) => r.isCorrect).length
  const incorrect = total - correct

  clearScreen()
  console.log(header('\nStats Dashboard'))

  if (total === 0) {
    console.log(bold('Score:') + ` ${meta.score}`)
    console.log(bold('Questions answered:') + ' 0')
    console.log(bold('Correct / Incorrect:') + ' 0 / 0')
    console.log(bold('Accuracy:') + ' No data yet')
    console.log(bold('Total time played:') + ' No data yet')
    console.log(bold('Difficulty:') + ` ${difficultyLabel(meta.difficultyLevel)}`)
    console.log(bold('Score trend (30 days):') + ' No data yet')
    console.log(bold('Days since first session:') + ' No data yet')
    console.log(bold('Return streak:') + ' No data yet')
  } else {
    const trend = computeScoreTrend(history)
    const trendLabels = { growing: 'Growing 📈', declining: 'Declining 📉', flat: 'Flat ➡️' }
    const trendLabel = trendLabels[trend]
    const daySinceFirst = daysSinceFirstSession(history)
    const streak = computeReturnStreak(history, nowMs)

    console.log(bold('Score:') + ` ${meta.score}`)
    console.log(bold('Questions answered:') + ` ${total}`)
    console.log(bold('Correct / Incorrect:') + ` ${correct} / ${incorrect}`)
    console.log(bold('Accuracy:') + ` ${formatAccuracy(correct, total)}`)
    console.log(bold('Total time played:') + ` ${formatTotalTimePlayed(meta.totalTimePlayedMs)}`)
    console.log(bold('Difficulty:') + ` ${difficultyLabel(meta.difficultyLevel)}`)
    console.log(bold('Score trend (30 days):') + ` ${trendLabel}`)
    console.log(bold('Days since first session:') + ` ${daySinceFirst!}`)
    console.log(
      bold('Return streak:') + ` ${streak} day${streak === 1 ? '' : 's'}`,
    )
  }

  try {
    await select({
      message: 'Navigation',
      choices: [{ name: '←  Back', value: 'back' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) {
      await router.showDomainMenu(domainSlug)
      return
    }
    throw err
  }
  await router.showDomainMenu(domainSlug)
}
