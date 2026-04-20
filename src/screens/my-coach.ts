import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { readDomain, readSettings, writeDomain } from '../domain/store.js'
import { defaultSettings, MAX_COACH_REPORT_LENGTH, type DomainFile, type MyCoachScope, type QuestionRecord, type SettingsFile } from '../domain/schema.js'
import { generateCoachReport } from '../ai/client.js'
import { header, dim, warn, error as errorFmt, menuTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'

type CoachAction = 'regenerate' | 'back'

const TIP_THRESHOLD = 25
const STALENESS_THRESHOLD = 25
const EMPTY_HISTORY_MESSAGE = 'Answer at least one question before using My Coach.'

export function sliceHistoryByScope(history: QuestionRecord[], scope: MyCoachScope): QuestionRecord[] {
  if (scope === 'all') return history
  const n = scope === '25' ? 25 : 100
  return history.length <= n ? history : history.slice(-n)
}

export function formatCoachTimestamp(date: Date): string {
  const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${datePart} at ${timePart}`
}

type CachedCoachReport = { report: string; generatedAt: Date; previousCoachCount: number }

type GenerateOutcome =
  | { ok: true; report: string; historyLength: number; previousCoachCount: number; generatedAt: Date }
  | { ok: false; error: string }

async function generateAndPersist(slug: string, domain: DomainFile, settings: SettingsFile): Promise<GenerateOutcome> {
  const previousCoachCount = domain.meta.lastCoachQuestionCount ?? 0
  const scopedHistory = sliceHistoryByScope(domain.history, settings.myCoachScope)

  const spinner = ora('Generating coaching report...').start()
  const result = await generateCoachReport(slug, scopedHistory, settings)
  spinner.stop()

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  const report = normalizeCoachReport(result.data)
  const generatedAt = new Date()
  const updated = {
    ...domain,
    meta: {
      ...domain.meta,
      lastCoachQuestionCount: domain.history.length,
      lastCoachTimestamp: generatedAt.toISOString(),
      lastCoachReport: report,
    },
  }
  const writeResult = await writeDomain(slug, updated)
  if (!writeResult.ok) {
    return { ok: false, error: writeResult.error }
  }

  return {
    ok: true,
    report,
    historyLength: domain.history.length,
    previousCoachCount,
    generatedAt,
  }
}

function normalizeCoachReport(report: string): string {
  if (report.length <= MAX_COACH_REPORT_LENGTH) {
    return report
  }

  return report.slice(0, MAX_COACH_REPORT_LENGTH).trimEnd()
}

async function promptBackOnly(): Promise<void> {
  try {
    await select<'back'>({
      message: 'Navigation',
      choices: [
        new Separator(),
        { name: '↩️  Back', value: 'back' },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return
    throw err
  }
}

async function promptRegenerateOrBack(stalenessNotice: string = ''): Promise<CoachAction | null> {
  logDimNotice(stalenessNotice)
  try {
    return await select<CoachAction>({
      message: 'Navigation',
      choices: [
        { name: '🔄 Regenerate', value: 'regenerate' },
        new Separator(),
        { name: '↩️  Back', value: 'back' },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

function logDimNotice(notice: string): void {
  if (!notice) {
    return
  }

  console.log(dim(notice))
  console.log()
}

function getTipMessage(historyLength: number): string {
  return historyLength < TIP_THRESHOLD
    ? 'Tip: Reports become more accurate with at least 25 answered questions.'
    : ''
}

function renderReport(report: string, historyLength: number, generatedAt: Date, freshDataNotice: string = ''): void {
  console.log(dim(`Generated: ${formatCoachTimestamp(generatedAt)}`))
  console.log()

  logDimNotice(freshDataNotice)
  logDimNotice(getTipMessage(historyLength))

  console.log(report)
  console.log()
}

function computeNewQuestions(historyLength: number, previousCoachCount: number): number {
  return Math.max(0, historyLength - previousCoachCount)
}

function computeStalenessNotice(historyLength: number, previousCoachCount: number): string {
  const newQuestions = computeNewQuestions(historyLength, previousCoachCount)
  const questionLabel = newQuestions === 1 ? 'question' : 'questions'
  return newQuestions >= STALENESS_THRESHOLD
    ? ''
    : `Only ${newQuestions} new ${questionLabel} answered since your last report — the new report may not differ significantly.`
}

function computeFreshDataNotice(historyLength: number, previousCoachCount: number): string {
  const newQuestions = computeNewQuestions(historyLength, previousCoachCount)
  return newQuestions < STALENESS_THRESHOLD
    ? ''
    : `${newQuestions} new questions since this report — consider regenerating for fresh insights.`
}

function renderCoachHeader(slug: string): void {
  clearAndBanner()
  console.log(header(`🏋️ My Coach — ${slug}`))
}

function showNoHistoryWarning(): void {
  console.log(dim(EMPTY_HISTORY_MESSAGE))
}

function hasAnsweredQuestions(domain: DomainFile): boolean {
  return domain.history.length > 0
}

function getCachedCoachReport(domain: DomainFile): CachedCoachReport | null {
  const report = domain.meta.lastCoachReport
  const timestamp = domain.meta.lastCoachTimestamp
  const previousCoachCount = domain.meta.lastCoachQuestionCount

  if (!report || !timestamp || previousCoachCount === undefined) {
    return null
  }

  if (previousCoachCount <= 0 || previousCoachCount > domain.history.length) {
    return null
  }

  return {
    report,
    generatedAt: new Date(timestamp),
    previousCoachCount,
  }
}

function readSettingsOrDefault(settingsResult: Awaited<ReturnType<typeof readSettings>>): SettingsFile {
  return settingsResult.ok ? settingsResult.data : defaultSettings()
}

async function readDomainOrShowError(slug: string): Promise<DomainFile | null> {
  const domainResult = await readDomain(slug)
  if (!domainResult.ok) {
    console.log(errorFmt(domainResult.error))
    return null
  }

  return domainResult.data
}

async function loadCoachDomainForView(slug: string): Promise<DomainFile | null> {
  renderCoachHeader(slug)
  return await readDomainOrShowError(slug)
}

async function renderGeneratedReport(slug: string, domain: DomainFile, settings: SettingsFile): Promise<boolean> {
  const outcome = await generateAndPersist(slug, domain, settings)
  if (!outcome.ok) {
    console.log(errorFmt(outcome.error))
    return false
  }

  renderReport(outcome.report, outcome.historyLength, outcome.generatedAt)
  return true
}

async function renderInitialCoachView(slug: string): Promise<string | null> {
  const domain = await loadCoachDomainForView(slug)
  if (!domain) {
    return null
  }

  if (!hasAnsweredQuestions(domain)) {
    showNoHistoryWarning()
    await promptBackOnly()
    return null
  }

  const cached = getCachedCoachReport(domain)
  if (!cached) {
    const ok = await renderGeneratedReport(slug, domain, readSettingsOrDefault(await readSettings()))
    if (!ok) return null
    // First-ever generation: no prior report exists, so a staleness notice would be misleading.
    return ''
  }

  const freshDataNotice = computeFreshDataNotice(domain.history.length, cached.previousCoachCount)
  renderReport(cached.report, domain.history.length, cached.generatedAt, freshDataNotice)
  return computeStalenessNotice(domain.history.length, cached.previousCoachCount)
}

async function runRegenerateLoop(slug: string): Promise<void> {
  while (true) {
    const settings = readSettingsOrDefault(await readSettings())

    const domain = await loadCoachDomainForView(slug)
    if (!domain) {
      return
    }

    const rendered = await renderGeneratedReport(slug, domain, settings)
    if (!rendered) {
      return
    }

    // After regeneration, lastCoachQuestionCount = history.length → always 0 new questions
    const stalenessNotice = computeStalenessNotice(domain.history.length, domain.history.length)
    const action = await promptRegenerateOrBack(stalenessNotice)
    if (action !== 'regenerate') {
      return
    }
  }
}

export async function showMyCoachScreen(slug: string): Promise<void> {
  const stalenessNotice = await renderInitialCoachView(slug)
  if (stalenessNotice === null) {
    return
  }

  const firstAction = await promptRegenerateOrBack(stalenessNotice)
  if (firstAction !== 'regenerate') {
    return
  }

  await runRegenerateLoop(slug)
}
