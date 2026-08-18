import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { upsertPushToken, deletePushToken } from '@/database/db'

const PostSchema = z.object({
  token: z.string().min(1).max(500),
  platform: z.enum(['ios', 'android']).default('ios'),
})

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

  await upsertPushToken(userId, parsed.data.token, parsed.data.platform)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  await deletePushToken(token, userId)
  return NextResponse.json({ success: true })
}
