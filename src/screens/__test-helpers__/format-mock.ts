/**
 * Shared format mock for welcome and exit screen tests.
 * Export a factory so each test file gets isolated mock functions.
 */
import { vi } from 'vitest'

export function createFormatMock() {
  return {
    ASCII_ART: [
      ' ____            _          ____                 _    ',
      '| __ ) _ __ __ _(_)_ __    | __ ) _ __ ___  __ _| | __',
      '|  _ \\| \'__/ _` | | \'_ \\   |  _ \\| \'__/ _ \\/ _` | |/ /',
      '| |_) | | | (_| | | | | |  | |_) | | |  __/ (_| |   < ',
      '|____/|_|  \\__,_|_|_| |_|  |____/|_|  \\___|\\__,_|_|\\_\\',
    ],
    gradientShadow: vi.fn((width: number) => `[shadow:${width}]`),
    getGradientWidth: vi.fn(() => 60),
    lerpColor: vi.fn(() => ({ r: 100, g: 90, b: 160 })),
    gradientText: vi.fn((text: string) => text),
    typewriterPrint: vi.fn(),
    cancellableSleep: vi.fn(() => ({ promise: new Promise<void>(() => {}), cancel: vi.fn() })),
    menuTheme: { style: { highlight: (t: string) => t } },
  }
}
