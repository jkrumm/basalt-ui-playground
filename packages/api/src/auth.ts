import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as authSchema from './schema/auth-schema'

export const auth = betterAuth({
  baseURL: 'http://localhost:3001',
  database: drizzleAdapter(db, { provider: 'sqlite', schema: authSchema }),
  emailAndPassword: { enabled: true },
  trustedOrigins: ['http://localhost:3000'],
})
