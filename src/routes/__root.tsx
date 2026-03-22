import type { Theme } from '../lib/theme'
import { Classes, FocusStyleManager } from '@blueprintjs/core'
import geistFont from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url'
import jbMonoFont from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url'
import { useHotkey } from '@tanstack/react-hotkeys'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { RouteTracker } from '../components/analytics/RouteTracker'
import { SearchModal } from '../components/content/SearchModal'
import { ContentNav } from '../components/layout/ContentNav'
import { ThemeContext, useSystemTheme } from '../context/theme-context'
import { EVENTS, track } from '../lib/analytics'
import { getThemeFn, setThemeFn } from '../lib/theme'
import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  loader: () => getThemeFn(),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'CBBI Dashboard — Blueprint + TanStack Start' },
      // Tell Dark Reader this site handles its own dark mode — opt out of auto-inversion
      { name: 'darkreader-lock', content: '' },
    ],
    links: [
      { rel: 'preload', href: geistFont, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: jbMonoFont, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const loaderTheme = Route.useLoaderData()
  const router = useRouter()
  // Optimistic override during theme change — null means "use loader value"
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null)
  const theme = pendingTheme ?? loaderTheme
  const [searchOpen, setSearchOpen] = useState(false)

  useHotkey('Mod+K', () => {
    setSearchOpen(true)
    track(EVENTS.SEARCH_OPENED, {})
  }, { preventDefault: true })
  // Allow any page's navbar to open the modal via a custom event
  useEffect(() => {
    const handler = () => {
      setSearchOpen(true)
      track(EVENTS.SEARCH_OPENED, {})
    }
    window.addEventListener('open-search', handler)
    return () => window.removeEventListener('open-search', handler)
  }, [])

  // Resolve 'system' to actual dark/light via OS preference.
  // Always called (hooks must not be conditional); result used only for 'system'.
  const systemTheme = useSystemTheme()
  const effectiveTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    // FocusStyleManager uses document.addEventListener — must be client-only.
    FocusStyleManager.onlyShowFocusOnTabs()
  }, [])

  const setTheme = useCallback(
    (next: Theme) => {
      setPendingTheme(next)
      void setThemeFn({ data: next }).then(() => {
        void router.invalidate()
        setPendingTheme(null)
      })
    },
    [router],
  )

  return (
    <ThemeContext value={{ theme, effectiveTheme, setTheme }}>
      <html lang="en">
        <head>
          <HeadContent />
          {/* Umami analytics — injected only when env vars are set; absent in dev by default */}
          {import.meta.env.VITE_UMAMI_SCRIPT_URL && import.meta.env.VITE_UMAMI_WEBSITE_ID && (
            <script
              defer
              src={import.meta.env.VITE_UMAMI_SCRIPT_URL}
              data-website-id={import.meta.env.VITE_UMAMI_WEBSITE_ID}
              data-auto-track="false"
            />
          )}
        </head>
        {/* bp6-dark resolved server-side from cookie (explicit) or from OS pref on client (system). */}
        {/* suppressHydrationWarning: expected when 'system' resolves differently on server vs client. */}
        <body
          className={effectiveTheme === 'dark' ? Classes.DARK : undefined}
          suppressHydrationWarning
        >
          <RouteTracker />
          <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          <ContentNav />
          <Outlet />
          <Scripts />
        </body>
      </html>
    </ThemeContext>
  )
}
