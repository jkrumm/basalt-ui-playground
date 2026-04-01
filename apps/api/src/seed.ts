import { eq } from "drizzle-orm";
import { db } from "./db.ts";
import { account, user } from "./schema/index.ts";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo1234";

// Argon2id — must match BetterAuth's hasher config when wired in Group 4
const passwordHash = await Bun.password.hash(DEMO_PASSWORD, {
  algorithm: "argon2id",
  memoryCost: 65536,
  timeCost: 2,
});

const now = new Date();
const userId = crypto.randomUUID();

// Idempotent: remove existing demo user first (cascades to account + preferences)
await db.delete(user).where(eq(user.email, DEMO_EMAIL));

await db.insert(user).values({
  id: userId,
  name: "Demo User",
  email: DEMO_EMAIL,
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
});

await db.insert(account).values({
  id: crypto.randomUUID(),
  accountId: userId,
  providerId: "credential",
  userId,
  password: passwordHash,
  createdAt: now,
  updatedAt: now,
});

console.log(`Seeded demo user: ${DEMO_EMAIL}`);
process.exit(0);
