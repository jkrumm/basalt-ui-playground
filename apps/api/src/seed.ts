import { auth } from "./auth.ts";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "Demo User";

try {
  await auth.api.signUpEmail({
    body: { name: DEMO_NAME, email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });
  console.log(`Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  if (message.toLowerCase().includes("already")) {
    console.log(`Demo user already exists: ${DEMO_EMAIL}`);
  } else {
    console.error("Seed failed:", message);
    process.exit(1);
  }
}

process.exit(0);
