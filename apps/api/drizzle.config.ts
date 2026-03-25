import type { Config } from 'drizzle-kit'

export default {
  schema: ['./src/schema.ts', './src/schema/auth-schema.ts'],
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: './data/cbbi.db' },
} satisfies Config
