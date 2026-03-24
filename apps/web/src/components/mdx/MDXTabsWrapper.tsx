import { Tab, Tabs } from '@blueprintjs/core'
import * as React from 'react'
import { useState } from 'react'

interface MDXTabProps {
  id: string
  title: string
  children: React.ReactNode
}

interface MDXTabsProps {
  defaultTab?: string
  children: React.ReactNode
}

// Data container — MDXTabs reads props off these children
export function MDXTab({ children }: MDXTabProps) {
  return <>{children}</>
}

export function MDXTabs({ defaultTab, children }: MDXTabsProps) {
  // Flatten children and filter to valid React elements
  const tabs = (Array.isArray(children) ? children : [children]).filter(
    (child): child is React.ReactElement<MDXTabProps> => React.isValidElement(child),
  )

  const firstId = tabs[0]?.props?.id ?? ''
  const [selected, setSelected] = useState(defaultTab ?? firstId)

  return (
    <div className="mdx-tabs">
      <Tabs
        id="mdx-tabs"
        selectedTabId={selected}
        onChange={id => setSelected(String(id))}
        animate={false}
      >
        {tabs.map(tab => (
          <Tab
            key={tab.props.id}
            id={tab.props.id}
            title={tab.props.title}
            panel={<div>{tab.props.children}</div>}
          />
        ))}
      </Tabs>
    </div>
  )
}
