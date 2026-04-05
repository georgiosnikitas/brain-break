import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import * as crypto from 'node:crypto'
import chalk from 'chalk'
import figlet from 'figlet'
import { header, menuTheme, gradientText, dim, lerpColor, getTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'

export const FIGLET_FONTS = [
  'Standard',
  'Big',
  'Slant',
  'Shadow',
  'Doom',
  '3-D',
  'Graffiti',
  'Colossal',
  'Roman',
  'ANSI Shadow',
  'Banner3-D',
  'Ogre',
  'Larry 3D',
  'Star Wars',
] as const

type AsciiArtAction = 'regenerate' | 'back'

export function pickRandomFont(previousFont?: string): string {
  const availableFonts =
    previousFont === undefined ? FIGLET_FONTS : FIGLET_FONTS.filter((font) => font !== previousFont)
  return availableFonts[crypto.randomInt(availableFonts.length)]
}

export function colorAsciiArt(art: string): string {
  if (art === '') return ''
  const lines = art.split('\n')
  // Strip trailing empty lines
  while (lines.length > 0 && lines.at(-1)?.trim() === '') {
    lines.pop()
  }
  if (lines.length === 0) return ''
  const totalRows = lines.length
  return lines.map((line, row) => gradientText(line, row, totalRows)).join('\n')
}

export function renderProgressBar(correctCount: number, total: number, width: number): string {
  const ratio = total <= 0 ? 0 : correctCount / total
  const filledCount = Math.max(0, Math.min(width, Math.round(ratio * width)))
  let filled = ''
  for (let i = 0; i < filledCount; i++) {
    const t = width <= 1 ? 0 : i / (width - 1)
    const c = lerpColor(t)
    if (chalk.level < 3) {
      filled += getTheme() === 'dark' ? chalk.bold.cyan('█') : chalk.bold.blue('█')
    } else {
      filled += chalk.rgb(c.r, c.g, c.b)('█')
    }
  }
  const unfilled = dim('░').repeat(width - filledCount)
  return '[' + filled + unfilled + ']'
}

export function renderCompactProgressLabel(correctCount: number, threshold: number): string {
  if (threshold <= 0) {
    return '🎨 ASCII Art ✨'
  }
  const pct = Math.min(Math.floor((correctCount / threshold) * 100), 99)
  const bar = renderProgressBar(correctCount, threshold, 10)
  return '🎨 ASCII Art ' + bar + ' ' + pct + '%'
}

export async function showAsciiArtScreen(slug: string, correctCount: number, threshold: number): Promise<void> {
  if (threshold > 0 && correctCount < threshold) {
    clearAndBanner()
    console.log(header('🎨 ASCII Art — ' + slug))
    console.log()
    console.log(`🔒 ASCII Art unlocks when you've answered ${threshold} questions correctly!`)
    const pct = Math.floor((correctCount / threshold) * 100)
    console.log(renderProgressBar(correctCount, threshold, 30) + '  ' + pct + '% — keep going!')

    try {
      await select<'back'>({
        message: 'Navigation',
        choices: [
          new Separator(),
          { name: '↩️  Back', value: 'back' as const },
        ],
        theme: menuTheme,
      })
    } catch (err) {
      if (!(err instanceof ExitPromptError)) {
        throw err
      }
    }
    return
  }
  let font: string | undefined

  while (true) {
    font = pickRandomFont(font)
    const art = figlet.textSync(slug, { font })

    clearAndBanner()
    console.log(header('🎨 ASCII Art — ' + slug))
    console.log()
    console.log(colorAsciiArt(art))

    let action: AsciiArtAction
    try {
      action = await select<AsciiArtAction>({
        message: 'Navigation',
        choices: [
          { name: '🔄 Regenerate', value: 'regenerate' },
          new Separator(),
          { name: '↩️  Back', value: 'back' },
        ],
        theme: menuTheme,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) {
        await router.showDomainMenu(slug)
        return
      }
      throw err
    }

    if (action === 'back') {
      break
    }
  }

  await router.showDomainMenu(slug)
}
