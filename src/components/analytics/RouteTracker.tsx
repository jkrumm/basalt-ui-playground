import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

export function RouteTracker() {
  const router = useRouter()
  useEffect(() => {
    // Initial pageview (replaces auto-track which is disabled)
    window.umami?.track()
    // Subsequent SPA navigations
    return router.subscribe('onResolved', ({ toLocation }) => {
      window.umami?.track(props => ({
        ...props,
        url: toLocation.pathname,
        title: document.title,
      }))
    })
  }, [router])
  return null
}
