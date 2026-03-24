import { useEffect, useId, useRef, useState } from 'react'

const COLON_RE = /:/g

interface MermaidDiagramProps {
  chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const id = useId().replace(COLON_RE, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    import('mermaid')
      .then(({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            background: '#1c2127',
            primaryColor: '#2d72d2',
            primaryTextColor: '#c5cbd3',
            lineColor: '#5f6b7c',
          },
        })
        return mermaid.render(`mermaid-${id}`, chart)
      })
      .then(({ svg: rendered }) => {
        if (!cancelled)
          setSvg(rendered)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(String(err))
      })

    return () => {
      cancelled = true
    }
  }, [chart, id])

  if (error) {
    return (
      <div className="mdx-diagram-stub">
        <span>
          Mermaid render error:
          {error}
        </span>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="mdx-diagram-stub" ref={containerRef}>
        <span>Rendering diagram…</span>
      </div>
    )
  }

  return (
    <div
      className="mdx-mermaid"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid output is sanitized SVG
      // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
