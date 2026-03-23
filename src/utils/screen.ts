import { bold, gradientShadow, getGradientWidth } from './format.js'

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
