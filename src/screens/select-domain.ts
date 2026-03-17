import { readDomain, writeDomain, readSettings } from '../domain/store.js'
import { defaultDomainFile, defaultSettings, type QuestionRecord } from '../domain/schema.js'
import { warn, success, typewrite } from '../utils/format.js'
import { clearScreen } from '../utils/screen.js'
import { generateMotivationalMessage } from '../ai/client.js'
import ora from 'ora'
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
  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()

  const result = await readDomain(slug)

  let domain = result.ok ? result.data : defaultDomainFile()

  if (!result.ok) {
    console.warn(warn(result.error))
    // Best-effort reset on disk so future reads start clean
    await writeDomain(slug, domain)
  }

  const triggers: Array<'returning' | 'trending'> = []
  if (isReturningUser(domain.meta.lastSessionAt)) triggers.push('returning')
  if (isScoreTrendingUp(domain.history)) triggers.push('trending')

  if (triggers.length > 0) {
    const spinner = ora('Getting your message...').start()
    const messages = await Promise.all(triggers.map((t) => generateMotivationalMessage(t, settings)))
    spinner.stop()
    for (const msg of messages) {
      if (msg.ok && msg.data) await typewrite(success(msg.data))
    }
  }

  await showQuiz(slug)
}
