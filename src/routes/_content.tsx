import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ContentNav } from '../components/layout/ContentNav'

export const Route = createFileRoute('/_content')({
  component: ContentLayout,
})

function ContentLayout() {
  return (
    <>
      <ContentNav />
      <Outlet />
    </>
  )
}
