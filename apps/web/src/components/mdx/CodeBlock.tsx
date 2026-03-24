import { Pre } from '@blueprintjs/core'
import { useCallback, useRef, useState } from 'react'

const LANGUAGE_RE = /language-(\w+)/

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  'children'?: React.ReactNode
  'data-filename'?: string
}

export function CodeBlock({ children, className, style, 'data-filename': filename, ...props }: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(() => {
    const text = preRef.current?.textContent ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(setCopied, 2000, false)
    })
  }, [])

  const lang = extractLanguage(className)

  return (
    <div className="mdx-pre">
      {filename && <div className="mdx-filename">{filename}</div>}
      <Pre ref={preRef} className={className} style={style} {...props}>
        {children}
      </Pre>
      {!filename && lang && <span className="mdx-lang-badge">{lang}</span>}
      {filename && <span className="mdx-lang-badge">{lang ?? filename.split('.').pop()}</span>}
      <button type="button" className="mdx-copy-btn" onClick={copyToClipboard}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function extractLanguage(className?: string): string | null {
  if (!className)
    return null
  const match = className.match(LANGUAGE_RE)
  return match ? (match[1] ?? null) : null
}
