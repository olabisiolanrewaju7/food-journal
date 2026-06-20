import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import { getUserByEmail, createResetToken } from '@/database/db'
import { rateLimit } from '@/lib/rateLimit'

const Schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  if (!req.headers.get('content-type')?.includes('application/json'))
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })

  const ip = req.headers.get('x-forwarded-for') ?? 'local'
  if (!rateLimit(`forgot:${ip}`, 5, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  const { email } = parsed.data

  // Always return success to prevent email enumeration
  const user = await getUserByEmail(email)
  if (!user) return NextResponse.json({ success: true })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

  await createResetToken(user.id, token, expiresAt)

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'FoodJournal <noreply@foodjournal.app>',
    to: email,
    subject: 'Reset your FoodJournal password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="background: linear-gradient(135deg, #004d1a, #00c853); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🥗 FoodJournal</h1>
        </div>
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #5a5246; margin-bottom: 24px;">
          We received a request to reset your password. Click the button below — this link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
          style="display: block; background: linear-gradient(135deg, #004d1a, #00c853); color: white; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 24px;">
          Reset Password
        </a>
        <p style="color: #9c8e7e; font-size: 13px;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
        <hr style="border: none; border-top: 1px solid #f0ece4; margin: 24px 0;" />
        <p style="color: #b5a99a; font-size: 12px; text-align: center;">FoodJournal · AI-powered nutrition tracking</p>
      </div>
    `,
  })

  return NextResponse.json({ success: true })
}
