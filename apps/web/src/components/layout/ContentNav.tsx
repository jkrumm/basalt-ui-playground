import { Alignment, Button, Divider, Menu, MenuItem, Navbar, NavbarGroup, Popover, Spinner } from '@blueprintjs/core'
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { authClient } from '../../lib/auth-client'
import { ThemeToggle } from '../ThemeToggle'
import styles from './ContentNav.module.css'

export function ContentNav() {
  const matchRoute = useMatchRoute()

  const isHomeActive = !!matchRoute({ to: '/', fuzzy: false })
  const isTableActive = !!matchRoute({ to: '/table', fuzzy: false })
  const isDocsActive = !!matchRoute({ to: '/docs', fuzzy: true })
  const isBlogActive = !!matchRoute({ to: '/blog', fuzzy: true })
  const isGuidesActive = !!matchRoute({ to: '/guides', fuzzy: true })
  const isBlocksActive = !!matchRoute({ to: '/blocks', fuzzy: true })

  return (
    <Navbar style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <NavbarGroup align={Alignment.LEFT}>
        <Link to="/" className={styles.navLink}>
          <Button variant="minimal" text="CBBI" active={isHomeActive} />
        </Link>
        <Divider />
        <Link to="/table" className={styles.navLink}>
          <Button variant="minimal" text="Tables" active={isTableActive} />
        </Link>
        <Link to="/docs" className={styles.navLink}>
          <Button variant="minimal" text="Docs" active={isDocsActive} />
        </Link>
        <Link to="/blog" search={{ tag: '' }} className={styles.navLink}>
          <Button variant="minimal" text="Blog" active={isBlogActive} />
        </Link>
        <Link to="/guides" search={{ category: '', difficulty: '' }} className={styles.navLink}>
          <Button variant="minimal" text="Guides" active={isGuidesActive} />
        </Link>
        <Link to="/blocks" search={{ category: '' }} className={styles.navLink}>
          <Button variant="minimal" text="Blocks" active={isBlocksActive} />
        </Link>
      </NavbarGroup>
      <NavbarGroup align={Alignment.RIGHT}>
        <NavUserMenu />
        <Divider />
        <ThemeToggle />
      </NavbarGroup>
    </Navbar>
  )
}

function NavUserMenu() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  if (isPending)
    return <Spinner size={14} />

  if (!session) {
    return (
      <Link to="/sign-in" className={styles.navLink}>
        <Button variant="minimal" text="Sign in" />
      </Link>
    )
  }

  return (
    <Popover
      content={(
        <Menu>
          <MenuItem
            text="Sign out"
            intent="danger"
            onClick={async () => {
              await authClient.signOut()
              void navigate({ to: '/' })
            }}
          />
        </Menu>
      )}
      placement="bottom-end"
    >
      <Button variant="minimal" text={session.user.name} />
    </Popover>
  )
}
