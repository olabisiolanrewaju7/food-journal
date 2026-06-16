import { NextRequest, NextResponse } from 'next/server'
import { getDailySummaries } from '@/database/db'

const USER_ID = 1

export async function GET(req: NextRequest) {
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('days')) || 7, 1), 365)
  return NextResponse.json(getDailySummaries(USER_ID, days))
}
