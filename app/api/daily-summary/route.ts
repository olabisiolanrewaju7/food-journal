import { NextRequest, NextResponse } from 'next/server'
import { getDailySummaries } from '@/database/db'

export async function GET(req: NextRequest) {
  const days = Number(req.nextUrl.searchParams.get('days') || '7')
  const summaries = getDailySummaries(days)
  return NextResponse.json(summaries)
}
