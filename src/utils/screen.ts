import { createRequire } from 'node:module'
import { bold, gradientShadow, getGradientWidth, gradientText, typewriterPrint, ASCII_ART } from './format.js'

const require = createRequire(import.meta.url)
// Path is relative to compiled output depth; keep in sync with tsconfig outDir
const { version } = require('../../package.json')

export function clearScreen(): void {
  process.stdout.write('\x1Bc')
}

export function banner(): void {
  const width = getGradientWidth()
  console.log(bold(' \ud83e\udde0\ud83d\udd28 Brain Break'))
  console.log(gradientShadow(width))
}

export function clearAndBanner(): void {
  clearScreen()
  banner()
}

export async function renderBrandedScreen(message: string): Promise<void> {
  clearScreen()

  const width = getGradientWidth()
  const versionText = `v${version}`
  const artLines = ASCII_ART.map((line, i) => gradientText(`  ${line}`, i, ASCII_ART.length))

  console.log()
  console.log(`  🧠🔨`)
  for (const line of artLines) {
    console.log(line)
  }
  console.log()
  process.stdout.write(`  > `)
  await typewriterPrint(message)
  console.log(`  ${versionText}`)
  console.log()
  console.log(gradientShadow(width))
  console.log()
}
