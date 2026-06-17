import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { rateLimit } from '@/lib/rateLimit'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const MAX_BASE64_BYTES = 10 * 1024 * 1024

const MAGIC: Record<string, string> = {
  'image/jpeg': 'ffd8ff',
  'image/png':  '89504e47',
  'image/webp': '52494646',
  'image/gif':  '47494638',
}

const Schema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(ALLOWED_MIME),
})

function checkMagicBytes(base64: string, mimeType: string): boolean {
  try {
    const bytes = Buffer.from(base64.slice(0, 16), 'base64')
    const hex = bytes.toString('hex')
    return hex.startsWith(MAGIC[mimeType] ?? '')
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!rateLimit(`analyze:${ip}`, 20, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })

  const { imageBase64, mimeType } = parsed.data

  if (imageBase64.length > Math.ceil(MAX_BASE64_BYTES * (4 / 3)))
    return NextResponse.json({ error: 'Image too large (max 10 MB)' }, { status: 413 })

  if (!checkMagicBytes(imageBase64, mimeType))
    return NextResponse.json({ error: 'Image content does not match declared type' }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a nutrition analysis expert. When given a food image, return ONLY a valid JSON object with no markdown fences, no explanation — just the raw JSON.',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            {
              type: 'text',
              text: `Analyze the food in this image and return a JSON object with exactly these fields:
{
  "food_name": "concise name of the food (list all items if multiple)",
  "description": "brief description including estimated portion size",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>
}
If multiple foods are visible, sum all values and list all items in food_name.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(clean)
    return NextResponse.json(analysis)
  } catch (err) {
    console.error('analyze-food error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
  }
}
