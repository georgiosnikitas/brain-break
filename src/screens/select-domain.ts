import { readDomain, writeDomain } from '../domain/store.js'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'
import { warn, success } from '../utils/format.js'
import { showQuiz } from './quiz.js'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function isReturningUser(lastSessionAt: string | null): boolean {
  if (lastSessionAt === null) return false
  return Date.now() - new Date(lastSessionAt).getTime() < SEVEN_DAYS_MS
}

export function isScoreTrendingUp(history: QuestionRecord[]): boolean {
  if (history.length < 6) return false
  const last6 = history.slice(-6)
  const firstHalf = last6.slice(0, 3).reduce((sum, r) => sum + r.scoreDelta, 0)
  const secondHalf = last6.slice(3).reduce((sum, r) => sum + r.scoreDelta, 0)
  return secondHalf > firstHalf
}

export async function showSelectDomainScreen(slug: string): Promise<void> {
  const result = await readDomain(slug)

  let domain = result.ok ? result.data : defaultDomainFile()

  if (!result.ok) {
    console.warn(warn(result.error))
    // Best-effort reset on disk so future reads start clean
    await writeDomain(slug, domain)
  }

  if (isReturningUser(domain.meta.lastSessionAt)) {
    console.log(success('Welcome back! Keep the streak going.'))
  }

  if (isScoreTrendingUp(domain.history)) {
    console.log(success('Your score is trending upward. You\'re on a roll!'))
  }

  await showQuiz(slug)
}
