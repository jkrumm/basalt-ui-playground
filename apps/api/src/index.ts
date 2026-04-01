import { app } from "./app.ts";
import { env } from "./env.ts";
import { traceExporter } from "./telemetry.ts";

process.on("SIGTERM", async () => {
  await traceExporter.shutdown();
  process.exit(0);
});

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
  console.log(`Scalar docs at http://localhost:${env.PORT}/api/scalar`);
});
