import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExitPromptError } from '@inquirer/core'

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  Separator: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({
  clearAndBanner: vi.fn(),
}))

vi.mock('../utils/format.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/format.js')>()
  return {
    ...actual,
  }
})

import { select } from '@inquirer/prompts'
import { clearAndBanner } from '../utils/screen.js'
import {
  QUESTION_COUNT_CHOICES,
  TIME_BUDGET_CHOICES,
  showSprintSetup,
} from './sprint-setup.js'

const mockSelect = vi.mocked(select)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('showSprintSetup', () => {
  it('calls clearAndBanner on entry before prompting', async () => {
    mockSelect
      .mockResolvedValueOnce(120_000)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce('confirm')

    await showSprintSetup('typescript')

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledOnce()
    expect(vi.mocked(clearAndBanner).mock.invocationCallOrder[0]).toBeLessThan(mockSelect.mock.invocationCallOrder[0])
  })

  it('prompts for time budget, question count, and confirm/back', async () => {
    mockSelect
      .mockResolvedValueOnce(300_000)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce('confirm')

    await showSprintSetup('typescript')

    expect(mockSelect).toHaveBeenCalledTimes(3)
    expect(mockSelect.mock.calls[0][0]).toMatchObject({
      message: 'Sprint duration:',
    })
    const durationChoices = mockSelect.mock.calls[0][0].choices
    expect(durationChoices[0]).toEqual(TIME_BUDGET_CHOICES[0])
    expect(durationChoices[1]).toEqual(TIME_BUDGET_CHOICES[1])
    expect(durationChoices[2]).toEqual(TIME_BUDGET_CHOICES[2])
    expect(durationChoices[4]).toMatchObject({ name: '↩️  Back', value: 'back' })

    expect(mockSelect.mock.calls[1][0]).toMatchObject({
      message: 'Sprint size:',
    })
    const sizeChoices = mockSelect.mock.calls[1][0].choices
    expect(sizeChoices[0]).toEqual(QUESTION_COUNT_CHOICES[0])
    expect(sizeChoices[1]).toEqual(QUESTION_COUNT_CHOICES[1])
    expect(sizeChoices[2]).toEqual(QUESTION_COUNT_CHOICES[2])
    expect(sizeChoices[4]).toMatchObject({ name: '↩️  Back', value: 'back' })
    expect(mockSelect.mock.calls[2][0]).toMatchObject({
      message: 'Ready to start?',
      choices: [
        { name: '🏁 Confirm', value: 'confirm' },
        expect.any(Object),
        { name: '↩️  Back', value: 'back' },
      ],
    })
  })

  it('returns the selected sprint config on confirm', async () => {
    mockSelect
      .mockResolvedValueOnce(600_000)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce('confirm')

    await expect(showSprintSetup('typescript')).resolves.toEqual({
      timeBudgetMs: 600_000,
      questionCount: 20,
    })
  })

  it('returns null when Back is selected at the final prompt', async () => {
    mockSelect
      .mockResolvedValueOnce(120_000)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce('back')

    await expect(showSprintSetup('typescript')).resolves.toBeNull()
  })

  it('returns null when Back is selected at sprint duration', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await expect(showSprintSetup('typescript')).resolves.toBeNull()
    expect(mockSelect).toHaveBeenCalledOnce()
  })

  it('returns null when Back is selected at sprint size', async () => {
    mockSelect
      .mockResolvedValueOnce(300_000)
      .mockResolvedValueOnce('back')

    await expect(showSprintSetup('typescript')).resolves.toBeNull()
    expect(mockSelect).toHaveBeenCalledTimes(2)
  })

  it('returns null on ExitPromptError', async () => {
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await expect(showSprintSetup('typescript')).resolves.toBeNull()
    expect(mockSelect).toHaveBeenCalledOnce()
  })

  it('re-throws non-ExitPromptError', async () => {
    mockSelect.mockRejectedValueOnce(new Error('boom'))

    await expect(showSprintSetup('typescript')).rejects.toThrow('boom')
  })
})

describe('sprint setup choices', () => {
  it('exports the expected time budget choices', () => {
    expect(TIME_BUDGET_CHOICES).toHaveLength(3)
    expect(TIME_BUDGET_CHOICES.map((choice) => choice.value)).toEqual([120_000, 300_000, 600_000])
  })

  it('exports the expected question count choices', () => {
    expect(QUESTION_COUNT_CHOICES).toHaveLength(3)
    expect(QUESTION_COUNT_CHOICES.map((choice) => choice.value)).toEqual([5, 10, 20])
  })
})