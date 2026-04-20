import { z } from 'zod'
import { AnswerOptionSchema, type AnswerOption, type SettingsFile, type QuestionRecord } from '../domain/schema.js'

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
  difficultyLevel: z.number().int().min(1).max(5),
  speedThresholds: z.object({
    fastMs: z.number().int().positive(),
    slowMs: z.number().int().positive(),
  }).refine((t) => t.slowMs > t.fastMs, {
    message: 'slowMs must be greater than fastMs',
  }),
})

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>

export type VerifiedQuestion = QuestionResponse & { correctAnswer: AnswerOption }

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
export function sanitizeInput(input: string): string {
  return input.replaceAll(/[\r\n]+/g, ' ').replaceAll('"', "'")
}

function buildVoiceInstruction(settings: SettingsFile): string {
  if (settings.language === 'English' && settings.tone === 'natural') return ''
  const safeLanguage = sanitizeInput(settings.language)
  const article = /^[aeiou]/i.test(settings.tone) ? 'an' : 'a'
  const toneClause = settings.tone === 'natural' ? '' : ` using ${article} ${settings.tone} tone of voice`
  return `Respond in ${safeLanguage}${toneClause}.\n\n`
}

function voicePrefix(settings?: SettingsFile): string {
  return settings ? buildVoiceInstruction(settings) : ''
}

function formatAnswerWithText(record: QuestionRecord, answer: QuestionRecord['userAnswer']): string {
  if (answer === 'TIMEOUT') {
    return 'TIMEOUT (no option selected)'
  }

  const optionText = sanitizeInput(record.options[answer])
  return `${answer} ("${optionText}")`
}

function formatOptions(options: QuestionResponse['options']): string {
  return `  A) ${sanitizeInput(options.A)}
  B) ${sanitizeInput(options.B)}
  C) ${sanitizeInput(options.C)}
  D) ${sanitizeInput(options.D)}`
}

