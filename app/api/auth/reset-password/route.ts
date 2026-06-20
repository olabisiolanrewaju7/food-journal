import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getResetToken, markTokenUsed, updateUserPassword } from '@/database/db'
import { rateLimit } from '@/lib/rateLimit'

const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
})

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!rateLimit(`reset:${ip}`, 10, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { token, password } = parsed.data

  const row = await getResetToken(token)
  if (!row) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 8)
  await updateUserPassword(Number(row.user_id), passwordHash)
  await markTokenUsed(token)

  return NextResponse.json({ success: true })
}
