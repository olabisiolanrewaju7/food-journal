import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'healthyyou.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS food_entries (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL DEFAULT 1,
        timestamp   TEXT NOT NULL,
        food_name   TEXT NOT NULL,
        description TEXT,
        calories    REAL NOT NULL,
        protein     REAL NOT NULL,
        carbs       REAL NOT NULL,
        fat         REAL NOT NULL,
        fiber       REAL NOT NULL,
        image_data  TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON food_entries(timestamp);
      CREATE INDEX IF NOT EXISTS idx_user_date ON food_entries(user_id, timestamp);
    `)
  }
  return _db
}

// ── Users ────────────────────────────────────────────────────────────────────

export function createUser(name: string, email: string, passwordHash: string) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)
  `).run(name, email.toLowerCase(), passwordHash)
  return result.lastInsertRowid as number
}

export function getUserByEmail(email: string) {
  const db = getDb()
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as
    { id: number; name: string; email: string; password_hash: string } | undefined
}

export function getUserById(id: number) {
  const db = getDb()
  return db.prepare(`SELECT id, name, email FROM users WHERE id = ?`).get(id) as
    { id: number; name: string; email: string } | undefined
}

// ── Food entries ─────────────────────────────────────────────────────────────

export function insertEntry(entry: {
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
  const result = db.prepare(`
    INSERT INTO food_entries (user_id, timestamp, food_name, description, calories, protein, carbs, fat, fiber, image_data)
    VALUES (@user_id, @timestamp, @food_name, @description, @calories, @protein, @carbs, @fat, @fiber, @image_data)
  `).run({ ...entry, image_data: entry.image_data ?? null })
  return result.lastInsertRowid
}

export function getEntriesByDate(userId: number, date: string) {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM food_entries WHERE user_id = ? AND timestamp LIKE ? ORDER BY timestamp ASC
  `).all(userId, `${date}%`)
}

export function deleteEntry(id: number, userId: number) {
  const db = getDb()
  db.prepare(`DELETE FROM food_entries WHERE id = ? AND user_id = ?`).run(id, userId)
}

export function getDailySummaries(userId: number, days: number) {
  const db = getDb()
  return db.prepare(`
    SELECT
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
    ORDER BY date DESC
  `).all(userId, `-${days} days`)
}

export function getRecentEntries(userId: number, days: number) {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM food_entries
    WHERE user_id = ? AND timestamp >= DATE('now', ?)
    ORDER BY timestamp DESC
  `).all(userId, `-${days} days`)
}
