import { app } from "./app.ts";
import { env } from "./env.ts";

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
  console.log(`Scalar docs at http://localhost:${env.PORT}/api/scalar`);
});
