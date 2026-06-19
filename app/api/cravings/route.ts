import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { rateLimit } from '@/lib/rateLimit'

export const maxDuration = 60

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(2000),
})

const Schema = z.object({
  message: z.string().min(1).max(500),
  history: z.array(MessageSchema).max(20).default([]),
  preferences: z.object({
    cuisines: z.array(z.string()).max(10).default([]),
    pastChoices: z.array(z.string()).max(20).default([]),
    dietaryNotes: z.array(z.string()).max(10).default([]),
  }).default({ cuisines: [], pastChoices: [], dietaryNotes: [] }),
  goals: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
  }).default({}),
  caloriesConsumedToday: z.number().default(0),
})

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!rateLimit(`cravings:${ip}`, 20, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { message, history, preferences, goals, caloriesConsumedToday } = parsed.data

  const caloriesRemaining = goals.calories ? goals.calories - caloriesConsumedToday : null

  const systemPrompt = `You are a friendly food craving assistant inside a nutrition tracking app. Your job is to help users satisfy their cravings in a healthy way that aligns with their goals.

USER CONTEXT:
- Calorie goal: ${goals.calories ?? 'not set'}
- Calories consumed today: ${caloriesConsumedToday}
- Calories remaining: ${caloriesRemaining !== null ? caloriesRemaining : 'unknown'}
- Protein goal: ${goals.protein ?? 'not set'}g
- Favourite cuisines: ${preferences.cuisines.length ? preferences.cuisines.join(', ') : 'not established yet'}
- Dietary notes: ${preferences.dietaryNotes.length ? preferences.dietaryNotes.join(', ') : 'none'}
- Past food choices: ${preferences.pastChoices.length ? preferences.pastChoices.slice(0, 10).join(', ') : 'none yet'}

BEHAVIOUR:
- If the user's cuisine/region preference is unclear from their message AND you have no history with them, ask ONE short clarifying question (e.g. "Are you in the mood for African, Asian, American, or something else?")
- Otherwise, give 5 suggestions that match their craving and fit their remaining calories
- Cover diverse options within the chosen cuisine(s)
- Always be warm, encouraging, and goal-aware

RESPONSE FORMAT — you must ALWAYS respond with valid JSON in this exact shape:
{
  "type": "question" | "suggestions",
  "message": "your conversational text here",
  "suggestions": [
    {
      "name": "Food name",
      "description": "One sentence description",
      "cuisine": "African | Asian | American | Mediterranean | etc",
      "calories": 150,
      "protein": 5,
      "carbs": 20,
      "fat": 4,
      "fiber": 2,
      "whyItWorks": "Short reason this fits their goal/craving"
    }
  ]
}
For type "question", omit or leave "suggestions" as an empty array.
For type "suggestions", always include exactly 5 items.`

  const messages = [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON from response (Claude may wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response format')
    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('cravings error:', msg)
    return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 })
  }
}
