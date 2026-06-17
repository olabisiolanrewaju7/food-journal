import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDailySummaries } from '@/database/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = Number((session?.user as any)?.id)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('days')) || 7, 1), 365)
  return NextResponse.json(await getDailySummaries(userId, days))
}
