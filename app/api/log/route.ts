import { NextRequest, NextResponse } from 'next/server'
import { getEntriesByDate, insertEntry, deleteEntry } from '@/database/db'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]
  const entries = getEntriesByDate(date)
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { food_name, description, calories, protein, carbs, fat, fiber, timestamp, image_data } = body

    const id = insertEntry({
      timestamp: timestamp || new Date().toISOString(),
      food_name,
      description: description || '',
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      fiber: Number(fiber),
      image_data,
    })

    return NextResponse.json({ id, success: true })
  } catch (err) {
    console.error('log POST error:', err)
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  deleteEntry(Number(id))
  return NextResponse.json({ success: true })
}
