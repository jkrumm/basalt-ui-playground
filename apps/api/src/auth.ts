import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as authSchema from './schema/auth-schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
  emailAndPassword: { enabled: true },
})
