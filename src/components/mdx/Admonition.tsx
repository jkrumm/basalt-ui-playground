import { Callout, Intent } from '@blueprintjs/core'

type AdmonitionType = 'note' | 'tip' | 'warning' | 'danger'

const intentMap: Record<AdmonitionType, Intent> = {
  note: Intent.PRIMARY,
  tip: Intent.SUCCESS,
  warning: Intent.WARNING,
  danger: Intent.DANGER,
}

interface AdmonitionProps {
  type?: AdmonitionType
  title?: string
  children: React.ReactNode
}

export function Admonition({ type = 'note', title, children }: AdmonitionProps) {
  return (
    <Callout intent={intentMap[type]} title={title} className="mdx-admonition">
      {children}
    </Callout>
  )
}
