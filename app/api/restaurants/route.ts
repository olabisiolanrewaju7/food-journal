import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { rateLimit } from '@/lib/rateLimit'

export const maxDuration = 60

const Schema = z.object({
  food_name: z.string().min(1).max(200),
  cuisine: z.string().max(100).default(''),
  location: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!rateLimit(`restaurants:${ip}`, 15, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { food_name, cuisine, location } = parsed.data

  const prompt = `Suggest 2–3 real restaurants near "${location}" that are well-known for serving ${food_name}${cuisine ? ` (${cuisine} cuisine)` : ''}.

Only suggest restaurants you have reasonable confidence actually exist and serve this dish. If you're unsure about specific restaurants in this exact location, suggest well-known chains or restaurant types that commonly carry this dish and are likely to be in the area.

Respond ONLY with valid JSON, no markdown:
{
  "restaurants": [
    {
      "name": "Restaurant Name",
      "reason": "Why this restaurant is a great pick — mention reputation, ratings, or what they're known for",
      "searchQuery": "Restaurant Name ${location}"
    }
  ]
}

Rules:
- Be honest — if you aren't confident about a specific restaurant, say it's a recommended type/chain rather than inventing a name
- "reason" should feel like a friend's recommendation, 1–2 sentences max
- "searchQuery" is the search string to use on food delivery apps (restaurant name + city/area)`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response format')
    const data = JSON.parse(jsonMatch[0])

    // Build deep links from searchQuery
    const restaurants = data.restaurants.map((r: { name: string; reason: string; searchQuery: string }) => ({
      name: r.name,
      reason: r.reason,
      uberEatsUrl: `https://www.ubereats.com/search?q=${encodeURIComponent(r.searchQuery)}`,
      doorDashUrl: `https://www.doordash.com/search/store/${encodeURIComponent(r.searchQuery)}`,
    }))

    return NextResponse.json({ restaurants })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('restaurants error:', msg)
    return NextResponse.json({ error: 'Failed to find restaurants' }, { status: 500 })
  }
}
