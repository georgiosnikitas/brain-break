import { z } from 'zod'
import { AnswerOptionSchema, type SettingsFile } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Zod schema for the structured JSON the model must return
// ---------------------------------------------------------------------------
export const QuestionResponseSchema = z.object({
  question: z.string().min(1),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  correctAnswer: AnswerOptionSchema,
  difficultyLevel: z.number().int().min(1).max(5),
  speedThresholds: z.object({
    fastMs: z.number().int().positive(),
    slowMs: z.number().int().positive(),
  }).refine((t) => t.slowMs > t.fastMs, {
    message: 'slowMs must be greater than fastMs',
  }),
})

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
function sanitizeInput(input: string): string {
  return input.replaceAll(/[\r\n]+/g, ' ').replaceAll('"', "'")
}

function buildVoiceInstruction(settings: SettingsFile): string {
  if (settings.language === 'English' && settings.tone === 'normal') return ''
  const safeLanguage = sanitizeInput(settings.language)
  const article = /^[aeiou]/i.test(settings.tone) ? 'an' : 'a'
  const toneClause = settings.tone === 'normal' ? '' : ` using ${article} ${settings.tone} tone of voice`
  return `Respond in ${safeLanguage}${toneClause}.\n\n`
}

export function buildQuestionPrompt(domain: string, difficultyLevel: number, settings?: SettingsFile): string {
  const safeDomain = sanitizeInput(domain)
  const voiceInstruction = settings ? buildVoiceInstruction(settings) : ''
  return `${voiceInstruction}You are a quiz engine. Generate a single multiple-choice question on the topic of "${safeDomain}" at difficulty level ${difficultyLevel} (scale 1–5, where 1=beginner and 5=expert).

Respond with ONLY a JSON object in this exact shape — no markdown fences, no extra text:
{
  "question": "<the question text>",
  "options": {
    "A": "<option A>",
    "B": "<option B>",
    "C": "<option C>",
    "D": "<option D>"
  },
  "correctAnswer": "<A, B, C, or D>",
  "difficultyLevel": ${difficultyLevel},
  "speedThresholds": {
    "fastMs": <milliseconds for a fast response>,
    "slowMs": <milliseconds for a slow response>
  }
}

Rules:
- The question must be unambiguous with exactly one correct answer.
- All four options must be plausible.
- correctAnswer must be exactly one of: "A", "B", "C", or "D".
- fastMs should be between 5000 and 15000; slowMs must be greater than fastMs and between 20000 and 45000.
- Do NOT include any text outside the JSON object.`
}

export function buildDeduplicationPrompt(
  domain: string,
  difficultyLevel: number,
  previousQuestions: string[],
  settings?: SettingsFile,
): string {
  const questionList = previousQuestions
    .map((q, i) => `${i + 1}. "${sanitizeInput(q)}"`)
    .join('\n')
  return `${buildQuestionPrompt(domain, difficultyLevel, settings)}

IMPORTANT: Do NOT repeat any of the following questions that were already asked:
${questionList}
Generate a completely different question.`
}

export type MotivationalTrigger = 'returning' | 'trending'

export function buildMotivationalPrompt(trigger: MotivationalTrigger, settings?: SettingsFile): string {
  const voiceInstruction = settings ? buildVoiceInstruction(settings) : ''
  const triggerInstruction = trigger === 'returning'
    ? 'The user has returned to practise again within the last 7 days. Write a 1–2 sentence motivational message acknowledging their return and encouraging them to keep going.'
    : 'The user\'s quiz score is trending upward. Write a 1–2 sentence motivational message congratulating them on improving their score.'
  return `${voiceInstruction}${triggerInstruction}

Reply with ONLY the motivational message — no JSON, no quotes, no extra text.`
}
