import type { MDXComponents } from 'mdx/types'
import { Code, H1, H2, H3, H4, H5, H6 } from '@blueprintjs/core'
import { Admonition } from './Admonition'
import { CodeBlock } from './CodeBlock'
import { MDXTab, MDXTabs } from './MDXTabsWrapper'
import { MermaidDiagram } from './MermaidDiagram'
import { PackageManagerTabs } from './PackageManagerTabs'
import { Step, Steps } from './Steps'
import { BPMNStub } from './stubs/BPMNStub'
import { ExcalidrawStub } from './stubs/ExcalidrawStub'
import { PlantUMLStub } from './stubs/PlantUMLStub'

export const mdxComponents: MDXComponents = {
  // ── HTML element overrides ──────────────────────────────────────────────
  h1: ({ children, ...props }) => <H1 {...props}>{children}</H1>,
  h2: ({ children, ...props }) => <H2 {...props}>{children}</H2>,
  h3: ({ children, ...props }) => <H3 {...props}>{children}</H3>,
  h4: ({ children, ...props }) => <H4 {...props}>{children}</H4>,
  h5: ({ children, ...props }) => <H5 {...props}>{children}</H5>,
  h6: ({ children, ...props }) => <H6 {...props}>{children}</H6>,

  // Inline code → Blueprint Code
  code: ({ children, ...props }) => <Code {...props}>{children}</Code>,

  // Pre (code block) → CodeBlock with copy button
  // Shiki has already transformed the content; we just wrap with our shell.
  // The 'code' override above fires for inline code; 'pre' fires for blocks.
  pre: ({ children, ...props }) => (
    <CodeBlock {...(props as React.HTMLAttributes<HTMLPreElement>)}>
      {children}
    </CodeBlock>
  ),

  // ── Named MDX components ────────────────────────────────────────────────
  Admonition,
  Steps,
  Step,
  PackageManagerTabs,
  // Tabs / Tab wrap Blueprint's Tabs — aliased to avoid name collision
  Tabs: MDXTabs,
  Tab: MDXTab,
  Mermaid: MermaidDiagram,
  Excalidraw: ExcalidrawStub,
  PlantUML: PlantUMLStub,
  BPMN: BPMNStub,
}
