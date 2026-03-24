import { mkdirSync } from 'node:fs'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

mkdirSync('./data', { recursive: true })

const sqlite = new Database('./data/cbbi.db')

// Create app-specific tables on startup.
// Auth tables (user, session, account, verification) are created by running `bun run db:setup`.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'system',
    view_mode TEXT NOT NULL DEFAULT 'grid',
    sort_by TEXT NOT NULL DEFAULT 'default'
  )
`)

export const db = drizzle(sqlite, { schema })
