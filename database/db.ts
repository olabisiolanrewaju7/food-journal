import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'healthyyou.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.exec(`
      CREATE TABLE IF NOT EXISTS food_entries (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp   TEXT NOT NULL,
        food_name   TEXT NOT NULL,
        description TEXT,
        calories    REAL NOT NULL,
        protein     REAL NOT NULL,
        carbs       REAL NOT NULL,
        fat         REAL NOT NULL,
        fiber       REAL NOT NULL,
        image_data  TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_timestamp ON food_entries(timestamp);
    `)
  }
  return _db
}

export function insertEntry(entry: {
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
  const stmt = db.prepare(`
    INSERT INTO food_entries (timestamp, food_name, description, calories, protein, carbs, fat, fiber, image_data)
    VALUES (@timestamp, @food_name, @description, @calories, @protein, @carbs, @fat, @fiber, @image_data)
  `)
  const result = stmt.run({ ...entry, image_data: entry.image_data ?? null })
  return result.lastInsertRowid
}

export function getEntriesByDate(date: string) {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM food_entries WHERE timestamp LIKE ? ORDER BY timestamp ASC
  `).all(`${date}%`)
}

export function getAllEntries() {
  const db = getDb()
  return db.prepare(`SELECT * FROM food_entries ORDER BY timestamp DESC`).all()
}

export function deleteEntry(id: number) {
  const db = getDb()
  db.prepare(`DELETE FROM food_entries WHERE id = ?`).run(id)
}

export function getDailySummaries(days: number) {
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
    WHERE timestamp >= DATE('now', ?)
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `).all(`-${days} days`)
}

export function getRecentEntries(days: number) {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM food_entries
    WHERE timestamp >= DATE('now', ?)
    ORDER BY timestamp DESC
  `).all(`-${days} days`)
}
