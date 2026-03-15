import { Pre } from '@blueprintjs/core'
import { useCallback, useRef, useState } from 'react'

const LANGUAGE_RE = /language-(\w+)/

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode
}

export function CodeBlock({ children, className, style, ...props }: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(() => {
    const text = preRef.current?.textContent ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(setCopied, 2000, false)
    })
  }, [])

  // Extract language from Shiki's class: "shiki blueprint-dark" + possible language class
  const lang = extractLanguage(className)

  return (
    <div className="mdx-pre">
      <Pre ref={preRef} className={className} style={style} {...props}>
        {children}
      </Pre>
      {lang && <span className="mdx-lang-badge">{lang}</span>}
      <button type="button" className="mdx-copy-btn" onClick={copyToClipboard}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function extractLanguage(className?: string): string | null {
  if (!className)
    return null
  // Shiki adds `language-xxx` class on the code element, or we look in pre's class
  const match = className.match(LANGUAGE_RE)
  return match ? (match[1] ?? null) : null
}