export function buildQuestionPrompt(domain: string, difficultyLevel: number, settings?: SettingsFile): string {
  const safeDomain = sanitizeInput(domain)
  return `${voicePrefix(settings)}You are a quiz engine. Generate a single multiple-choice question on the topic of "${safeDomain}" at difficulty level ${difficultyLevel} (scale 1–5, where 1=beginner and 5=expert).

Respond with ONLY a JSON object in this exact shape — no markdown fences, no extra text:
{
  "question": "<the question text>",
  "options": {
    "A": "<option A>",
    "B": "<option B>",
    "C": "<option C>",
    "D": "<option D>"
  },
  "difficultyLevel": ${difficultyLevel},
  "speedThresholds": {
    "fastMs": <milliseconds for a fast response>,
    "slowMs": <milliseconds for a slow response>
  }
}

Rules:
- The question must be unambiguous with exactly one correct answer.
- All four options must be plausible.
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

// ---------------------------------------------------------------------------
// Verification schema + prompt — self-consistency check for correctAnswer
// ---------------------------------------------------------------------------
export const VerificationResponseSchema = z.object({
  correctAnswer: AnswerOptionSchema,
  correctOptionText: z.string().min(1),
})

export type VerificationResponse = z.infer<typeof VerificationResponseSchema>

export function buildVerificationPrompt(question: QuestionResponse, settings?: SettingsFile): string {
  const safeQuestion = sanitizeInput(question.question)
  return `${voicePrefix(settings)}You are an answer-verification engine. Given the following multiple-choice question, determine which option is the correct answer.

Question: "${safeQuestion}"
Options:
${formatOptions(question.options)}

Respond with ONLY a JSON object in this exact shape — no markdown fences, no extra text:
{
  "correctAnswer": "<A, B, C, or D>",
  "correctOptionText": "<the exact text of the correct option>"
}

Rules:
- Think carefully and verify facts before answering.
- correctAnswer must be exactly one of: "A", "B", "C", or "D".
- correctOptionText must be the exact text of the option you chose as correct.
- Do NOT include any text outside the JSON object.`
}

export type MotivationalTrigger = 'returning' | 'trending'

export function buildMotivationalPrompt(trigger: MotivationalTrigger, settings?: SettingsFile): string {
  const triggerInstruction = trigger === 'returning'
    ? 'The user has returned to practise again within the last 7 days. Write a 1–2 sentence motivational message acknowledging their return and encouraging them to keep going.'
    : 'The user\'s quiz score is trending upward. Write a 1–2 sentence motivational message congratulating them on improving their score.'
  return `${voicePrefix(settings)}${triggerInstruction}

Reply with ONLY the motivational message — no JSON, no quotes, no extra text.`
}

export function buildExplanationPrompt(
  question: VerifiedQuestion,
  userAnswer: 'A' | 'B' | 'C' | 'D',
  settings?: SettingsFile,
): string {
  const safeQuestion = sanitizeInput(question.question)
  return `${voicePrefix(settings)}The user just answered a multiple-choice quiz question. Explain why the correct answer is correct in 2–4 sentences. Optionally note why common wrong choices are incorrect.

Question: "${safeQuestion}"
Options:
${formatOptions(question.options)}
Correct answer: ${question.correctAnswer}
User's answer: ${userAnswer}

Reply with ONLY the explanation — no JSON, no quotes, no extra text.`
}

export function buildMicroLessonPrompt(
  question: VerifiedQuestion,
  explanation: string,
  settings?: SettingsFile,
): string {
  const safeQuestion = sanitizeInput(question.question)
  const safeExplanation = sanitizeInput(explanation)
  return `${voicePrefix(settings)}The user answered a quiz question and has already seen an explanation. Now generate a deeper micro-lesson (~1-minute read, 3–5 paragraphs) on the underlying concept. Cover foundational principles, related concepts, and practical context. Go beyond the explanation already provided.

Question: "${safeQuestion}"
Options:
${formatOptions(question.options)}
Correct answer: ${question.correctAnswer}
Explanation already provided: "${safeExplanation}"

Reply with ONLY the micro-lesson — no JSON, no quotes, no extra text.`
}

export function buildCoachReportPrompt(
  slug: string,
  scopedHistory: QuestionRecord[],
  settings?: SettingsFile,
): string {
  const safeDomain = sanitizeInput(slug)
  const total = scopedHistory.length
  const historyLines = scopedHistory.map((r, i) => {
    const q = sanitizeInput(r.question)
    const userAnswer = formatAnswerWithText(r, r.userAnswer)
    const correctAnswer = formatAnswerWithText(r, r.correctAnswer)
    return `${i + 1}. "${q}" | userAnswer=${userAnswer} | correctAnswer=${correctAnswer} | isCorrect=${r.isCorrect} | difficultyLevel=${r.difficultyLevel} | timeTakenMs=${r.timeTakenMs} | speedTier=${r.speedTier}`
  }).join('\n')
  return `${voicePrefix(settings)}You are a personalized learning coach. Analyze the user's answer history for the topic "${safeDomain}" and produce a concise coaching report that will help the user focus their next study sessions.

Answer history (${total} question${total === 1 ? '' : 's'}):
${historyLines}

Produce a coaching report with exactly these four sections, in this order, each with a clear heading:

Strengths
- Subtopics, patterns, or skills where the user consistently performs well.

Weaknesses
- Subtopics, patterns, or skills where the user struggles. Cite concrete evidence from the history (e.g., difficulty, speed, repeated misses).

Learning trajectory
- State whether the user is improving, plateauing, or declining. Cite evidence (accuracy over time, difficulty progression, speed).

Recommendations
- 2–4 specific, actionable suggestions tailored to the observed weaknesses and trajectory.

Reply with ONLY the coaching report as plain prose with the four section headings — no JSON, no markdown fences, no extra commentary before or after.`
}

