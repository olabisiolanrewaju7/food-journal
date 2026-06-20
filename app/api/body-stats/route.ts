import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { insertBodyStat, getBodyStats, deleteBodyStat } from '@/database/db'

const PostSchema = z.object({
  weight_kg: z.number().min(20).max(500),
  body_fat_pct: z.number().min(1).max(70).nullable().default(null),
  notes: z.string().max(200).nullable().default(null),
  recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') ?? '90'), 365)
  const rows = await getBodyStats(userId, limit)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { weight_kg, body_fat_pct, notes, recorded_at } = parsed.data
  const date = recorded_at ?? new Date().toISOString().split('T')[0]

  const id = await insertBodyStat({ user_id: userId, recorded_at: date, weight_kg, body_fat_pct, notes })
  return NextResponse.json({ id, success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await deleteBodyStat(id, userId)
  return NextResponse.json({ success: true })
}
