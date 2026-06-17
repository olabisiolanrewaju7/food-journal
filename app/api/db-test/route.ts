import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL ?? ''
  const token = process.env.TURSO_AUTH_TOKEN ?? ''
  const httpUrl = url.replace(/^libsql:\/\//, 'https://')

  try {
    const res = await fetch(`${httpUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql: 'SELECT 1' } },
          { type: 'close' },
        ],
      }),
    })
    const text = await res.text()
    return NextResponse.json({
      status: res.status,
      body: text,
      urlPrefix: url.slice(0, 40),
      tokenLength: token.length,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
