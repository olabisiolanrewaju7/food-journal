import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getUserByEmail, createUser } from '@/database/db'

const Schema = z.object({
  name:     z.string().min(1).max(100),
  email:    z.string().email().max(200),
  password: z.string().min(8).max(128),
})

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, password } = parsed.data

  if (getUserByEmail(email)) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const id = createUser(name, email, passwordHash)
  return NextResponse.json({ id, success: true }, { status: 201 })
}
