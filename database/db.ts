import { createClient, type Client } from '@libsql/client'

function getDb(): Client {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url) throw new Error('TURSO_DATABASE_URL environment variable is not set')
  // Force HTTP transport (libsql:// uses WebSockets which are unreliable in serverless)
  const httpUrl = url.replace(/^libsql:\/\//, 'https://')
  return createClient({ url: httpUrl, authToken })
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function createUser(name: string, email: string, passwordHash: string) {
  const db = getDb()
  const result = await db.execute({
    sql: `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
    args: [name, email.toLowerCase(), passwordHash],
  })
  return Number(result.lastInsertRowid)
}

export async function getUserByEmail(email: string) {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT * FROM users WHERE email = ?`,
    args: [email.toLowerCase()],
  })
  const row = result.rows[0]
  if (!row) return undefined
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    password_hash: String(row.password_hash),
  }
}

// ── Food entries ─────────────────────────────────────────────────────────────

export async function insertEntry(entry: {
  user_id: number
  timestamp: string
  food_name: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  image_data?: string
}) {
  const db = getDb()
  const result = await db.execute({
    sql: `INSERT INTO food_entries (user_id, timestamp, food_name, description, calories, protein, carbs, fat, fiber, image_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      entry.user_id, entry.timestamp, entry.food_name, entry.description,
      entry.calories, entry.protein, entry.carbs, entry.fat, entry.fiber,
      entry.image_data ?? null,
    ],
  })
  return Number(result.lastInsertRowid)
}

export async function getEntriesByDate(userId: number, date: string) {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT * FROM food_entries WHERE user_id = ? AND timestamp LIKE ? ORDER BY timestamp ASC`,
    args: [userId, `${date}%`],
  })
  return result.rows
}

export async function deleteEntry(id: number, userId: number) {
  const db = getDb()
  await db.execute({
    sql: `DELETE FROM food_entries WHERE id = ? AND user_id = ?`,
    args: [id, userId],
  })
}

export async function getDailySummaries(userId: number, days: number) {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT
            DATE(timestamp) as date,
            SUM(calories) as calories,
            SUM(protein) as protein,
            SUM(carbs) as carbs,
            SUM(fat) as fat,
            SUM(fiber) as fiber,
            COUNT(*) as entries
          FROM food_entries
          WHERE user_id = ? AND timestamp >= DATE('now', ?)
          GROUP BY DATE(timestamp)
          ORDER BY date DESC`,
    args: [userId, `-${days} days`],
  })
  return result.rows
}

export async function getRecentEntries(userId: number, days: number) {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT * FROM food_entries
          WHERE user_id = ? AND timestamp >= DATE('now', ?)
          ORDER BY timestamp DESC`,
    args: [userId, `-${days} days`],
  })
  return result.rows
}
