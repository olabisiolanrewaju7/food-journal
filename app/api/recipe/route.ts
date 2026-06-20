import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { rateLimit } from '@/lib/rateLimit'

export const maxDuration = 60

const Schema = z.object({
  food_name: z.string().min(1).max(200),
  description: z.string().max(500).default(''),
  servings: z.number().int().min(1).max(20).default(2),
})

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!rateLimit(`recipe:${ip}`, 15, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { food_name, description, servings } = parsed.data

  const prompt = `Give me a home-kitchen recipe for ${food_name}${description ? ` (${description})` : ''} for ${servings} serving${servings > 1 ? 's' : ''}.

Respond ONLY with valid JSON, no markdown:
{
  "prepTime": "10 mins",
  "cookTime": "25 mins",
  "ingredients": [
    { "item": "chicken breast", "quantity": "400g" },
    { "item": "olive oil", "quantity": "2 tbsp" }
  ],
  "steps": [
    "Season the chicken with salt and pepper.",
    "Heat oil in a pan over medium heat..."
  ]
}

Rules:
- Quantities must be scaled to exactly ${servings} serving${servings > 1 ? 's' : ''}
- Use everyday ingredients, no specialty store required
- Steps should be clear and beginner-friendly, 6–10 steps
- Casual friendly tone in the steps`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response format')
    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('recipe error:', msg)
    return NextResponse.json({ error: 'Failed to generate recipe' }, { status: 500 })
  }
}
