import { createFileRoute } from '@tanstack/react-router'

// Stub — Group 8 will implement the full settings page with server-synced preferences.
export const Route = createFileRoute('/_protected/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return null
}
