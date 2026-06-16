import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEntriesByDate, insertEntry, deleteEntry } from '@/database/db'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const PostSchema = z.object({
  food_name:   z.string().min(1).max(200),
  description: z.string().max(500).optional().default(''),
  calories:    z.number().min(0).max(10_000),
  protein:     z.number().min(0).max(1_000),
  carbs:       z.number().min(0).max(2_000),
  fat:         z.number().min(0).max(1_000),
  fiber:       z.number().min(0).max(500),
  timestamp:   z.string().datetime().optional(),
  image_data:  z.string().max(11_000_000).optional(),
})

async function getUserId(): Promise<number | null> {
  const session = await getServerSession(authOptions)
  const id = Number((session?.user as any)?.id)
  return id > 0 ? id : null
}

export async function GET(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const date = ISO_DATE.test(dateParam) ? dateParam : new Date().toISOString().split('T')[0]
  return NextResponse.json(getEntriesByDate(userId, date))
}

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PostSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })

  try {
    const { food_name, description, calories, protein, carbs, fat, fiber, timestamp, image_data } = parsed.data
    const id = insertEntry({
      user_id: userId,
      timestamp: timestamp ?? new Date().toISOString(),
      food_name, description, calories, protein, carbs, fat, fiber, image_data,
    })
    return NextResponse.json({ id, success: true })
  } catch (err) {
    console.error('log POST error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idParam = req.nextUrl.searchParams.get('id')
  const id = Number(idParam)
  if (!idParam || !Number.isInteger(id) || id <= 0)
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  // M-2: scope delete to user_id — prevents IDOR
  deleteEntry(id, userId)
  return NextResponse.json({ success: true })
}
