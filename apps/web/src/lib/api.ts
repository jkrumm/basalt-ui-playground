import type { App } from '@cbbi/api'
import { treaty } from '@elysiajs/eden'
import { createIsomorphicFn } from '@tanstack/react-start'

// Server branch: direct in-process call via Elysia instance — zero HTTP overhead during SSR.
// Client branch: relative URL — proxied through Vite in dev, served by same Bun server in prod.
// Dynamic import in the server branch prevents @cbbi/api (and Elysia) from bundling into the client.
export const getApi = createIsomorphicFn()
  .server(async () => {
    const { app } = await import('@cbbi/api')
    return treaty(app).api
  })
  .client(() => treaty<App>(import.meta.env.VITE_API_URL ?? '', { fetch: { credentials: 'include' } }).api)
