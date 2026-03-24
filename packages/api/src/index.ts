import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { UserPreferencesSchema, PatchUserPreferencesSchema } from '@cbbi/schemas'
import { auth } from './auth'
import { getPreferences, patchPreferences } from './routes/preferences'

// BetterAuth plugin: mounts auth handler + injects user/session via macro
const betterAuth = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }: { status: Function; request: { headers: Headers } }) {
        const session = await auth.api.getSession({ headers })
        if (!session) return status(401)
        return { user: session.user, session: session.session }
      },
    },
  })

export const app = new Elysia()
  .use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    }),
  )
  .use(betterAuth)
  .group('/api', (api) =>
    api
      .get(
        '/user/preferences',
        async ({ user }) => getPreferences(user.id),
        { auth: true, response: UserPreferencesSchema },
      )
      .patch(
        '/user/preferences',
        async ({ user, body }) => patchPreferences(user.id, body),
        { auth: true, body: PatchUserPreferencesSchema, response: UserPreferencesSchema },
      ),
  )

export type App = typeof app

app.listen(3001, () => {
  // eslint-disable-next-line no-console
  console.log('API server running at http://localhost:3001')
})
