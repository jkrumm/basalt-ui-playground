import type { App } from '@cbbi/api'
import { treaty } from '@elysiajs/eden'
import { createIsomorphicFn } from '@tanstack/react-start'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Server branch: direct in-process call via Elysia instance — zero HTTP overhead during SSR.
// Client branch: regular HTTP request to the running Elysia server.
// Dynamic import in the server branch prevents @cbbi/api (and Elysia) from bundling into the client.
export const getApi = createIsomorphicFn()
  .server(async () => {
    const { app } = await import('@cbbi/api')
    return treaty(app).api
  })
  .client(() => treaty<App>(API_URL, { fetch: { credentials: 'include' } }).api)
