import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getEntriesByDate, insertEntry, deleteEntry } from '@/database/db'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const USER_ID = 1

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

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  const date = ISO_DATE.test(dateParam) ? dateParam : new Date().toISOString().split('T')[0]
  return NextResponse.json(getEntriesByDate(USER_ID, date))
}

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

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
      user_id: USER_ID,
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
  const idParam = req.nextUrl.searchParams.get('id')
  const id = Number(idParam)
  if (!idParam || !Number.isInteger(id) || id <= 0)
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  deleteEntry(id, USER_ID)
  return NextResponse.json({ success: true })
}
