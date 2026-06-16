import { NextRequest, NextResponse } from 'next/server'
import { getDailySummaries } from '@/database/db'

export async function GET(req: NextRequest) {
  // M-1: Clamp days to a sensible range
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('days')) || 7, 1), 365)
  return NextResponse.json(getDailySummaries(days))
}
