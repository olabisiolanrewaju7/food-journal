import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { getDailySummaries, getRecentEntries } from '@/database/db'
import { rateLimit } from '@/lib/rateLimit'

const Schema = z.object({
  goal: z.string().max(200).transform(s => s.replace(/[\x00-\x1f\x7f]/g, '').trim()).optional(),
})

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!rateLimit(`advice:${ip}`, 10, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const goal = parsed.data.goal ?? ''

  try {
    const summaries = await getDailySummaries(userId, 7)
    const recentEntries = await getRecentEntries(userId, 7)

    if (recentEntries.length === 0) {
      return NextResponse.json({
        advice: "You haven&apos;t logged any meals yet! Start by photographing your food to get personalized advice based on your actual eating patterns.",
      })
    }

    const avgCalories = summaries.length > 0
      ? Math.round(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          summaries.reduce((s: number, d: any) => s + Number(d.calories), 0) / summaries.length
        )
      : 0

    const prompt = `Here is my food log from the past 7 days:

Daily summaries:
${JSON.stringify(summaries, null, 2)}

Recent meals (last 7 days):
${JSON.stringify(recentEntries.slice(0, 30), null, 2)}

Average daily calories: ${avgCalories}
My goal: [${goal || 'general health and balanced nutrition'}]

Please provide personalized dietary advice in exactly 3 sections with these headers:
## What's Going Well
(2-3 specific positives based on my actual data)

## Areas to Improve
(2-3 specific, actionable recommendations with target numbers)

## This Week's Focus
(1 concrete habit to implement, be very specific)

Keep the total response under 400 words. Reference my actual food choices and numbers.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const advice = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ advice })
  } catch (err) {
    console.error('advice error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Failed to generate advice' }, { status: 500 })
  }
}
