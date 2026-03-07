import { z } from 'zod'
import { AnswerOptionSchema } from '../domain/schema.js'

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
  }),
})

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
export function buildQuestionPrompt(domain: string, difficultyLevel: number): string {
  return `You are a technical quiz engine. Generate a single multiple-choice question on the topic of "${domain}" at difficulty level ${difficultyLevel} (scale 1–5, where 1=beginner and 5=expert).

Respond with ONLY a JSON object in this exact shape — no markdown fences, no extra text:
{
  "question": "<the question text>",
  "options": {
    "A": "<option A>",
    "B": "<option B>",
    "C": "<option C>",
    "D": "<option D>"
  },
  "correctAnswer": "<A|B|C|D>",
  "difficultyLevel": ${difficultyLevel},
  "speedThresholds": {
    "fastMs": <milliseconds for a fast response>,
    "slowMs": <milliseconds for a slow response>
  }
}

Rules:
- The question must be unambiguous with exactly one correct answer.
- All four options must be plausible.
- fastMs should be between 5000 and 15000; slowMs must be greater than fastMs and between 15000 and 45000.
- Do NOT include any text outside the JSON object.`
}

export function buildDeduplicationPrompt(
  domain: string,
  difficultyLevel: number,
  previousQuestion: string,
): string {
  return `${buildQuestionPrompt(domain, difficultyLevel)}

IMPORTANT: Do NOT repeat this question that was already asked:
"${previousQuestion}"
Generate a completely different question.`
}
