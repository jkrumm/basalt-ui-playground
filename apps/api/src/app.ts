import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { PatchUserPreferencesSchema, UserPreferencesSchema, UserSchema } from "@cbbi/schemas";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import jsonContent from "stoker/openapi/helpers/json-content";
import jsonContentRequired from "stoker/openapi/helpers/json-content-required";
import createErrorSchema from "stoker/openapi/schemas/create-error-schema";
import { auth } from "./auth.ts";
import { env } from "./env.ts";
import { getPreferences, patchPreferences } from "./routes/preferences.ts";

type Variables = { userId: string; user: typeof auth.$Infer.Session.user };

const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  c.set("userId", session.user.id);
  c.set("user", session.user);
  await next();
});

// Route definitions
const getMeRoute = createRoute({
  method: "get",
  path: "/api/user/me",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(UserSchema, "Authenticated user profile"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

const getPreferencesRoute = createRoute({
  method: "get",
  path: "/api/user/preferences",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(UserPreferencesSchema, "User preferences"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
  },
});

const patchPreferencesRoute = createRoute({
  method: "patch",
  path: "/api/user/preferences",
  request: { body: jsonContentRequired(PatchUserPreferencesSchema, "Preference updates") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(UserPreferencesSchema, "Updated preferences"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(z.object({ error: z.string() }), "Unauthorized"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(PatchUserPreferencesSchema),
      "Validation error",
    ),
  },
});

// Chained sub-app so AppType captures all typed routes for hono/client inference
const userRoutes = new OpenAPIHono<{ Variables: Variables }>()
  .openapi(getMeRoute, (c) => {
    const u = c.get("user");
    return c.json(
      {
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image ?? null,
        createdAt: u.createdAt.toISOString(),
      },
      HttpStatusCodes.OK,
    );
  })
  .openapi(getPreferencesRoute, async (c) => {
    return c.json(await getPreferences(c.get("userId")), HttpStatusCodes.OK);
  })
  .openapi(patchPreferencesRoute, async (c) => {
    const body = c.req.valid("json");
    return c.json(await patchPreferences(c.get("userId"), body), HttpStatusCodes.OK);
  });

const _app = new OpenAPIHono<{ Variables: Variables }>();
// CORS scoped to user routes only — /api/auth/** is handled by BetterAuth which sets
// its own Access-Control-* headers via trustedOrigins. Applying cors() there too
// produces duplicate headers that some browsers reject.
_app.use(
  "/api/user/*",
  cors({
    origin: env.ALLOWED_ORIGIN,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
_app.all("/api/auth/**", (c) => auth.handler(c.req.raw));
_app.use("/api/user/*", authMiddleware);
_app.route("/", userRoutes);
_app.doc("/doc", { openapi: "3.1.0", info: { version: "1.0.0", title: "CBBI API" } });
_app.get("/scalar", Scalar({ url: "/doc" }));

export const app = _app;
// AppType from userRoutes — fully typed sub-app for hono/client inference
export type AppType = typeof userRoutes;
