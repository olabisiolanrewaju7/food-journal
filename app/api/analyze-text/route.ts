import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { rateLimit } from '@/lib/rateLimit'

const Schema = z.object({
  food_name: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!rateLimit(`analyze-text:${ip}`, 20, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { food_name } = parsed.data

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are a nutrition analysis expert. Return ONLY a valid JSON object with no markdown fences, no explanation — just raw JSON.',
      messages: [{
        role: 'user',
        content: `Estimate the nutritional content for: "${food_name}"

Assume a typical single serving portion unless a quantity is specified.
Return a JSON object with exactly these fields:
{
  "food_name": "clean, concise food name",
  "description": "brief description with estimated portion size",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>
}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(clean)
    return NextResponse.json(analysis)
  } catch (err) {
    console.error('analyze-text error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Failed to analyse food' }, { status: 500 })
  }
}
